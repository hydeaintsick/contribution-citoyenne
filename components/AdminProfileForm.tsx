"use client";

import { useCallback, useState } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import type { Role } from "@prisma/client";

type AdminProfileFormProps = {
  initialData: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    title: string | null;
    phone: string | null;
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

export function AdminProfileForm({
  initialData,
  role,
  communeName,
}: AdminProfileFormProps) {
  const [firstName, setFirstName] = useState(initialData.firstName ?? "");
  const [lastName, setLastName] = useState(initialData.lastName ?? "");
  const [title, setTitle] = useState(initialData.title ?? "");
  const [phone, setPhone] = useState(initialData.phone ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAdminOrAccountManager =
    role === "ADMIN" || role === "ACCOUNT_MANAGER";

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
            title,
            phone,
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
    [firstName, lastName, title, phone, password, passwordConfirmation]
  );

  const generateSignature = () => {
    const fullName =
      [firstName, lastName].filter(Boolean).join(" ") || "Prénom NOM";
    const signatureTitle = title || "Titre";
    const signaturePhone = phone || "Numéro de téléphone";
    const signatureEmail = "contact@contribcit.org";

    return `--
${fullName}
${signatureTitle}
Contribcit

Téléphone : ${signaturePhone}
Email : ${signatureEmail}

Contribcit - La parole aux citoyens des territoires
https://contribcit.org`;
  };

  const handleCopySignature = async () => {
    try {
      await navigator.clipboard.writeText(generateSignature());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
    }
  };

  const personalInfoContent = (
    <div className="fr-flow">
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

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Titre"
            hintText="Ex: Chargé de compte, Responsable clientèle..."
            nativeInputProps={{
              placeholder: "Votre titre professionnel",
              value: title,
              onChange: (event) => setTitle(event.target.value),
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Numéro de téléphone"
            nativeInputProps={{
              placeholder: "+33 1 23 45 67 89",
              value: phone,
              onChange: (event) => setPhone(event.target.value),
              type: "tel",
            }}
          />
        </div>
      </div>

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
    </div>
  );

  const brandingContent = (
    <div className="fr-flow">
      <p className="fr-text--sm fr-mb-4w">
        Copiez la signature ci-dessous pour l'utiliser dans vos emails
        professionnels.
      </p>

      <div
        style={{
          backgroundColor: "#E3F2FD",
          color: "#000091",
          borderRadius: "0.5rem",
          padding: "1.25rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        {/* Logo et slogan */}
        <div>
          <div
            style={{
              fontSize: "1.25rem",
              fontWeight: "700",
              marginBottom: "0.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <span>Contribcit</span>
            {/* Drapeau français */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                width: "36px",
                height: "24px",
                borderRadius: "2px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                flexShrink: 0,
              }}
            >
              <div style={{ width: "33.33%", backgroundColor: "#000091" }} />
              <div style={{ width: "33.33%", backgroundColor: "#ffffff" }} />
              <div style={{ width: "33.33%", backgroundColor: "#ED2939" }} />
            </div>
          </div>
          <div
            style={{ fontSize: "0.875rem", fontWeight: "400", opacity: 0.85 }}
          >
            La parole aux citoyens des territoires
          </div>
        </div>

        {/* Séparateur */}
        <div
          style={{
            height: "1px",
            backgroundColor: "rgba(0, 0, 145, 0.2)",
            margin: "0.5rem 0",
          }}
        />

        {/* Informations de contact */}
        <div>
          <div
            style={{
              fontSize: "0.9375rem",
              fontWeight: "600",
              marginBottom: "0.5rem",
            }}
          >
            {firstName && lastName
              ? `${firstName} ${lastName.toUpperCase()}`
              : "Prénom NOM"}
          </div>
          {title && (
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: "400",
                marginBottom: "0.375rem",
                opacity: 0.8,
              }}
            >
              {title}
            </div>
          )}
          {phone && (
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: "400",
                marginBottom: "0.375rem",
                opacity: 0.8,
              }}
            >
              {phone}
            </div>
          )}
          <div
            style={{ fontSize: "0.8125rem", fontWeight: "400", opacity: 0.9 }}
          >
            contact@contribcit.org
          </div>
        </div>
      </div>

      <Button
        type="button"
        priority="secondary"
        className="fr-mt-2w"
        iconId={copied ? "fr-icon-check-line" : "fr-icon-links-line"}
        onClick={handleCopySignature}
      >
        {copied ? "Signature copiée !" : "Copier la signature"}
      </Button>
    </div>
  );

  return (
    <form className="fr-flow" onSubmit={handleSubmit}>
      <h1 className="fr-h4">Mes informations</h1>
      <p className="fr-text--sm">
        Mettez à jour vos coordonnées pour personnaliser l'expérience
        Contribcit.
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
        <Alert
          severity="error"
          small
          title="Erreur"
          description={errorMessage}
        />
      )}

      {isAdminOrAccountManager ? (
        <div className="fr-accordions-group">
          <Accordion label="Informations personnelles" className="fr-mb-2w">
            {personalInfoContent}
          </Accordion>
          <Accordion label="Branding et signature" className="fr-mb-2w">
            {brandingContent}
          </Accordion>
        </div>
      ) : (
        personalInfoContent
      )}

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
