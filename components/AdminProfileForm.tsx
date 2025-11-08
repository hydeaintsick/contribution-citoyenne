"use client";

import { useCallback, useState } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import type { Role } from "@prisma/client";

type AdminProfileFormProps = {
  initialData: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  role?: Role;
  communeName?: string | null;
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur Contribcit",
  ACCOUNT_MANAGER: "Chargé de compte",
  TOWN_MANAGER: "Manager municipal",
  TOWN_EMPLOYEE: "Salarié municipal",
};

export function AdminProfileForm({ initialData, role, communeName }: AdminProfileFormProps) {
  const [firstName, setFirstName] = useState(initialData.firstName ?? "");
  const [lastName, setLastName] = useState(initialData.lastName ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus("idle");
      setErrorMessage(null);

      if (password && password !== passwordConfirmation) {
        setStatus("error");
        setErrorMessage("Les mots de passe ne correspondent pas.");
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch("/api/admin/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName,
            lastName,
            password,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setStatus("error");
          setErrorMessage(data?.error ?? "Mise à jour impossible.");
          return;
        }

        setStatus("success");
        setPassword("");
        setPasswordConfirmation("");
      } catch (error) {
        console.error(error);
        setStatus("error");
        setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [firstName, lastName, password, passwordConfirmation],
  );

  return (
    <form className="fr-flow" onSubmit={handleSubmit}>
      <h1 className="fr-h4">Mes informations</h1>
      <p className="fr-text--sm">
        Mettez à jour vos coordonnées pour personnaliser l’expérience Contribcit.
      </p>

      {role ? (
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div className="fr-col-auto">
            <Tag small>{ROLE_LABELS[role]}</Tag>
          </div>
          {communeName ? (
            <div className="fr-col">
              <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
                Commune rattachée&nbsp;: <strong>{communeName}</strong>
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {status === "success" && (
        <Alert
          severity="success"
          small
          title="Profil mis à jour"
          description="Vos informations personnelles ont été enregistrées."
        />
      )}

      {status === "error" && errorMessage && (
        <Alert severity="error" small title="Erreur" description={errorMessage} />
      )}

      <Input
        label="Email"
        disabled
        nativeInputProps={{
          value: initialData.email,
          readOnly: true,
        }}
      />

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Prénom"
            nativeInputProps={{
              placeholder: "Alexandre",
              value: firstName,
              onChange: (event) => setFirstName(event.target.value),
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Nom"
            nativeInputProps={{
              placeholder: "Dupont",
              value: lastName,
              onChange: (event) => setLastName(event.target.value),
            }}
          />
        </div>
      </div>

      <fieldset className="fr-fieldset" aria-labelledby="password-legend">
        <legend id="password-legend" className="fr-fieldset__legend fr-text--sm">
          Mot de passe
        </legend>
        <div className="fr-fieldset__content">
          <Input
            label="Nouveau mot de passe"
            hintText="8 caractères minimum."
            nativeInputProps={{
              type: "password",
              value: password,
              onChange: (event) => setPassword(event.target.value),
              autoComplete: "new-password",
            }}
          />
          <Input
            label="Confirmez le nouveau mot de passe"
            nativeInputProps={{
              type: "password",
              value: passwordConfirmation,
              onChange: (event) => setPasswordConfirmation(event.target.value),
              autoComplete: "new-password",
            }}
          />
        </div>
      </fieldset>

      <Button
        type="submit"
        priority="primary"
        disabled={isSubmitting}
        iconId={isSubmitting ? "fr-icon-refresh-line" : undefined}
      >
        {isSubmitting ? "Enregistrement…" : "Enregistrer les modifications"}
      </Button>
    </form>
  );
}

