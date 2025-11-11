"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./AdminBugReportsDashboard.module.css";
import {
  BUG_REPORT_STATUS_BADGES,
  BUG_REPORT_STATUS_LABELS,
  BUG_REPORT_STATUS_ORDER,
  BUG_REPORT_TYPE_BADGES,
  BUG_REPORT_TYPE_LABELS,
  compareBugReportStatuses,
} from "@/lib/bugReports";

type BugReportStatusValue = (typeof BUG_REPORT_STATUS_ORDER)[number];
type BugReportTypeValue = keyof typeof BUG_REPORT_TYPE_LABELS;

type BugReportCommentAuthor = {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

type BugReportCommentRow = {
  id: string;
  message: string;
  createdAt: string;
  author: BugReportCommentAuthor | null;
};

type BugReportRow = {
  id: string;
  type: BugReportTypeValue;
  status: BugReportStatusValue;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  githubCommitUrl: string | null;
  screenshotUrl: string | null;
  screenshotPublicId: string | null;
  screenshotWidth: number | null;
  screenshotHeight: number | null;
  screenshotBytes: number | null;
  comments: BugReportCommentRow[];
};

type BugReportUpdatePayload = Omit<BugReportRow, "comments">;

type AdminBugReportsDashboardProps = {
  initialReports: BugReportRow[];
};

type FeedbackState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`fr-btn fr-btn--sm ${active ? "" : "fr-btn--tertiary"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

const statusOptions = BUG_REPORT_STATUS_ORDER;
const typeOptions = Object.keys(BUG_REPORT_TYPE_LABELS) as BugReportTypeValue[];
const PAGE_SIZE = 10;

type StatusBadgeSelectorProps = {
  reportId: string;
  status: BugReportStatusValue;
  isUpdating: boolean;
  onChange: (nextStatus: BugReportStatusValue) => void;
};

function StatusBadgeSelector({
  reportId,
  status,
  isUpdating,
  onChange,
}: StatusBadgeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = `bug-report-status-menu-${reportId}`;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (isUpdating) {
      return;
    }
    setIsOpen((previous) => !previous);
  };

  const handleSelect = (nextStatus: BugReportStatusValue) => {
    if (nextStatus !== status) {
      onChange(nextStatus);
    }
    setIsOpen(false);
  };

  return (
    <div className={styles.statusSelector} ref={menuRef}>
      <button
        type="button"
        className={`fr-badge ${BUG_REPORT_STATUS_BADGES[status]} ${styles.statusBadgeButton} p-4`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={handleToggle}
        disabled={isUpdating}
      >
        {BUG_REPORT_STATUS_LABELS[status]}
        <span aria-hidden className={styles.statusBadgeCaret}>
          ▾
        </span>
      </button>
      {isOpen ? (
        <ul
          id={menuId}
          role="listbox"
          className={styles.statusMenu}
          aria-label="Choisir un statut"
        >
          {statusOptions.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === status}
                className={`${styles.statusMenuButton}${
                  option === status ? ` ${styles.statusMenuButtonActive}` : ""
                }`}
                onClick={() => handleSelect(option)}
                disabled={isUpdating}
              >
                {BUG_REPORT_STATUS_LABELS[option]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AdminBugReportsDashboard({
  initialReports,
}: AdminBugReportsDashboardProps) {
  const [bugReports, setBugReports] = useState<BugReportRow[]>(initialReports);
  const [statusFilters, setStatusFilters] = useState<Set<BugReportStatusValue>>(
    () => new Set()
  );
  const [typeFilters, setTypeFilters] = useState<Set<BugReportTypeValue>>(
    () => new Set()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackState>({ status: "idle" });
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>(
    {}
  );
  const [focusedReport, setFocusedReport] = useState<BugReportRow | null>(null);
  const [commitModalState, setCommitModalState] = useState<{
    reportId: string;
    nextStatus: BugReportStatusValue;
  } | null>(null);
  const [commitUrlInput, setCommitUrlInput] = useState("");
  const [commitModalError, setCommitModalError] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<BugReportTypeValue>("BUG");
  const [detailFormError, setDetailFormError] = useState<string | null>(null);
  const [pendingCommentIds, setPendingCommentIds] = useState<Record<string, boolean>>({});
  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    []
  );

  const toggleStatusFilter = (status: BugReportStatusValue) => {
    setStatusFilters((previous) => {
      const next = new Set(previous);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
    setCurrentPage(1);
  };

  const toggleTypeFilter = (type: BugReportTypeValue) => {
    setTypeFilters((previous) => {
      const next = new Set(previous);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
    setCurrentPage(1);
  };

  const clearStatusFilters = () => {
    setStatusFilters(new Set());
    setCurrentPage(1);
  };
  const clearTypeFilters = () => {
    setTypeFilters(new Set());
    setCurrentPage(1);
  };

  const resetFilters = () => {
    clearStatusFilters();
    clearTypeFilters();
  };

  const openReportDetail = (report: BugReportRow) => {
    setFocusedReport(report);
  };

  const closeReportDetail = () => {
    setFocusedReport(null);
  };

  const filteredReports = useMemo(() => {
    return bugReports
      .filter((report) => {
        const matchStatus =
          statusFilters.size === 0 || statusFilters.has(report.status);
        const matchType =
          typeFilters.size === 0 || typeFilters.has(report.type);
        return matchStatus && matchType;
      })
      .sort((a, b) => {
        const statusComparison = compareBugReportStatuses(a.status, b.status);
        if (statusComparison !== 0) {
          return statusComparison;
        }
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [bugReports, statusFilters, typeFilters]);

  const totalPages = useMemo(() => {
    if (filteredReports.length === 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  }, [filteredReports.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!focusedReport) {
      setIsEditingDetails(false);
      setEditTitle("");
      setEditDescription("");
      setEditType("BUG");
      setDetailFormError(null);
      setCommentDraft("");
      setCommentError(null);
      return;
    }

    setIsEditingDetails(false);
    setEditTitle(focusedReport.title);
    setEditDescription(focusedReport.description);
    setEditType(focusedReport.type);
    setDetailFormError(null);
    setCommentDraft("");
    setCommentError(null);
  }, [focusedReport]);

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReports.slice(start, start + PAGE_SIZE);
  }, [filteredReports, currentPage]);

  const startIndex =
    filteredReports.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex =
    filteredReports.length === 0
      ? 0
      : Math.min(filteredReports.length, currentPage * PAGE_SIZE);
  const shouldShowPagination = filteredReports.length > PAGE_SIZE;

  const isCommitModalOpen = commitModalState !== null;
  const commitModalReport = commitModalState
    ? bugReports.find((report) => report.id === commitModalState.reportId) ??
      null
    : null;
  const isCommitSubmitting = commitModalState
    ? Boolean(pendingUpdates[commitModalState.reportId])
    : false;
  const commitInputId = commitModalState
    ? `github-commit-url-${commitModalState.reportId}`
    : "github-commit-url";
  const commitHintId = `${commitInputId}-hint`;
  const commitErrorId = commitModalError ? `${commitInputId}-error` : undefined;
  const commitInputDescribedBy =
    [commitHintId, commitErrorId].filter(Boolean).join(" ") || undefined;

  const closeCommitModal = () => {
    setCommitModalState(null);
    setCommitUrlInput("");
    setCommitModalError(null);
  };

  const performStatusChange = async (
    reportId: string,
    nextStatus: BugReportStatusValue,
    githubCommitUrl: string | null
  ) => {
    setPendingUpdates((previous) => ({ ...previous, [reportId]: true }));
    setFeedback({ status: "idle" });

    try {
      const response = await fetch(`/api/admin/bug-reports/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
          githubCommitUrl: nextStatus === "DONE" ? githubCommitUrl : null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          payload?.error ?? "Impossible de mettre à jour le statut.";
        throw new Error(message);
      }

      const payload = await response.json().catch(() => null);
      const updated = payload?.bugReport as BugReportUpdatePayload | undefined;

      if (!updated) {
        throw new Error("Réponse inattendue du serveur.");
      }

      setBugReports((previous) =>
        previous.map((report) =>
          report.id === reportId
            ? {
                ...report,
                title: updated.title,
                description: updated.description,
                type: updated.type,
                status: updated.status,
                updatedAt: updated.updatedAt,
                resolvedAt: updated.resolvedAt,
                githubCommitUrl: updated.githubCommitUrl ?? null,
              }
            : report
        )
      );

      setFocusedReport((previous) =>
        previous && previous.id === reportId
          ? {
              ...previous,
              title: updated.title,
              description: updated.description,
              type: updated.type,
              status: updated.status,
              updatedAt: updated.updatedAt,
              resolvedAt: updated.resolvedAt,
              githubCommitUrl: updated.githubCommitUrl ?? null,
            }
          : previous
      );

      setFeedback({
        status: "success",
        message: "Le statut du signalement a été mis à jour.",
      });

      return true;
    } catch (error) {
      console.error("Bug report status update failed", error);
      setFeedback({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Mise à jour du statut impossible.",
      });
      return false;
    } finally {
      setPendingUpdates((previous) => {
        const { [reportId]: _omit, ...rest } = previous;
        return rest;
      });
    }
  };

  const handleStatusChange = (
    reportId: string,
    nextStatus: BugReportStatusValue
  ) => {
    if (nextStatus === "DONE") {
      const currentReport = bugReports.find((report) => report.id === reportId);
      setCommitModalState({ reportId, nextStatus });
      setCommitUrlInput(currentReport?.githubCommitUrl ?? "");
      setCommitModalError(null);
      return;
    }

    void performStatusChange(reportId, nextStatus, null);
  };

  const handleCommitModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!commitModalState) {
      return;
    }

    setCommitModalError(null);

    const trimmed = commitUrlInput.trim();
    let normalizedUrl: string | null = null;

    if (trimmed.length > 0) {
      try {
        const url = new URL(trimmed);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          throw new Error();
        }
        normalizedUrl = url.toString();
      } catch {
        setCommitModalError(
          "Lien de commit GitHub invalide. Utilisez un lien commençant par http:// ou https://."
        );
        return;
      }
    }

    const success = await performStatusChange(
      commitModalState.reportId,
      commitModalState.nextStatus,
      normalizedUrl
    );

    if (success) {
      closeCommitModal();
    }
  };

  const handleStartEditDetails = () => {
    if (!focusedReport) {
      return;
    }
    setIsEditingDetails(true);
    setDetailFormError(null);
    setEditTitle(focusedReport.title);
    setEditDescription(focusedReport.description);
    setEditType(focusedReport.type);
  };

  const handleCancelEditDetails = () => {
    if (!focusedReport) {
      return;
    }
    setIsEditingDetails(false);
    setDetailFormError(null);
    setEditTitle(focusedReport.title);
    setEditDescription(focusedReport.description);
    setEditType(focusedReport.type);
  };

  const handleDetailsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!focusedReport) {
      return;
    }

    const trimmedTitle = editTitle.trim();
    const trimmedDescription = editDescription.trim();

    if (trimmedTitle.length === 0) {
      setDetailFormError("Le titre ne peut pas être vide.");
      return;
    }

    if (trimmedDescription.length === 0) {
      setDetailFormError("La description ne peut pas être vide.");
      return;
    }

    setDetailFormError(null);
    setPendingUpdates((previous) => ({
      ...previous,
      [focusedReport.id]: true,
    }));
    setFeedback({ status: "idle" });

    try {
      const response = await fetch(`/api/admin/bug-reports/${focusedReport.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          description: trimmedDescription,
          type: editType,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          payload?.error ?? "Impossible de mettre à jour le signalement.";
        throw new Error(message);
      }

      const payload = await response.json().catch(() => null);
      const updated = payload?.bugReport as
        | BugReportUpdatePayload
        | undefined;

      if (!updated) {
        throw new Error("Réponse inattendue du serveur.");
      }

      setBugReports((previous) =>
        previous.map((report) =>
          report.id === focusedReport.id
            ? {
                ...report,
                title: updated.title,
                description: updated.description,
                type: updated.type,
                updatedAt: updated.updatedAt,
              }
            : report,
        ),
      );

      setFocusedReport((previous) =>
        previous && previous.id === focusedReport.id
          ? {
              ...previous,
              title: updated.title,
              description: updated.description,
              type: updated.type,
              updatedAt: updated.updatedAt,
            }
          : previous,
      );

      setDetailFormError(null);
      setIsEditingDetails(false);
      setFeedback({
        status: "success",
        message: "Le signalement a été mis à jour.",
      });
    } catch (error) {
      console.error("Bug report detail update failed", error);
      setFeedback({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Mise à jour du signalement impossible.",
      });
    } finally {
      setPendingUpdates((previous) => {
        const { [focusedReport.id]: _omit, ...rest } = previous;
        return rest;
      });
    }
  };

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!focusedReport) {
      return;
    }

    const trimmed = commentDraft.trim();

    if (trimmed.length === 0) {
      setCommentError("Le commentaire ne peut pas être vide.");
      return;
    }

    setCommentError(null);
    setPendingCommentIds((previous) => ({
      ...previous,
      [focusedReport.id]: true,
    }));

    try {
      const response = await fetch(
        `/api/admin/bug-reports/${focusedReport.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ message: trimmed }),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          payload?.error ?? "Impossible d'ajouter le commentaire.";
        throw new Error(message);
      }

      const payload = await response.json().catch(() => null);
      const created = payload?.comment as BugReportCommentRow | undefined;

      if (!created) {
        throw new Error("Réponse inattendue du serveur.");
      }

      setBugReports((previous) =>
        previous.map((report) =>
          report.id === focusedReport.id
            ? {
                ...report,
                comments: [...report.comments, created],
              }
            : report,
        ),
      );

      setFocusedReport((previous) =>
        previous && previous.id === focusedReport.id
          ? {
              ...previous,
              comments: [...previous.comments, created],
            }
          : previous,
      );

      setCommentDraft("");
      setFeedback({
        status: "success",
        message: "Commentaire ajouté.",
      });
    } catch (error) {
      console.error("Bug report comment creation failed", error);
      setCommentError(
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter le commentaire.",
      );
    } finally {
      setPendingCommentIds((previous) => {
        const { [focusedReport.id]: _omit, ...rest } = previous;
        return rest;
      });
    }
  };
  const showReset =
    statusFilters.size > 0 ||
    typeFilters.size > 0 ||
    filteredReports.length === 0;
  const isModalOpen = focusedReport !== null;
  const detailsSubmitting = focusedReport
    ? Boolean(pendingUpdates[focusedReport.id])
    : false;
  const isCommentSubmitting = focusedReport
    ? Boolean(pendingCommentIds[focusedReport.id])
    : false;

  const getCommentAuthorLabel = (comment: BugReportCommentRow) => {
    if (!comment.author) {
      return "Auteur supprimé";
    }

    const { firstName, lastName, email } = comment.author;
    const parts = [firstName, lastName].filter(
      (value): value is string => Boolean(value && value.trim().length > 0),
    );
    if (parts.length > 0) {
      return parts.join(" ");
    }
    if (email && email.trim().length > 0) {
      return email;
    }
    return "Auteur inconnu";
  };

  return (
    <section>
      <header className="fr-mb-4w">
        <h2 className="fr-text--lg fr-mb-1w">Signalements</h2>
        <p className="fr-text--sm fr-text-mention--grey">
          {filteredReports.length === 0 ? (
            <>0 résultat affiché sur {bugReports.length}.</>
          ) : (
            <>
              Résultats {startIndex}-{endIndex} sur {filteredReports.length}{" "}
              (total {bugReports.length}).
            </>
          )}
        </p>
      </header>

      <div className="fr-flow">
        <div className="fr-btns-group fr-btns-group--inline fr-btns-group--sm">
          <FilterButton
            label="Tous les statuts"
            active={statusFilters.size === 0}
            onClick={clearStatusFilters}
          />
          {statusOptions.map((status) => (
            <FilterButton
              key={status}
              label={BUG_REPORT_STATUS_LABELS[status]}
              active={statusFilters.has(status)}
              onClick={() => toggleStatusFilter(status)}
            />
          ))}
        </div>

        <div className="fr-btns-group fr-btns-group--inline fr-btns-group--sm">
          <FilterButton
            label="Tous les types"
            active={typeFilters.size === 0}
            onClick={clearTypeFilters}
          />
          {typeOptions.map((type) => (
            <FilterButton
              key={type}
              label={BUG_REPORT_TYPE_LABELS[type]}
              active={typeFilters.has(type)}
              onClick={() => toggleTypeFilter(type)}
            />
          ))}
        </div>

        {showReset ? (
          <button
            type="button"
            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-self-end"
            onClick={resetFilters}
          >
            Réinitialiser
          </button>
        ) : null}
      </div>

      {feedback.status === "success" ? (
        <div className="fr-alert fr-alert--success fr-mt-3w" role="status">
          <p className="fr-alert__title">Action réussie</p>
          <p className="fr-alert__desc">{feedback.message}</p>
        </div>
      ) : null}

      {feedback.status === "error" ? (
        <div className="fr-alert fr-alert--error fr-mt-3w" role="alert">
          <p className="fr-alert__title">Erreur</p>
          <p className="fr-alert__desc">{feedback.message}</p>
        </div>
      ) : null}

      <div
        className={`fr-table fr-table--layout-fixed fr-mt-3w ${styles.tableContainer}`}
      >
        <div className={`fr-table__content ${styles.tableContent}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Description</th>
                <th scope="col">Statut</th>
                <th scope="col" className="fr-text--right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
                      Aucun signalement ne correspond aux filtres sélectionnés.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedReports.map((report) => {
                  const isUpdating = Boolean(pendingUpdates[report.id]);

                  return (
                    <tr key={report.id}>
                      <td>
                        <span
                          className={`fr-badge ${
                            BUG_REPORT_TYPE_BADGES[report.type]
                          }`}
                        >
                          {BUG_REPORT_TYPE_LABELS[report.type]}
                        </span>
                      </td>
                      <td className={styles.descriptionCell}>
                        <p className="fr-text--md fr-text--bold fr-mb-1v">
                          {report.title}
                        </p>
                        <p
                          className={`fr-text--sm fr-mb-1w ${styles.descriptionPreview}`}
                        >
                          {report.description}
                        </p>
                        <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
                          Créé le{" "}
                          {dateFormatter.format(new Date(report.createdAt))}
                        </p>
                      </td>
                      <td>
                        <StatusBadgeSelector
                          reportId={report.id}
                          status={report.status}
                          isUpdating={isUpdating}
                          onChange={(nextStatus) =>
                            handleStatusChange(report.id, nextStatus)
                          }
                        />
                      </td>
                      <td className={`fr-text--right ${styles.actionsCell}`}>
                        <button
                          type="button"
                          className={`fr-btn fr-btn--sm fr-btn--secondary ${styles.actionButton} align-center justify-center`}
                          onClick={() => openReportDetail(report)}
                          disabled={isUpdating}
                        >
                          Voir
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {shouldShowPagination ? (
          <div className="fr-table__footer fr-table__footer--middle">
            <nav
              className="fr-pagination"
              role="navigation"
              aria-label="Pagination des signalements"
            >
              <ul className="fr-pagination__list">
                <li>
                  <button
                    type="button"
                    className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--label"
                    onClick={() =>
                      setCurrentPage((previous) => Math.max(1, previous - 1))
                    }
                    aria-label="Page précédente"
                    disabled={currentPage === 1}
                  >
                    Page précédente
                  </button>
                </li>
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <li key={pageNumber}>
                      <button
                        type="button"
                        className="fr-pagination__link"
                        aria-current={
                          pageNumber === currentPage ? "page" : undefined
                        }
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    </li>
                  );
                })}
                <li>
                  <button
                    type="button"
                    className="fr-pagination__link fr-pagination__link--next fr-pagination__link--label"
                    onClick={() =>
                      setCurrentPage((previous) =>
                        Math.min(totalPages, previous + 1)
                      )
                    }
                    aria-label="Page suivante"
                    disabled={currentPage === totalPages}
                  >
                    Page suivante
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        ) : null}
      </div>

      <div
        className={`fr-modal${isModalOpen ? " fr-modal--opened" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bug-report-detail-modal-title"
        id="bug-report-detail-modal"
      >
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className={`fr-modal__body ${styles.modalBody}`}>
            <div className={`fr-modal__header ${styles.modalHeader}`}>
              <button
                className="fr-btn fr-btn--close"
                type="button"
                title="Fermer"
                onClick={closeReportDetail}
              >
                Fermer
              </button>
            </div>
            <div className={`fr-modal__content fr-flow ${styles.modalContent}`}>
              {focusedReport ? (
                <article className={styles.reportDetail}>
                  <header className={styles.detailHeader}>
                    <div>
                      <p
                        className={`fr-text--xs fr-text-mention--grey fr-mb-1v ${styles.reference}`}
                      >
                        #{focusedReport.id}
                      </p>
                      <h1
                        className="fr-h4 fr-mb-0"
                        id="bug-report-detail-modal-title"
                      >
                        {isEditingDetails ? editTitle : focusedReport.title}
                      </h1>
                    </div>
                    <div className={styles.detailHeaderRight}>
                      <div
                        className={`fr-badges-group fr-badges-group--sm ${styles.badgeGroup}`}
                      >
                        <span
                          className={`fr-badge ${
                            BUG_REPORT_TYPE_BADGES[focusedReport.type]
                          }`}
                        >
                          {BUG_REPORT_TYPE_LABELS[focusedReport.type]}
                        </span>
                        <span
                          className={`fr-badge ${
                            BUG_REPORT_STATUS_BADGES[focusedReport.status]
                          }`}
                        >
                          {BUG_REPORT_STATUS_LABELS[focusedReport.status]}
                        </span>
                      </div>
                      <div className={styles.detailActions}>
                        {!isEditingDetails ? (
                          <button
                            type="button"
                            className="fr-btn fr-btn--secondary fr-btn--sm"
                            onClick={handleStartEditDetails}
                            disabled={detailsSubmitting}
                          >
                            Modifier
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </header>

                  {isEditingDetails ? (
                    <form
                      className={`fr-flow ${styles.detailForm}`}
                      onSubmit={handleDetailsSubmit}
                    >
                      <div className="fr-input-group">
                        <label className="fr-label" htmlFor="bug-report-title-input">
                          Titre
                        </label>
                        <input
                          className="fr-input"
                          id="bug-report-title-input"
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                          maxLength={200}
                          disabled={detailsSubmitting}
                        />
                      </div>
                      <div className="fr-select-group">
                        <label className="fr-label" htmlFor="bug-report-type-select">
                          Type
                        </label>
                        <select
                          className="fr-select"
                          id="bug-report-type-select"
                          value={editType}
                          onChange={(event) =>
                            setEditType(event.target.value as BugReportTypeValue)
                          }
                          disabled={detailsSubmitting}
                        >
                          {typeOptions.map((option) => (
                            <option key={option} value={option}>
                              {BUG_REPORT_TYPE_LABELS[option]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="fr-input-group">
                        <label
                          className="fr-label"
                          htmlFor="bug-report-description-input"
                        >
                          Description
                        </label>
                        <textarea
                          className="fr-input"
                          id="bug-report-description-input"
                          value={editDescription}
                          onChange={(event) =>
                            setEditDescription(event.target.value)
                          }
                          rows={8}
                          maxLength={5000}
                          disabled={detailsSubmitting}
                        />
                      </div>
                      {detailFormError ? (
                        <p className="fr-error-text" role="alert">
                          {detailFormError}
                        </p>
                      ) : null}
                      <div className={styles.detailFormButtons}>
                        <button
                          type="button"
                          className="fr-btn fr-btn--secondary"
                          onClick={handleCancelEditDetails}
                          disabled={detailsSubmitting}
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="fr-btn"
                          disabled={detailsSubmitting}
                        >
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className={`fr-text--md ${styles.detailDescription}`}>
                      {focusedReport.description}
                    </p>
                  )}

                  <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                      <span className="fr-text--xs fr-text-mention--grey">
                        Créé le
                      </span>
                      <span className="fr-text--sm">
                        {dateFormatter.format(
                          new Date(focusedReport.createdAt)
                        )}
                      </span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className="fr-text--xs fr-text-mention--grey">
                        Dernière mise à jour
                      </span>
                      <span className="fr-text--sm">
                        {dateFormatter.format(
                          new Date(focusedReport.updatedAt)
                        )}
                      </span>
                    </div>
                    {focusedReport.resolvedAt ? (
                      <div className={styles.metaItem}>
                        <span className="fr-text--xs fr-text-mention--grey">
                          Résolu le
                        </span>
                        <span className="fr-text--sm">
                          {dateFormatter.format(
                            new Date(focusedReport.resolvedAt)
                          )}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {focusedReport.githubCommitUrl ? (
                    <a
                      className={`fr-btn fr-btn--sm fr-btn--secondary ${styles.commitButton}`}
                      href={focusedReport.githubCommitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Voir le commit GitHub associé
                    </a>
                  ) : null}

                  {focusedReport.screenshotUrl ? (
                    <figure className={styles.screenshotCard}>
                      <div className={styles.screenshotImageWrapper}>
                        <img
                          src={focusedReport.screenshotUrl}
                          alt="Capture d’écran partagée avec le signalement"
                          loading="lazy"
                          width={focusedReport.screenshotWidth ?? undefined}
                          height={focusedReport.screenshotHeight ?? undefined}
                        />
                      </div>
                      <figcaption>
                        <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
                          {focusedReport.screenshotBytes != null
                            ? `${Math.max(
                                1,
                                Math.round(focusedReport.screenshotBytes / 1024)
                              )} Ko`
                            : "Capture fournie"}
                          {focusedReport.screenshotWidth &&
                          focusedReport.screenshotHeight
                            ? ` • ${focusedReport.screenshotWidth}×${focusedReport.screenshotHeight}px`
                            : null}
                        </p>
                        <a
                          className="fr-link fr-link--sm"
                          href={focusedReport.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ouvrir la capture (nouvelle fenêtre)
                        </a>
                      </figcaption>
                    </figure>
                  ) : (
                    <div className={styles.emptyScreenshot}>
                      <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
                        Aucune capture fournie.
                      </p>
                    </div>
                  )}

                  <section className={styles.commentSection}>
                    <h2 className="fr-h6 fr-mb-0">Commentaires internes</h2>
                    {focusedReport.comments.length === 0 ? (
                      <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
                        Aucun commentaire pour le moment.
                      </p>
                    ) : (
                      <ul className={styles.commentList}>
                        {focusedReport.comments.map((comment) => (
                          <li key={comment.id} className={styles.commentItem}>
                            <div className={styles.commentItemHeader}>
                              <span className={styles.commentAuthor}>
                                {getCommentAuthorLabel(comment)}
                              </span>
                              <span className="fr-text--xs fr-text-mention--grey">
                                {dateFormatter.format(new Date(comment.createdAt))}
                              </span>
                            </div>
                            <p className={`fr-text--sm ${styles.commentMessage}`}>
                              {comment.message}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}

                    <form
                      className={`fr-flow ${styles.commentForm}`}
                      onSubmit={handleCommentSubmit}
                    >
                      <div className="fr-input-group">
                        <label className="fr-label" htmlFor="bug-report-comment-input">
                          Nouveau commentaire
                        </label>
                        <textarea
                          className="fr-input"
                          id="bug-report-comment-input"
                          value={commentDraft}
                          onChange={(event) => setCommentDraft(event.target.value)}
                          rows={4}
                          maxLength={2000}
                          disabled={isCommentSubmitting}
                        />
                      </div>
                      {commentError ? (
                        <p className="fr-error-text" role="alert">
                          {commentError}
                        </p>
                      ) : null}
                      <div className={styles.commentFormButtons}>
                        <button
                          type="submit"
                          className="fr-btn fr-btn--sm"
                          disabled={
                            isCommentSubmitting || commentDraft.trim().length === 0
                          }
                        >
                          Publier
                        </button>
                      </div>
                    </form>
                  </section>
                </article>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fr-modal${isCommitModalOpen ? " fr-modal--opened" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bug-report-commit-modal-title"
        id="bug-report-commit-modal"
      >
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className={`fr-modal__body ${styles.modalBody}`}>
            <div className={`fr-modal__header ${styles.modalHeader}`}>
              <button
                className="fr-btn fr-btn--close"
                type="button"
                title="Fermer"
                onClick={closeCommitModal}
                disabled={isCommitSubmitting}
              >
                Fermer
              </button>
            </div>
            <div className={`fr-modal__content fr-flow ${styles.modalContent}`}>
              {commitModalState && commitModalReport ? (
                <form
                  className={`fr-flow ${styles.commitForm}`}
                  onSubmit={handleCommitModalSubmit}
                >
                  <div className={styles.commitIntro}>
                    <p className="fr-text--xs fr-text-mention--grey fr-mb-1v">
                      #{commitModalReport.id}
                    </p>
                    <h1
                      className="fr-h5 fr-mb-0"
                      id="bug-report-commit-modal-title"
                    >
                      Ajouter un lien de commit (facultatif)
                    </h1>
                    <p className="fr-text--sm fr-mb-0">
                      Ce lien sera visible sur la page publique lorsque le
                      statut passe à « Terminé ».
                    </p>
                  </div>

                  <div className="fr-input-group">
                    <label className="fr-label" htmlFor={commitInputId}>
                      Lien du commit GitHub
                      <span className="fr-hint-text" id={commitHintId}>
                        Exemple :
                        https://github.com/organisation/projet/commit/abc123
                      </span>
                    </label>
                    <input
                      className={`fr-input${
                        commitModalError ? " fr-input--error" : ""
                      }`}
                      type="url"
                      id={commitInputId}
                      name="githubCommitUrl"
                      value={commitUrlInput}
                      onChange={(event) =>
                        setCommitUrlInput(event.target.value)
                      }
                      placeholder="https://github.com/..."
                      aria-describedby={commitInputDescribedBy}
                      disabled={isCommitSubmitting}
                    />
                    {commitModalError ? (
                      <p className="fr-error-text" id={commitErrorId}>
                        {commitModalError}
                      </p>
                    ) : null}
                  </div>

                  <div className={styles.commitButtons}>
                    <button
                      type="button"
                      className="fr-btn fr-btn--secondary"
                      onClick={closeCommitModal}
                      disabled={isCommitSubmitting}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="fr-btn"
                      disabled={isCommitSubmitting}
                    >
                      Valider le statut « Terminé »
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
