"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import type { CityAuditAction, Commune, User } from "@prisma/client";
import { AdminCommuneCreateForm } from "@/components/AdminCommuneCreateForm";

type ManagerPreview = Pick<User, "id" | "email" | "firstName" | "lastName" | "phone">;
type AuthorPreview = Pick<User, "id" | "email" | "firstName" | "lastName">;

type AuditLogPreview = {
  id: string;
  action: CityAuditAction;
  createdAt: Date;
  details: unknown;
  user: AuthorPreview | null;
};

type CommuneWithManager = Commune & {
  users: ManagerPreview[];
  createdBy: AuthorPreview | null;
  updatedBy: AuthorPreview | null;
  auditLogs: AuditLogPreview[];
};

type AdminCommunesManagerProps = {
  communes: CommuneWithManager[];
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeZone: "Europe/Paris",
});

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

function formatUserName(user: AuthorPreview | null) {
  if (!user) {
    return "Inconnu";
  }
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || user.email;
}

function formatAuditAction(action: CityAuditAction) {
  switch (action) {
    case "CREATED":
      return "Création";
    case "UPDATED":
      return "Mise à jour";
    default:
      return action;
  }
}

function formatDateValue(value: Date | string) {
  return dateFormatter.format(new Date(value));
}

function formatDateTimeValue(value: Date | string) {
  return dateTimeFormatter.format(new Date(value));
}

export function AdminCommunesManager({ communes }: AdminCommunesManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const renderedCommunes = useMemo(
    () =>
      communes.map((commune) => {
        const manager = commune.users[0];
        const lastAudit = commune.auditLogs[0] ?? null;

        return (
          <tr key={commune.id}>
            <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
              <div className="fr-text--md fr-text--bold">{commune.name}</div>
              <div className="fr-text-mention--grey fr-text--sm">
                {commune.postalCode} · OSM #{commune.osmId}
              </div>
            </td>
            <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
              {manager ? (
                <div className="fr-flow">
                  <p className="fr-text--md fr-text--bold fr-mb-0">
                    {[manager.firstName, manager.lastName].filter(Boolean).join(" ") || manager.email}
                  </p>
                  <p className="fr-text--sm fr-text-mention--grey fr-mb-0">{manager.email}</p>
                  {manager.phone && (
                    <p className="fr-text--xs fr-text-mention--grey fr-mb-0">{manager.phone}</p>
                  )}
                </div>
              ) : (
                <p className="fr-text-mention--grey fr-text--sm fr-mb-0">Aucun manager associé</p>
              )}
            </td>
            <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
              <p className="fr-text--sm fr-mb-0">Lat {commune.latitude.toFixed(4)}</p>
              <p className="fr-text--sm fr-mb-0">Lon {commune.longitude.toFixed(4)}</p>
            </td>
            <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
              <div className="fr-flow fr-text--xs">
                <p className="fr-mb-0">
                  Créée le {formatDateValue(commune.createdAt)} par {formatUserName(commune.createdBy)}
                </p>
                <p className="fr-mb-0">
                  Dernière modification le {formatDateValue(commune.updatedAt)} par{" "}
                  {formatUserName(commune.updatedBy)}
                </p>
                {lastAudit && (
                  <p className="fr-text-mention--grey fr-mb-0">
                    Dernière action : {formatAuditAction(lastAudit.action)} le {formatDateTimeValue(lastAudit.createdAt)}
                    {lastAudit.user ? ` par ${formatUserName(lastAudit.user)}` : ""}
                  </p>
                )}
              </div>
            </td>
          </tr>
        );
      }),
    [communes],
  );

  return (
    <>
      <div className="fr-container fr-container--fluid fr-flow">
        <div className="fr-grid-row fr-grid-row--middle fr-mb-2w">
          <div className="fr-col">
            <h1 className="fr-h3 fr-mb-0">Communes</h1>
            <p className="fr-text--sm fr-mb-0">
              Visualisez les communes enregistrées et créez les comptes managers associés.
            </p>
          </div>
          <div className="fr-col-auto">
            <Button priority="primary" iconId="fr-icon-add-line" onClick={openModal}>
              Nouvelle commune
            </Button>
          </div>
        </div>

        <section className="fr-flow">
          <h2 className="fr-h5">Communes enregistrées</h2>
          {communes.length === 0 ? (
            <div className="fr-callout">
              <h3 className="fr-callout__title">Aucune commune</h3>
              <p className="fr-callout__text">
                Ajoutez votre première commune à l’aide du bouton « Nouvelle commune ».
              </p>
            </div>
          ) : (
            <div className="fr-table fr-table--no-caption">
              <div className="fr-table__wrapper">
                <div className="fr-table__container">
                  <div className="fr-table__content">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Commune</th>
                          <th scope="col">Manager</th>
                          <th scope="col">Coordonnées</th>
                          <th scope="col">Historique</th>
                        </tr>
                      </thead>
                      <tbody>{renderedCommunes}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <div
        className={`fr-modal${isModalOpen ? " fr-modal--opened" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-commune-modal-title"
        id="admin-commune-modal"
      >
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className="fr-modal__body">
            <div className="fr-modal__header">
              <button className="fr-btn--close fr-btn" title="Fermer" type="button" onClick={closeModal}>
                Fermer
              </button>
            </div>
            <div className="fr-modal__content">
              <h1 className="fr-h4" id="admin-commune-modal-title">
                Créer une nouvelle commune
              </h1>
              <AdminCommuneCreateForm onCommuneCreated={closeModal} />
            </div>
          </div>
        </div>
      </div>

    </>
  );
}


