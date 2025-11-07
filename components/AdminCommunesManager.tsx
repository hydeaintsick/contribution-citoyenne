"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import type { Commune, User } from "@prisma/client";
import { AdminCommuneCreateForm } from "@/components/AdminCommuneCreateForm";

type ManagerPreview = Pick<User, "id" | "email" | "firstName" | "lastName" | "phone">;

type CommuneWithManager = Commune & {
  users: ManagerPreview[];
};

type AdminCommunesManagerProps = {
  communes: CommuneWithManager[];
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeZone: "Europe/Paris",
});

export function AdminCommunesManager({ communes }: AdminCommunesManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const renderedCommunes = useMemo(
    () =>
      communes.map((commune) => {
        const manager = commune.users[0];

        return (
          <tr key={commune.id}>
            <td>
              <div className="fr-text--md fr-text--bold">{commune.name}</div>
              <div className="fr-text-mention--grey fr-text--xs">
                {commune.postalCode} · OSM #{commune.osmId}
              </div>
            </td>
            <td>
              {manager ? (
                <div className="fr-flow">
                  <span className="fr-text--md">
                    {[manager.firstName, manager.lastName].filter(Boolean).join(" ") ||
                      manager.email}
                  </span>
                  <span className="fr-text--xs fr-text-mention--grey">{manager.email}</span>
                  {manager.phone && (
                    <span className="fr-text--xs fr-text-mention--grey">{manager.phone}</span>
                  )}
                </div>
              ) : (
                <span className="fr-text-mention--grey fr-text--sm">Aucun manager associé</span>
              )}
            </td>
            <td>
              <div className="fr-text--sm">Lat {commune.latitude.toFixed(4)}</div>
              <div className="fr-text--sm">Lon {commune.longitude.toFixed(4)}</div>
            </td>
            <td>
              <span className="fr-text--sm">{dateFormatter.format(commune.createdAt)}</span>
            </td>
          </tr>
        );
      }),
    [communes],
  );

  return (
    <>
      <div className="fr-flow">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-mb-2w">
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
            <div className="fr-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Commune</th>
                    <th scope="col">Manager</th>
                    <th scope="col">Coordonnées</th>
                    <th scope="col">Créée le</th>
                  </tr>
                </thead>
                <tbody>{renderedCommunes}</tbody>
              </table>
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


