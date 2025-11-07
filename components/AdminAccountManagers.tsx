"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { AdminAccountManagerCreateForm, type AccountManagerPayload } from "@/components/AdminAccountManagerCreateForm";

type AccountManager = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

type AdminAccountManagersProps = {
  initialAccountManagers: AccountManagerPayload[];
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

function hydrateAccountManager(payload: AccountManagerPayload): AccountManager {
  return {
    id: payload.id,
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
    lastLoginAt: payload.lastLoginAt ? new Date(payload.lastLoginAt) : null,
  };
}

export function AdminAccountManagers({
  initialAccountManagers,
}: AdminAccountManagersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountManagers, setAccountManagers] = useState<AccountManager[]>(
    () => initialAccountManagers.map(hydrateAccountManager),
  );

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleCreated = useCallback(
    (payload: AccountManagerPayload) => {
      setAccountManagers((previous) => {
        const next = [hydrateAccountManager(payload), ...previous];
        return next.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
      });
      closeModal();
    },
    [closeModal],
  );

  const renderedAccountManagers = useMemo(() => {
    if (accountManagers.length === 0) {
      return (
        <tr>
          <td colSpan={4}>
            <div className="fr-callout fr-mb-0">
              <h3 className="fr-callout__title">Aucun chargé de compte</h3>
              <p className="fr-callout__text">
                Créez un premier compte pour déléguer l’accès à la plateforme.
              </p>
            </div>
          </td>
        </tr>
      );
    }

    return accountManagers.map((manager) => (
      <tr key={manager.id}>
        <td>
          <div className="fr-text--md fr-text--bold">
            {[manager.firstName, manager.lastName].filter(Boolean).join(" ") ||
              manager.email}
          </div>
        </td>
        <td>
          <span className="fr-text--sm">{manager.email}</span>
        </td>
        <td>
          <span className="fr-text--sm">
            {manager.lastLoginAt
              ? dateFormatter.format(manager.lastLoginAt)
              : "Jamais connecté"}
          </span>
        </td>
        <td>
          <span className="fr-text--sm">
            {dateFormatter.format(manager.createdAt)}
          </span>
        </td>
      </tr>
    ));
  }, [accountManagers]);

  return (
    <>
      <div className="fr-flow">
        <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-2w">
          <div className="fr-col">
            <h1 className="fr-h3 fr-mb-0">Chargés de compte</h1>
            <p className="fr-text--sm fr-mb-0">
              Gérez les accès sub-administrateurs de la plateforme.
            </p>
          </div>
          <div className="fr-col-auto">
            <Button priority="primary" iconId="fr-icon-add-line" onClick={openModal}>
              Nouveau chargé de compte
            </Button>
          </div>
        </div>

        <section className="fr-flow">
          <h2 className="fr-h5">Liste des chargés de compte</h2>
          <div className="fr-table">
            <div className="fr-table__wrapper">
              <div className="fr-table__container">
                <div className="fr-table__content">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Nom</th>
                        <th scope="col">Email</th>
                        <th scope="col">Dernière connexion</th>
                        <th scope="col">Créé le</th>
                      </tr>
                    </thead>
                    <tbody>{renderedAccountManagers}</tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div
        className={`fr-modal${isModalOpen ? " fr-modal--opened" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-account-manager-modal-title"
        id="admin-account-manager-modal"
      >
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className="fr-modal__body">
            <div className="fr-modal__header">
              <button
                className="fr-btn--close fr-btn"
                title="Fermer"
                type="button"
                onClick={closeModal}
              >
                Fermer
              </button>
            </div>
            <div className="fr-modal__content">
              <h1 className="fr-h4" id="admin-account-manager-modal-title">
                Créer un chargé de compte
              </h1>
              <AdminAccountManagerCreateForm onCreated={handleCreated} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


