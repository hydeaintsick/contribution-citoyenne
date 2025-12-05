"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Select } from "@codegouvfr/react-dsfr/Select";
import type { Role } from "@prisma/client";

export type AccountManagerEditPayload = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

type AdminAccountManagerEditFormProps = {
  accountManager: AccountManagerEditPayload;
  onUpdated?: (manager: AccountManagerEditPayload) => void;
  onCancel?: () => void;
};

const ROLE_OPTIONS = [
  { value: "ACCOUNT_MANAGER", label: "Chargé de compte" },
  { value: "ADMIN", label: "Administrateur" },
] as const;

export function AdminAccountManagerEditForm({
  accountManager,
  onUpdated,
  onCancel,
}: AdminAccountManagerEditFormProps) {
  const [email, setEmail] = useState(accountManager.email);
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(accountManager.firstName ?? "");
  const [lastName, setLastName] = useState(accountManager.lastName ?? "");
  const [role, setRole] = useState<"ADMIN" | "ACCOUNT_MANAGER">(
    accountManager.role === "ADMIN" ? "ADMIN" : "ACCOUNT_MANAGER",
  );
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEmail(accountManager.email);
    setFirstName(accountManager.firstName ?? "");
    setLastName(accountManager.lastName ?? "");
    setPassword("");
    setRole(accountManager.role === "ADMIN" ? "ADMIN" : "ACCOUNT_MANAGER");
    setStatus("idle");
    setErrorMessage(null);
  }, [accountManager]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus("idle");
      setErrorMessage(null);

      if (!email || !firstName || !lastName) {
        setStatus("error");
        setErrorMessage("Merci de compléter tous les champs requis.");
        return;
      }

      setIsSubmitting(true);

      try {
        const updateData: {
          email: string;
          firstName: string;
          lastName: string;
          role: "ADMIN" | "ACCOUNT_MANAGER";
          password?: string;
        } = {
          email,
          firstName,
          lastName,
          role,
        };

        if (password && password.length >= 8) {
          updateData.password = password;
        }

        const response = await fetch(
          `/api/admin/account-managers/${accountManager.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          },
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setStatus("error");
          setErrorMessage(data?.error ?? "La mise à jour a échoué.");
          return;
        }

        const payload = (await response.json()) as {
          accountManager: AccountManagerEditPayload;
        };

        setStatus("success");
        onUpdated?.(payload.accountManager);
        setPassword("");
      } catch (error) {
        console.error("Account manager update failed", error);
        setStatus("error");
        setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, firstName, lastName, password, role, accountManager.id, onUpdated],
  );

  return (
    <form className="fr-flow" onSubmit={handleSubmit}>
      <p className="fr-text--sm">
        Modifiez les informations du compte et le rôle de l'utilisateur.
      </p>

      {status === "success" && (
        <Alert
          severity="success"
          small
          title="Modification effectuée"
          description="Le compte a été mis à jour avec succès."
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
        label="Nouveau mot de passe (laisser vide pour ne pas modifier)"
        hintText="Minimum 8 caractères"
        nativeInputProps={{
          type: "password",
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

      <Select
        label="Rôle"
        nativeSelectProps={{
          value: role,
          onChange: (event) =>
            setRole(event.target.value as "ADMIN" | "ACCOUNT_MANAGER"),
        }}
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline-lg">
        {onCancel && (
          <Button
            type="button"
            priority="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        )}
        <Button
          type="submit"
          priority="primary"
          disabled={isSubmitting}
          iconId={isSubmitting ? "fr-icon-refresh-line" : undefined}
        >
          {isSubmitting ? "Mise à jour…" : "Mettre à jour"}
        </Button>
      </div>
    </form>
  );
}

