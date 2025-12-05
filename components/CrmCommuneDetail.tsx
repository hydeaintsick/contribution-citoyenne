"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
// Modal sera implémenté avec du HTML natif comme dans AdminAccountManagers

type CommuneComment = {
  id: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

type CrmCommune = {
  id: string;
  name: string;
  postalCode: string;
  slug: string | null;
  osmId: string;
  osmType: string;
  bbox: number[];
  latitude: number;
  longitude: number;
  websiteUrl: string | null;
  isVisible: boolean;
  hasPremiumAccess: boolean;
  isPartner: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  accountManager: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  users?: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  }>;
  comments: CommuneComment[];
};

type CrmCommuneDetailProps = {
  commune: CrmCommune;
  isAdmin: boolean;
  isAccountManager?: boolean;
  accountManagers?: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role?: string;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

export function CrmCommuneDetail({
  commune: initialCommune,
  isAdmin,
  isAccountManager = false,
  accountManagers = [],
}: CrmCommuneDetailProps) {
  const canEdit = isAdmin || isAccountManager;
  const router = useRouter();
  const [commune, setCommune] = useState(initialCommune);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentStatus, setCommentStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAccountManagerId, setSelectedAccountManagerId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isUpdatingField, setIsUpdatingField] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState(() => commune.websiteUrl ?? "");
  const [managerState, setManagerState] = useState<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null>(() => {
    const manager = commune.users?.[0];
    if (!manager) return null;
    return {
      id: manager.id,
      email: manager.email,
      firstName: manager.firstName ?? "",
      lastName: manager.lastName ?? "",
      phone: manager.phone ?? "",
    };
  });
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const refreshCommune = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/communes/${commune.id}`);
      if (response.ok) {
        const data = (await response.json()) as { commune: CrmCommune };
        setCommune(data.commune);
        // Mettre à jour les états du formulaire
        setWebsiteUrl(data.commune.websiteUrl ?? "");
        const manager = data.commune.users?.[0];
        if (manager) {
          setManagerState({
            id: manager.id,
            email: manager.email,
            firstName: manager.firstName ?? "",
            lastName: manager.lastName ?? "",
            phone: manager.phone ?? "",
          });
        } else {
          setManagerState(null);
        }
      }
    } catch (error) {
      console.error("Failed to refresh commune", error);
    }
  }, [commune.id]);

  const handleSubmitComment = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setCommentStatus(null);

      if (!newComment.trim()) {
        setCommentStatus({
          type: "error",
          message: "Le message est requis.",
        });
        return;
      }

      setIsSubmittingComment(true);

      try {
        const response = await fetch(
          `/api/admin/communes/${commune.id}/comments`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: newComment.trim() }),
          },
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          setCommentStatus({
            type: "error",
            message: payload?.error ?? "L'ajout du commentaire a échoué.",
          });
          return;
        }

        setNewComment("");
        setCommentStatus({
          type: "success",
          message: "Commentaire ajouté avec succès.",
        });
        await refreshCommune();
      } catch (error) {
        console.error("Failed to add comment", error);
        setCommentStatus({
          type: "error",
          message: "Une erreur est survenue. Veuillez réessayer.",
        });
      } finally {
        setIsSubmittingComment(false);
      }
    },
    [commune.id, newComment, refreshCommune],
  );

  const handleTransfer = useCallback(async () => {
    if (!selectedAccountManagerId) {
      return;
    }

    setIsTransferring(true);

    try {
      const response = await fetch(`/api/admin/communes/${commune.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountManagerId: selectedAccountManagerId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        alert(payload?.error ?? "Le transfert a échoué.");
        return;
      }

      setIsTransferModalOpen(false);
      await refreshCommune();
      router.refresh();
    } catch (error) {
      console.error("Failed to transfer commune", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsTransferring(false);
    }
  }, [commune.id, selectedAccountManagerId, refreshCommune, router]);

  const handleToggleField = useCallback(
    async (field: "isVisible" | "hasPremiumAccess" | "isPartner", value: boolean) => {
      if (!isAdmin) return;

      setIsUpdatingField(true);
      try {
        const response = await fetch(`/api/admin/communes/${commune.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ [field]: value }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Impossible de mettre à jour la commune.");
        }

        await refreshCommune();
      } catch (error) {
        console.error(`Failed to update ${field}`, error);
        alert(error instanceof Error ? error.message : "Une erreur est survenue.");
      } finally {
        setIsUpdatingField(false);
      }
    },
    [commune.id, isAdmin, refreshCommune],
  );

  const handleManagerChange = useCallback(
    (field: "email" | "firstName" | "lastName" | "phone", value: string) => {
      setManagerState((previous) => {
        if (!previous) {
          return previous;
        }
        return {
          ...previous,
          [field]: value,
        };
      });
    },
    [],
  );

  const handleSubmitEdit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setEditError(null);

      if (managerState) {
        if (!managerState.email || !managerState.firstName || !managerState.lastName) {
          setEditError("Merci de compléter les informations obligatoires du manager.");
          return;
        }

        if (password && password.length < 8) {
          setEditError("Le mot de passe doit contenir au moins 8 caractères.");
          return;
        }

        if (password && password !== passwordConfirmation) {
          setEditError("Les mots de passe ne correspondent pas.");
          return;
        }
      }

      setIsSubmittingEdit(true);
      try {
        const payload: Record<string, unknown> = {
          websiteUrl: websiteUrl.trim(),
        };

        if (managerState) {
          payload.manager = {
            id: managerState.id,
            email: managerState.email.trim(),
            firstName: managerState.firstName.trim(),
            lastName: managerState.lastName.trim(),
            phone: managerState.phone.trim(),
            ...(password && password.length >= 8 ? { password } : {}),
          };
        }

        const response = await fetch(`/api/admin/communes/${commune.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const payloadJson = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payloadJson?.error ?? "La mise à jour a échoué.");
        }

        setIsEditModalOpen(false);
        setPassword("");
        setPasswordConfirmation("");
        await refreshCommune();
        router.refresh();
      } catch (error) {
        console.error("Failed to update commune", error);
        setEditError(
          error instanceof Error ? error.message : "La mise à jour a échoué. Veuillez réessayer.",
        );
      } finally {
        setIsSubmittingEdit(false);
      }
    },
    [commune.id, managerState, websiteUrl, password, passwordConfirmation, refreshCommune, router],
  );

  return (
    <div className="fr-flow">
      <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-4w">
        <div className="fr-col-auto">
          <Button
            priority="tertiary"
            iconId="fr-icon-arrow-left-line"
            iconPosition="left"
            onClick={() => router.push("/admin")}
            title="Retour au dashboard"
          >
            Retour
          </Button>
        </div>
        <div className="fr-col">
          <h1 className="fr-h3 fr-mb-0">{commune.name}</h1>
          <p className="fr-text--sm fr-mb-0">
            Code postal : {commune.postalCode}
          </p>
        </div>
        {commune.slug && (
          <div className="fr-col-auto">
            <Button
              priority="primary"
              iconId="fr-icon-external-link-line"
              iconPosition="right"
              onClick={() => {
                window.open(`/contrib/${commune.slug}`, "_blank");
              }}
            >
              Voir le tunnel
            </Button>
          </div>
        )}
      </div>

      <section className="fr-card fr-card--no-arrow fr-card--shadow fr-mb-4w">
        <div className="fr-card__body fr-px-4w fr-py-4w">
          <h2 className="fr-h5 fr-mb-3w">Informations</h2>
          <div className="fr-grid-row fr-grid-row--gutters">
            {isAdmin && (
              <>
                <div className="fr-col-12 fr-col-md-6">
                  <p className="fr-text--sm fr-text--bold">Créée par</p>
                  <p className="fr-text--sm">
                    {commune.createdBy
                      ? [
                          commune.createdBy.firstName,
                          commune.createdBy.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || commune.createdBy.email
                      : "N/A"}
                  </p>
                </div>
                <div className="fr-col-12 fr-col-md-6">
                  <p className="fr-text--sm fr-text--bold">Chargé de compte</p>
                  <p className="fr-text--sm">
                    {commune.accountManager
                      ? [
                          commune.accountManager.firstName,
                          commune.accountManager.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || commune.accountManager.email
                      : "Non assigné"}
                  </p>
                </div>
              </>
            )}
            <div className="fr-col-12 fr-col-md-6">
              <p className="fr-text--sm fr-text--bold">Créée le</p>
              <p className="fr-text--sm">
                {dateFormatter.format(new Date(commune.createdAt))}
              </p>
            </div>
            {commune.websiteUrl && (
              <div className="fr-col-12 fr-col-md-6">
                <p className="fr-text--sm fr-text--bold">Site web</p>
                <p className="fr-text--sm">
                  <a href={commune.websiteUrl} target="_blank" rel="noopener noreferrer">
                    {commune.websiteUrl}
                  </a>
                </p>
              </div>
            )}
            {commune.slug && (
              <div className="fr-col-12 fr-col-md-6">
                <p className="fr-text--sm fr-text--bold">Tunnel de contribution</p>
                <p className="fr-text--sm">
                  <a
                    href={`/contrib/${commune.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link fr-link--sm fr-icon-external-link-line"
                  >
                    Voir le tunnel
                  </a>
                </p>
              </div>
            )}
          </div>

          {(isAdmin || isAccountManager) && (
            <>
              <div className="fr-mt-3w">
                <h3 className="fr-h6 fr-mb-2w">Paramètres</h3>
                {isAdmin ? (
                  <div className="fr-flow">
                    <div className="fr-toggle">
                      <input
                        type="checkbox"
                        id="toggle-visible"
                        checked={commune.isVisible}
                        disabled={isUpdatingField}
                        onChange={(e) =>
                          handleToggleField("isVisible", e.target.checked)
                        }
                      />
                      <label
                        className="fr-toggle__label"
                        htmlFor="toggle-visible"
                        data-fr-checked-label="Oui"
                        data-fr-unchecked-label="Non"
                      >
                        Visible dans l'annuaire
                      </label>
                    </div>
                    <div className="fr-toggle">
                      <input
                        type="checkbox"
                        id="toggle-premium"
                        checked={commune.hasPremiumAccess}
                        disabled={isUpdatingField}
                        onChange={(e) =>
                          handleToggleField("hasPremiumAccess", e.target.checked)
                        }
                      />
                      <label
                        className="fr-toggle__label"
                        htmlFor="toggle-premium"
                        data-fr-checked-label="Oui"
                        data-fr-unchecked-label="Non"
                      >
                        Premium
                      </label>
                    </div>
                    <div className="fr-toggle">
                      <input
                        type="checkbox"
                        id="toggle-partner"
                        checked={commune.isPartner}
                        disabled={isUpdatingField}
                        onChange={(e) =>
                          handleToggleField("isPartner", e.target.checked)
                        }
                      />
                      <label
                        className="fr-toggle__label"
                        htmlFor="toggle-partner"
                        data-fr-checked-label="Oui"
                        data-fr-unchecked-label="Non"
                      >
                        Commune partenaire
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="fr-flow">
                    <div className="fr-text--sm">
                      <p className="fr-text--sm fr-text--bold fr-mb-1w">
                        Visible dans l'annuaire
                      </p>
                      <p className="fr-text--sm fr-text-mention--grey fr-mb-2w">
                        {commune.isVisible ? "Oui" : "Non"}
                      </p>
                    </div>
                    <div className="fr-text--sm">
                      <p className="fr-text--sm fr-text--bold fr-mb-1w">Premium</p>
                      <p className="fr-text--sm fr-text-mention--grey fr-mb-2w">
                        {commune.hasPremiumAccess ? "Oui" : "Non"}
                      </p>
                    </div>
                    <div className="fr-text--sm">
                      <p className="fr-text--sm fr-text--bold fr-mb-1w">
                        Commune partenaire
                      </p>
                      <p className="fr-text--sm fr-text-mention--grey fr-mb-2w">
                        {commune.isPartner ? "Oui" : "Non"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {canEdit && (
                <div className="fr-mt-3w">
                  <Button
                    priority="secondary"
                    iconId="fr-icon-edit-line"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    Modifier le responsable et le site internet
                  </Button>
                </div>
              )}
              {isAdmin && (
                <div className="fr-mt-2w">
                  <Button
                    priority="secondary"
                    iconId="fr-icon-arrow-right-line"
                    onClick={() => setIsTransferModalOpen(true)}
                  >
                    Transférer à un autre chargé de compte
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="fr-card fr-card--no-arrow fr-card--shadow">
        <div className="fr-card__body fr-px-4w fr-py-4w">
          <h2 className="fr-h5 fr-mb-3w">Discussion</h2>

          {commune.comments.length === 0 ? (
            <p className="fr-text--sm fr-text-mention--grey">
              Aucun commentaire pour le moment.
            </p>
          ) : (
            <div className="fr-flow">
              {commune.comments.map((comment) => (
                <div key={comment.id} className="fr-callout fr-callout--blue-ecume">
                  <div className="fr-callout__text">
                    <p className="fr-text--sm fr-mb-2w">{comment.message}</p>
                    <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
                      Par{" "}
                      {comment.author
                        ? [
                            comment.author.firstName,
                            comment.author.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ") || comment.author.email
                        : "Utilisateur inconnu"}{" "}
                      le {dateFormatter.format(new Date(comment.createdAt))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmitComment} className="fr-mt-4w">
            {commentStatus && (
              <Alert
                severity={commentStatus.type === "success" ? "success" : "error"}
                small
                title={commentStatus.type === "success" ? "Succès" : "Erreur"}
                description={commentStatus.message}
                className="fr-mb-2w"
              />
            )}

            <Input
              label="Ajouter un commentaire"
              nativeInputProps={{
                value: newComment,
                onChange: (event) => setNewComment(event.target.value),
                placeholder: "Écrivez votre commentaire...",
                required: true,
                disabled: isSubmittingComment,
              }}
            />

            <Button
              type="submit"
              priority="primary"
              disabled={isSubmittingComment || !newComment.trim()}
              iconId={isSubmittingComment ? "fr-icon-refresh-line" : undefined}
              className="fr-mt-2w"
            >
              {isSubmittingComment ? "Envoi..." : "Ajouter le commentaire"}
            </Button>
          </form>
        </div>
      </section>

      {canEdit && (
        <div
          className={`fr-modal${isEditModalOpen ? " fr-modal--opened" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          id="edit-modal"
        >
          <div className="fr-container fr-container--fluid fr-container-md">
            <div className="fr-modal__body">
              <div className="fr-modal__header">
                <button
                  className="fr-btn--close fr-btn"
                  title="Fermer"
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditError(null);
                    setPassword("");
                    setPasswordConfirmation("");
                  }}
                >
                  Fermer
                </button>
              </div>
              <div className="fr-modal__content">
                <h1 className="fr-h4" id="edit-modal-title">
                  Modifier la commune
                </h1>
                <form className="fr-flow" onSubmit={handleSubmitEdit}>
                  <Input
                    label="Site internet"
                    nativeInputProps={{
                      type: "url",
                      value: websiteUrl,
                      onChange: (event) => setWebsiteUrl(event.target.value),
                      placeholder: "https://www.ville-exemple.fr",
                      inputMode: "url",
                    }}
                    hintText="Laissez vide pour retirer le site internet."
                  />

                  {managerState ? (
                    <section className="fr-flow">
                      <h2 className="fr-h5 fr-mt-2w fr-mb-0">Manager de la commune</h2>
                      <Input
                        label="Email"
                        nativeInputProps={{
                          type: "email",
                          required: true,
                          value: managerState.email,
                          onChange: (event) => handleManagerChange("email", event.target.value),
                          autoComplete: "email",
                        }}
                      />
                      <div className="fr-grid-row fr-grid-row--gutters">
                        <div className="fr-col-12 fr-col-md-6">
                          <Input
                            label="Prénom"
                            nativeInputProps={{
                              required: true,
                              value: managerState.firstName,
                              onChange: (event) => handleManagerChange("firstName", event.target.value),
                              autoComplete: "given-name",
                            }}
                          />
                        </div>
                        <div className="fr-col-12 fr-col-md-6">
                          <Input
                            label="Nom"
                            nativeInputProps={{
                              required: true,
                              value: managerState.lastName,
                              onChange: (event) => handleManagerChange("lastName", event.target.value),
                              autoComplete: "family-name",
                            }}
                          />
                        </div>
                      </div>
                      <Input
                        label="Téléphone (optionnel)"
                        nativeInputProps={{
                          type: "tel",
                          value: managerState.phone,
                          onChange: (event) => handleManagerChange("phone", event.target.value),
                          autoComplete: "tel",
                          placeholder: "06 12 34 56 78",
                        }}
                      />
                      <fieldset className="fr-fieldset" aria-labelledby="password-legend">
                        <legend
                          id="password-legend"
                          className="fr-fieldset__legend fr-text--sm"
                        >
                          Mot de passe
                        </legend>
                        <div className="fr-fieldset__content">
                          <Input
                            label="Nouveau mot de passe"
                            hintText="8 caractères minimum. Laissez vide pour ne pas modifier."
                            nativeInputProps={{
                              type: "password",
                              value: password,
                              onChange: (event) => setPassword(event.target.value),
                              autoComplete: "new-password",
                            }}
                          />
                          {password && (
                            <Input
                              label="Confirmez le nouveau mot de passe"
                              nativeInputProps={{
                                type: "password",
                                value: passwordConfirmation,
                                onChange: (event) => setPasswordConfirmation(event.target.value),
                                autoComplete: "new-password",
                              }}
                            />
                          )}
                        </div>
                      </fieldset>
                    </section>
                  ) : (
                    <Alert
                      severity="warning"
                      small
                      title="Aucun manager"
                      description="Aucun compte manager n'est associé à cette commune pour le moment."
                    />
                  )}

                  {editError && (
                    <Alert severity="error" title="Impossible d'enregistrer" description={editError} />
                  )}

                  <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
                    <Button
                      type="button"
                      priority="secondary"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditError(null);
                        setPassword("");
                        setPasswordConfirmation("");
                      }}
                      disabled={isSubmittingEdit}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      priority="primary"
                      iconId={isSubmittingEdit ? "fr-icon-refresh-line" : "fr-icon-save-line"}
                      disabled={isSubmittingEdit}
                    >
                      {isSubmittingEdit ? "Enregistrement…" : "Enregistrer"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div
          className={`fr-modal${isTransferModalOpen ? " fr-modal--opened" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-modal-title"
          id="transfer-modal"
        >
          <div className="fr-container fr-container--fluid fr-container-md">
            <div className="fr-modal__body">
              <div className="fr-modal__header">
                <button
                  className="fr-btn--close fr-btn"
                  title="Fermer"
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                >
                  Fermer
                </button>
              </div>
              <div className="fr-modal__content">
                <h1 className="fr-h4" id="transfer-modal-title">
                  Transférer la commune
                </h1>
                <div className="fr-flow">
                  <p className="fr-text--sm">
                    Sélectionnez le chargé de compte ou l'admin à qui transférer cette commune.
                  </p>

                  <div className="fr-select-group">
                    <label className="fr-label" htmlFor="account-manager-select">
                      Chargé de compte ou Admin
                    </label>
                    <select
                      id="account-manager-select"
                      className="fr-select"
                      value={selectedAccountManagerId}
                      onChange={(e) => setSelectedAccountManagerId(e.target.value)}
                    >
                      <option value="">Sélectionner...</option>
                      {accountManagers.map((manager) => {
                        const name = [manager.firstName, manager.lastName]
                          .filter(Boolean)
                          .join(" ") || manager.email;
                        const roleLabel = manager.role === "ADMIN" ? " (Admin)" : "";
                        return (
                          <option key={manager.id} value={manager.id}>
                            {name}{roleLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
                    <Button
                      priority="secondary"
                      onClick={() => setIsTransferModalOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      priority="primary"
                      onClick={handleTransfer}
                      disabled={!selectedAccountManagerId || isTransferring}
                      iconId={isTransferring ? "fr-icon-refresh-line" : undefined}
                    >
                      {isTransferring ? "Transfert..." : "Transférer"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

