"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import type { CityAuditAction, Commune, User } from "@prisma/client";
import { AdminCommuneCreateForm } from "@/components/AdminCommuneCreateForm";
import { AdminCommuneEditForm } from "@/components/AdminCommuneEditForm";

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
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCommune, setEditingCommune] = useState<CommuneWithManager | null>(null);
  const [visibilityCommune, setVisibilityCommune] = useState<CommuneWithManager | null>(null);
  const [deletingCommune, setDeletingCommune] = useState<CommuneWithManager | null>(null);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openCreateModal = useCallback(() => setIsCreateModalOpen(true), []);
  const closeCreateModal = useCallback(() => setIsCreateModalOpen(false), []);
  const handleCommuneCreated = useCallback(() => {
    setIsCreateModalOpen(false);
    router.refresh();
  }, [router]);

  const openEditModal = useCallback((commune: CommuneWithManager) => {
    setEditingCommune(commune);
  }, []);
  const closeEditModal = useCallback(() => {
    setEditingCommune(null);
  }, []);
  const handleCommuneUpdated = useCallback(() => {
    setEditingCommune(null);
    router.refresh();
  }, [router]);

  const openVisibilityModal = useCallback((commune: CommuneWithManager) => {
    setVisibilityError(null);
    setVisibilityCommune(commune);
  }, []);
  const closeVisibilityModal = useCallback(() => {
    setVisibilityCommune(null);
    setVisibilityError(null);
  }, []);

  const openDeleteModal = useCallback((commune: CommuneWithManager) => {
    setDeleteError(null);
    setDeletingCommune(commune);
  }, []);
  const closeDeleteModal = useCallback(() => {
    setDeletingCommune(null);
    setDeleteError(null);
  }, []);

  const handleToggleVisibility = useCallback(async () => {
    if (!visibilityCommune) {
      return;
    }
    setIsTogglingVisibility(true);
    setVisibilityError(null);
    try {
      const response = await fetch(`/api/admin/communes/${visibilityCommune.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isVisible: !visibilityCommune.isVisible,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Impossible de modifier la visibilité de la commune.");
      }

      setVisibilityCommune(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to toggle commune visibility", error);
      setVisibilityError(
        error instanceof Error
          ? error.message
          : "Impossible de modifier la visibilité de la commune.",
      );
    } finally {
      setIsTogglingVisibility(false);
    }
  }, [router, visibilityCommune]);

  const handleDeleteCommune = useCallback(async () => {
    if (!deletingCommune) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/admin/communes/${deletingCommune.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "La suppression de la commune a échoué.");
      }

      setDeletingCommune(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete commune", error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "La suppression de la commune a échoué.",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [deletingCommune, router]);

  const renderedCommunes = useMemo(
    () =>
      communes.map((commune) => {
        const manager = commune.users[0] ?? null;
        const lastAudit = commune.auditLogs[0] ?? null;

        return (
          <tr key={commune.id}>
            <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
              <div className="fr-text--md fr-text--bold">{commune.name}</div>
              <div className="fr-text-mention--grey fr-text--sm">
                {commune.postalCode} · OSM #{commune.osmId}
              </div>
              <div className="fr-tags-group fr-mt-1w">
                <Tag small>{commune.isVisible ? "Visible sur le site" : "Masquée"}</Tag>
              </div>
              <div className="fr-text--xs fr-mt-1w">
                {commune.websiteUrl ? (
                  <a
                    className="fr-link fr-link--sm"
                    href={commune.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Voir le site internet
                  </a>
                ) : (
                  <span className="fr-text-mention--grey">Pas de site renseigné</span>
                )}
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
                    Dernière action : {formatAuditAction(lastAudit.action)} le{" "}
                    {formatDateTimeValue(lastAudit.createdAt)}
                    {lastAudit.user ? ` par ${formatUserName(lastAudit.user)}` : ""}
                  </p>
                )}
              </div>
            </td>
            <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
              <div className="fr-btns-group fr-btns-group--inline-sm fr-btns-group--right fr-btns-group--icon-left">
                <Button
                  priority="secondary"
                  iconId="fr-icon-edit-line"
                  onClick={() => openEditModal(commune)}
                >
                  Modifier
                </Button>
                <Button
                  priority="tertiary"
                  iconId={commune.isVisible ? "fr-icon-eye-off-line" : "fr-icon-eye-line"}
                  onClick={() => openVisibilityModal(commune)}
                >
                  {commune.isVisible ? "Désactiver" : "Réactiver"}
                </Button>
                <Button
                  priority="tertiary"
                  iconId="fr-icon-delete-line"
                  onClick={() => openDeleteModal(commune)}
                >
                  Supprimer
                </Button>
              </div>
            </td>
          </tr>
        );
      }),
    [communes, openDeleteModal, openEditModal, openVisibilityModal],
  );

  return (
    <>
      <div className="fr-container fr-container--fluid fr-flow">
        <div className="fr-grid-row fr-grid-row--middle fr-mb-2w">
          <div className="fr-col">
            <h1 className="fr-h3 fr-mb-0">Communes</h1>
            <p className="fr-text--sm fr-mb-0">
              Visualisez les communes enregistrées, mettez-les à jour ou gérez leur visibilité.
            </p>
          </div>
          <div className="fr-col-auto">
            <Button priority="primary" iconId="fr-icon-add-line" onClick={openCreateModal}>
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
                          <th scope="col" className="fr-text--right">
                            Actions
                          </th>
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
        className={`fr-modal${isCreateModalOpen ? " fr-modal--opened" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-commune-modal-title"
        id="admin-commune-modal"
      >
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className="fr-modal__body">
            <div className="fr-modal__header">
              <button
                className="fr-btn--close fr-btn"
                title="Fermer"
                type="button"
                onClick={closeCreateModal}
              >
                Fermer
              </button>
            </div>
            <div className="fr-modal__content">
              <h1 className="fr-h4" id="admin-commune-modal-title">
                Créer une nouvelle commune
              </h1>
              <AdminCommuneCreateForm onCommuneCreated={handleCommuneCreated} />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fr-modal${editingCommune ? " fr-modal--opened" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-commune-edit-modal-title"
        id="admin-commune-edit-modal"
      >
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className="fr-modal__body">
            <div className="fr-modal__header">
              <button
                className="fr-btn--close fr-btn"
                title="Fermer"
                type="button"
                onClick={closeEditModal}
              >
                Fermer
              </button>
            </div>
            <div className="fr-modal__content">
              <h1 className="fr-h4" id="admin-commune-edit-modal-title">
                Modifier la commune
              </h1>
              {editingCommune && (
                <AdminCommuneEditForm
                  commune={{
                    id: editingCommune.id,
                    name: editingCommune.name,
                    postalCode: editingCommune.postalCode,
                    websiteUrl: editingCommune.websiteUrl ?? "",
                    manager: editingCommune.users[0]
                      ? {
                          id: editingCommune.users[0].id,
                          email: editingCommune.users[0].email,
                          firstName: editingCommune.users[0].firstName ?? "",
                          lastName: editingCommune.users[0].lastName ?? "",
                          phone: editingCommune.users[0].phone ?? "",
                        }
                      : null,
                  }}
                  onClose={closeEditModal}
                  onUpdated={handleCommuneUpdated}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fr-modal${visibilityCommune ? " fr-modal--opened" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-commune-visibility-modal-title"
        id="admin-commune-visibility-modal"
      >
        <div className="fr-container fr-container--fluid fr-container-sm">
          <div className="fr-modal__body">
            <div className="fr-modal__header">
              <button
                className="fr-btn--close fr-btn"
                title="Fermer"
                type="button"
                onClick={closeVisibilityModal}
                disabled={isTogglingVisibility}
              >
                Fermer
              </button>
            </div>
            <div className="fr-modal__content fr-flow">
              <h1 className="fr-h4" id="admin-commune-visibility-modal-title">
                {visibilityCommune?.isVisible
                  ? "Désactiver la commune"
                  : "Réactiver la commune"}
              </h1>
              <p>
                {visibilityCommune?.isVisible
                  ? `La commune ${visibilityCommune.name} ne sera plus visible sur le site public ni dans l’annuaire. Les citoyens ne pourront plus y contribuer.`
                  : `La commune ${visibilityCommune?.name ?? ""} sera de nouveau visible sur le site public et accessible aux citoyens.`}
              </p>
              {visibilityError && (
                <Alert severity="error" small title="Action impossible" description={visibilityError} />
              )}
              <div className="fr-btns-group fr-btns-group--inline-sm fr-btns-group--right">
                <Button priority="secondary" onClick={closeVisibilityModal} disabled={isTogglingVisibility}>
                  Annuler
                </Button>
                <Button
                  priority="primary"
                  iconId={isTogglingVisibility ? "fr-icon-refresh-line" : undefined}
                  onClick={handleToggleVisibility}
                  disabled={isTogglingVisibility}
                >
                  {isTogglingVisibility ? "Mise à jour…" : "Confirmer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fr-modal${deletingCommune ? " fr-modal--opened" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-commune-delete-modal-title"
        id="admin-commune-delete-modal"
      >
        <div className="fr-container fr-container--fluid fr-container-sm">
          <div className="fr-modal__body">
            <div className="fr-modal__header">
              <button
                className="fr-btn--close fr-btn"
                title="Fermer"
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Fermer
              </button>
            </div>
            <div className="fr-modal__content fr-flow">
              <h1 className="fr-h4" id="admin-commune-delete-modal-title">
                Supprimer la commune
              </h1>
              <p>
                Cette action supprimera définitivement la commune{" "}
                <strong>{deletingCommune?.name}</strong> et les comptes managers associés. Elle est
                irréversible.
              </p>
              {deleteError && (
                <Alert severity="error" small title="Suppression impossible" description={deleteError} />
              )}
              <div className="fr-btns-group fr-btns-group--inline-sm fr-btns-group--right">
                <Button priority="secondary" onClick={closeDeleteModal} disabled={isDeleting}>
                  Annuler
                </Button>
                <Button
                  priority="primary"
                  iconId={isDeleting ? "fr-icon-refresh-line" : "fr-icon-delete-line"}
                  onClick={handleDeleteCommune}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Suppression…" : "Supprimer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


