"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import {
  CONTACT_TICKET_STATUS_BADGES,
  CONTACT_TICKET_STATUS_LABELS,
  CONTACT_TICKET_STATUS_ORDER,
  CONTACT_TICKET_TYPE_LABELS,
  CONTACT_TICKET_TYPE_ORDER,
  type ContactTicketStatusValue,
  type ContactTicketTypeValue,
} from "@/lib/contact";
import styles from "./AdminContactTicketsDashboard.module.css";

type ContactTicketUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
} | null;

export type ContactTicketRow = {
  id: string;
  contactType: ContactTicketTypeValue;
  status: ContactTicketStatusValue;
  name: string;
  email: string;
  function: string;
  commune?: string | null;
  organisme?: string | null;
  message: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  processedBy?: ContactTicketUser;
};

type FeedbackState =
  | { status: "success"; message: string }
  | { status: "error"; message: string }
  | null;

type AdminContactTicketsDashboardProps = {
  initialTickets: ContactTicketRow[];
};

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatUser(user: ContactTicketUser) {
  if (!user) {
    return "—";
  }
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

export function AdminContactTicketsDashboard({
  initialTickets,
}: AdminContactTicketsDashboardProps) {
  const router = useRouter();
  const [tickets, setTickets] = useState<ContactTicketRow[]>(initialTickets);
  const [statusFilters, setStatusFilters] = useState<
    Set<ContactTicketStatusValue>
  >(() => new Set(CONTACT_TICKET_STATUS_ORDER));
  const [typeFilters, setTypeFilters] = useState<Set<ContactTicketTypeValue>>(
    () => new Set()
  );
  const [searchValue, setSearchValue] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timeoutId = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);
  const [focusedTicket, setFocusedTicket] = useState<ContactTicketRow | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const {
    Component: DetailModal,
    open: openDetailModal,
    close: closeDetailModal,
  } = createModal({
    id: "admin-contact-ticket-detail-modal",
    isOpenedByDefault: false,
  });

  const statusOrder = useMemo(
    () =>
      CONTACT_TICKET_STATUS_ORDER.reduce(
        (acc, status, index) => acc.set(status, index),
        new Map<ContactTicketStatusValue, number>()
      ),
    []
  );

  const filteredTickets = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    const hasStatusFilter = statusFilters.size > 0;
    const hasTypeFilter = typeFilters.size > 0;

    return [...tickets]
      .filter((ticket) => {
        if (hasStatusFilter && !statusFilters.has(ticket.status)) {
          return false;
        }
        if (hasTypeFilter && !typeFilters.has(ticket.contactType)) {
          return false;
        }
        if (!search) {
          return true;
        }
        const haystack = [
          ticket.name,
          ticket.email,
          ticket.function,
          ticket.commune,
          ticket.organisme,
          ticket.message,
        ]
          .filter(Boolean)
          .map((value) => value!.toLowerCase());

        return haystack.some((value) => value.includes(search));
      })
      .sort((a, b) => {
        const statusComparison =
          (statusOrder.get(a.status) ?? 0) - (statusOrder.get(b.status) ?? 0);

        if (statusComparison !== 0) {
          return statusComparison;
        }

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [tickets, searchValue, statusFilters, typeFilters, statusOrder]);

  const toggleStatusFilter = (status: ContactTicketStatusValue) => {
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

  const toggleTypeFilter = (contactType: ContactTicketTypeValue) => {
    setTypeFilters((previous) => {
      const next = new Set(previous);
      if (next.has(contactType)) {
        next.delete(contactType);
      } else {
        next.add(contactType);
      }
      return next;
    });
  };

  const handleStatusChange = (
    ticket: ContactTicketRow,
    nextStatus: ContactTicketStatusValue
  ) => {
    startTransition(async () => {
      setFeedback(null);
      try {
        const response = await fetch(
          `/api/admin/contact-tickets/${ticket.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: nextStatus }),
          }
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            payload?.error ?? "Mise à jour impossible pour le moment."
          );
        }

        const payload = (await response.json()) as { ticket: ContactTicketRow };

        setTickets((previous) =>
          previous.map((item) =>
            item.id === ticket.id ? payload.ticket : item
          )
        );
        setFocusedTicket((previous) =>
          previous && previous.id === ticket.id ? payload.ticket : previous
        );
        setFeedback({
          status: "success",
          message:
            nextStatus === "RESOLVED"
              ? "Ticket marqué comme traité."
              : "Ticket rouvert.",
        });
        router.refresh();
      } catch (error) {
        setFeedback({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Une erreur est survenue pendant la mise à jour du ticket.",
        });
      }
    });
  };

  const openTicketDetail = (ticket: ContactTicketRow) => {
    setFocusedTicket(ticket);
    openDetailModal();
  };

  const resetFilters = () => {
    setStatusFilters(new Set(CONTACT_TICKET_STATUS_ORDER));
    setTypeFilters(new Set());
    setSearchValue("");
  };

  return (
    <div className="fr-flow">
      <div
        className={clsx("fr-grid-row fr-grid-row--gutters", styles.filtersRow)}
      >
        <div className="fr-col-12 fr-col-lg-6">
          <Input
            label="Rechercher"
            hintText="Filtrer par nom, email, commune ou contenu"
            nativeInputProps={{
              value: searchValue,
              onChange: (event) => setSearchValue(event.target.value),
              placeholder: "Rechercher un ticket...",
            }}
          />
          <Button
            priority="tertiary"
            iconId="fr-icon-refresh-line"
            onClick={resetFilters}
            disabled={isPending}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </div>

      <div className="fr-grid-row fr-grid-row--gutters fr-mt-4w">
        <div className="fr-col-12 fr-col-md-6">
          <Checkbox
            legend="Statut"
            classes={{ legend: "fr-text--bold" }}
            orientation="vertical"
            options={CONTACT_TICKET_STATUS_ORDER.map((status) => ({
              label: CONTACT_TICKET_STATUS_LABELS[status],
              nativeInputProps: {
                checked: statusFilters.has(status),
                onChange: () => toggleStatusFilter(status),
                id: `contact-ticket-status-${status}`,
              },
            }))}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Checkbox
            legend="Type de contact"
            classes={{ legend: "fr-text--bold" }}
            orientation="vertical"
            options={CONTACT_TICKET_TYPE_ORDER.map((contactType) => ({
              label: CONTACT_TICKET_TYPE_LABELS[contactType],
              nativeInputProps: {
                checked: typeFilters.has(contactType),
                onChange: () => toggleTypeFilter(contactType),
                id: `contact-ticket-type-${contactType}`,
              },
            }))}
          />
        </div>
      </div>

      {feedback && (
        <Alert
          severity={feedback.status === "success" ? "success" : "error"}
          title={
            feedback.status === "success" ? "Mise à jour effectuée" : "Erreur"
          }
          description={feedback.message}
          className="fr-mt-2w"
        />
      )}

      <div className="fr-table fr-table--layout-fixed fr-mt-4w">
        <table>
          <thead>
            <tr>
              <th scope="col">Demande</th>
              <th scope="col">Statut</th>
              <th scope="col">Coordonnées</th>
              <th scope="col">Créé le</th>
              <th scope="col" className="fr-text--right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="fr-text--center fr-text-mention--grey"
                >
                  Aucun ticket ne correspond à vos filtres.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => {
                const statusLabel = CONTACT_TICKET_STATUS_LABELS[ticket.status];
                const statusSeverity =
                  CONTACT_TICKET_STATUS_BADGES[ticket.status];
                const typeLabel =
                  CONTACT_TICKET_TYPE_LABELS[ticket.contactType];
                const createdAtLabel = dateTimeFormatter.format(
                  new Date(ticket.createdAt)
                );

                return (
                  <tr key={ticket.id}>
                    <td>
                      <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                        {typeLabel}
                      </p>
                      <p className="fr-text--bold fr-mb-0">{ticket.name}</p>
                      <p className="fr-mb-0">
                        {ticket.commune || ticket.organisme || "—"}
                      </p>
                    </td>
                    <td>
                      <Badge small severity={statusSeverity}>
                        {statusLabel}
                      </Badge>
                    </td>
                    <td>
                      <p className="fr-mb-0">{ticket.email}</p>
                      <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
                        {ticket.function}
                      </p>
                    </td>
                    <td>{createdAtLabel}</td>
                    <td className="fr-text--right">
                      <div className="fr-btns-group fr-btns-group--inline fr-btns-group--icon-left fr-mb-0">
                        <Button
                          priority="tertiary no outline"
                          iconId="fr-icon-eye-line"
                          onClick={() => openTicketDetail(ticket)}
                        >
                          Voir
                        </Button>
                        <Button
                          priority={
                            ticket.status === "PENDING"
                              ? "primary"
                              : "secondary"
                          }
                          iconId={
                            ticket.status === "PENDING"
                              ? "fr-icon-check-line"
                              : "fr-icon-refresh-line"
                          }
                          onClick={() =>
                            handleStatusChange(
                              ticket,
                              ticket.status === "PENDING"
                                ? "RESOLVED"
                                : "PENDING"
                            )
                          }
                          disabled={isPending}
                        >
                          {ticket.status === "PENDING"
                            ? "Marquer traité"
                            : "Rouvrir"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <DetailModal
        title={
          focusedTicket
            ? `Demande de ${focusedTicket.name}`
            : "Demande de contact"
        }
      >
        {focusedTicket ? (
          <div className="fr-flow">
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-6">
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                  Statut
                </p>
                <Badge
                  small
                  severity={CONTACT_TICKET_STATUS_BADGES[focusedTicket.status]}
                >
                  {CONTACT_TICKET_STATUS_LABELS[focusedTicket.status]}
                </Badge>
              </div>
              <div className="fr-col-12 fr-col-md-6">
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                  Type
                </p>
                <span>
                  {CONTACT_TICKET_TYPE_LABELS[focusedTicket.contactType]}
                </span>
              </div>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-6">
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                  Nom
                </p>
                <p className="fr-mb-0">{focusedTicket.name}</p>
              </div>
              <div className="fr-col-12 fr-col-md-6">
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                  Fonction
                </p>
                <p className="fr-mb-0">{focusedTicket.function}</p>
              </div>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-6">
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                  Email
                </p>
                <p className="fr-mb-0">{focusedTicket.email}</p>
              </div>
              <div className="fr-col-12 fr-col-md-6">
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                  {focusedTicket.contactType === "COMMUNE"
                    ? "Commune"
                    : "Organisme"}
                </p>
                <p className="fr-mb-0">
                  {focusedTicket.commune || focusedTicket.organisme || "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                Message
              </p>
              <p
                className="fr-mb-0 fr-text--sm"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {focusedTicket.message}
              </p>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-6">
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                  Créé le
                </p>
                <p className="fr-mb-0">
                  {dateTimeFormatter.format(new Date(focusedTicket.createdAt))}
                </p>
              </div>
              <div className="fr-col-12 fr-col-md-6">
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                  Dernière mise à jour
                </p>
                <p className="fr-mb-0">
                  {dateTimeFormatter.format(new Date(focusedTicket.updatedAt))}
                </p>
              </div>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-6">
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                  Traité le
                </p>
                <p className="fr-mb-0">
                  {focusedTicket.processedAt
                    ? dateTimeFormatter.format(
                        new Date(focusedTicket.processedAt)
                      )
                    : "—"}
                </p>
              </div>
              <div className="fr-col-12 fr-col-md-6">
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
                  Traité par
                </p>
                <p className="fr-mb-0">
                  {formatUser(focusedTicket.processedBy ?? null)}
                </p>
              </div>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12">
                <div className="fr-btns-group fr-btns-group--inline fr-btns-group--icon-left">
                  <Button
                    priority={
                      focusedTicket.status === "PENDING"
                        ? "primary"
                        : "secondary"
                    }
                    iconId={
                      focusedTicket.status === "PENDING"
                        ? "fr-icon-check-line"
                        : "fr-icon-refresh-line"
                    }
                    onClick={() =>
                      handleStatusChange(
                        focusedTicket,
                        focusedTicket.status === "PENDING"
                          ? "RESOLVED"
                          : "PENDING"
                      )
                    }
                    disabled={isPending}
                  >
                    {focusedTicket.status === "PENDING"
                      ? "Marquer comme traité"
                      : "Rouvrir le ticket"}
                  </Button>
                  <Button priority="secondary" onClick={closeDetailModal}>
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>Aucun ticket sélectionné.</p>
        )}
      </DetailModal>
    </div>
  );
}
