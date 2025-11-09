"use client";

import { useMemo, useState } from "react";
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

type BugReportRow = {
  id: string;
  type: BugReportTypeValue;
  status: BugReportStatusValue;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  screenshotUrl: string | null;
  screenshotPublicId: string | null;
  screenshotWidth: number | null;
  screenshotHeight: number | null;
  screenshotBytes: number | null;
};

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
  const [feedback, setFeedback] = useState<FeedbackState>({ status: "idle" });
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>(
    {}
  );

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
  };

  const clearStatusFilters = () => setStatusFilters(new Set());
  const clearTypeFilters = () => setTypeFilters(new Set());

  const resetFilters = () => {
    clearStatusFilters();
    clearTypeFilters();
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

  const handleStatusChange = async (
    reportId: string,
    nextStatus: BugReportStatusValue
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
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          payload?.error ?? "Impossible de mettre à jour le statut.";
        throw new Error(message);
      }

      const payload = await response.json().catch(() => null);
      const updated = payload?.bugReport as BugReportRow | undefined;

      if (!updated) {
        throw new Error("Réponse inattendue du serveur.");
      }

      setBugReports((previous) =>
        previous.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: updated.status,
                updatedAt: updated.updatedAt,
                resolvedAt: updated.resolvedAt,
              }
            : report
        )
      );

      setFeedback({
        status: "success",
        message: "Le statut du signalement a été mis à jour.",
      });
    } catch (error) {
      console.error("Bug report status update failed", error);
      setFeedback({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Mise à jour du statut impossible.",
      });
    } finally {
      setPendingUpdates((previous) => {
        const { [reportId]: _omit, ...rest } = previous;
        return rest;
      });
    }
  };

  const showReset =
    statusFilters.size > 0 ||
    typeFilters.size > 0 ||
    filteredReports.length === 0;

  return (
    <section>
      <header className="fr-mb-4w">
        <h2 className="fr-text--lg fr-mb-1w">Signalements</h2>
        <p className="fr-text--sm fr-text-mention--grey">
          {filteredReports.length} résultat(s) affiché(s) sur{" "}
          {bugReports.length}.
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
          <p className="fr-alert__title">Statut mis à jour</p>
          <p className="fr-alert__desc">{feedback.message}</p>
        </div>
      ) : null}

      {feedback.status === "error" ? (
        <div className="fr-alert fr-alert--error fr-mt-3w" role="alert">
          <p className="fr-alert__title">Mise à jour impossible</p>
          <p className="fr-alert__desc">{feedback.message}</p>
        </div>
      ) : null}

      <div className="fr-table fr-table--layout-fixed fr-mt-3w">
        <div className="fr-table__content">
          <table>
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Description</th>
                <th scope="col">Statut</th>
                <th scope="col">Capture</th>
                <th scope="col">Dernière mise à jour</th>
                <th scope="col" className="fr-text--right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
                      Aucun signalement ne correspond aux filtres sélectionnés.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
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
                        <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
                          #{report.id}
                        </p>
                      </td>
                      <td>
                        <p className="fr-text--md fr-text--bold fr-mb-1v">
                          {report.title}
                        </p>
                        <p className="fr-text--sm fr-mb-1w">
                          {report.description}
                        </p>
                        <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
                          Créé le{" "}
                          {dateFormatter.format(new Date(report.createdAt))}
                        </p>
                      </td>
                      <td>
                        <span
                          className={`fr-badge ${
                            BUG_REPORT_STATUS_BADGES[report.status]
                          } fr-mb-1w`}
                        >
                          {BUG_REPORT_STATUS_LABELS[report.status]}
                        </span>
                      </td>
                      <td>
                        {report.screenshotUrl ? (
                          <div className="fr-download">
                            <p className="fr-download__detail">
                              {report.screenshotBytes != null
                                ? `${Math.max(
                                    1,
                                    Math.round(report.screenshotBytes / 1024)
                                  )} Ko`
                                : "Capture fournie"}
                              <br />
                              {report.screenshotWidth && report.screenshotHeight
                                ? `${report.screenshotWidth}×${report.screenshotHeight}px`
                                : null}
                            </p>
                            <a
                              className="fr-download__link"
                              href={report.screenshotUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Ouvrir
                              <span className="fr-link__detail">
                                nouvelle fenêtre
                              </span>
                            </a>
                          </div>
                        ) : (
                          <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
                            Aucune capture
                          </p>
                        )}
                      </td>
                      <td>
                        <p className="fr-text--sm fr-mb-0">
                          {report.resolvedAt
                            ? dateFormatter.format(new Date(report.resolvedAt))
                            : dateFormatter.format(new Date(report.updatedAt))}
                        </p>
                        <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
                          {report.resolvedAt
                            ? "Résolu"
                            : "Dernière mise à jour"}
                        </p>
                      </td>
                      <td className="fr-text--right">
                        <label
                          className="fr-label fr-text--xs fr-text-mention--grey"
                          htmlFor={`bug-report-status-${report.id}`}
                        >
                          Changer le statut
                        </label>
                        <select
                          id={`bug-report-status-${report.id}`}
                          className="fr-select fr-mt-1w"
                          value={report.status}
                          disabled={isUpdating}
                          onChange={(event) =>
                            handleStatusChange(
                              report.id,
                              event.target.value as BugReportStatusValue
                            )
                          }
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {BUG_REPORT_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
