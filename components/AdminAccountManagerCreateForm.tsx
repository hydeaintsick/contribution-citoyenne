"use client";

import { useCallback, useState } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

export type AccountManagerPayload = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

type AdminAccountManagerCreateFormProps = {
  onCreated?: (manager: AccountManagerPayload) => void;
};

export function AdminAccountManagerCreateForm({
  onCreated,
}: AdminAccountManagerCreateFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus("idle");
      setErrorMessage(null);

      if (!email || !password || !firstName || !lastName) {
        setStatus("error");
        setErrorMessage("Merci de compléter tous les champs requis.");
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch("/api/admin/account-managers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, firstName, lastName }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setStatus("error");
          setErrorMessage(data?.error ?? "La création a échoué.");
          return;
        }

        const payload = (await response.json()) as {
          accountManager: AccountManagerPayload;
        };

        setStatus("success");
        onCreated?.(payload.accountManager);
        resetForm();
      } catch (error) {
        console.error("Account manager creation failed", error);
        setStatus("error");
        setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, firstName, lastName, onCreated, password, resetForm],
  );

  return (
    <form className="fr-flow" onSubmit={handleSubmit}>
      <p className="fr-text--sm">
        Créez un nouveau chargé de compte pour accéder à l’espace administration.
      </p>

      {status === "success" && (
        <Alert
          severity="success"
          small
          title="Création effectuée"
          description="Le compte a été créé. Le chargé de compte peut désormais se connecter."
        />
      )}

      {status === "error" && errorMessage && (
        <Alert severity="error" small title="Erreur" description={errorMessage} />
      )}

      <Input
        label="Email"
        nativeInputProps={{
          type: "email",
          required: true,
          autoComplete: "email",
          value: email,
          onChange: (event) => setEmail(event.target.value),
        }}
      />

      <Input
        label="Mot de passe"
        nativeInputProps={{
          type: "password",
          required: true,
          minLength: 8,
          autoComplete: "new-password",
          value: password,
          onChange: (event) => setPassword(event.target.value),
        }}
      />

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Prénom"
            nativeInputProps={{
              required: true,
              autoComplete: "given-name",
              value: firstName,
              onChange: (event) => setFirstName(event.target.value),
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Nom"
            nativeInputProps={{
              required: true,
              autoComplete: "family-name",
              value: lastName,
              onChange: (event) => setLastName(event.target.value),
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        priority="primary"
        disabled={isSubmitting}
        iconId={isSubmitting ? "fr-icon-refresh-line" : undefined}
        className="fr-mt-2w"
      >
        {isSubmitting ? "Création…" : "Créer le compte"}
      </Button>
    </form>
  );
}


