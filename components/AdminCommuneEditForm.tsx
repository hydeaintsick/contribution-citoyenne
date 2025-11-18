"use client";

import { useCallback, useState } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

type ManagerFormState = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
} | null;

type AdminCommuneEditFormProps = {
  commune: {
    id: string;
    name: string;
    postalCode: string;
    websiteUrl: string;
    isPartner?: boolean;
    manager: ManagerFormState;
  };
  onClose: () => void;
  onUpdated: () => void;
};

export function AdminCommuneEditForm({ commune, onClose, onUpdated }: AdminCommuneEditFormProps) {
  const [websiteUrl, setWebsiteUrl] = useState(() => commune.websiteUrl ?? "");
  const [isPartner, setIsPartner] = useState(() => commune.isPartner ?? false);
  const [managerState, setManagerState] = useState<ManagerFormState>(() => commune.manager);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const handleIsPartnerChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsPartner(event.target.checked);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);

      if (managerState) {
        if (!managerState.email || !managerState.firstName || !managerState.lastName) {
          setFormError("Merci de compléter les informations obligatoires du manager.");
          return;
        }
      }

      setIsSubmitting(true);
      try {
        const payload: Record<string, unknown> = {
          websiteUrl: websiteUrl.trim(),
          isPartner,
        };

        if (managerState) {
          payload.manager = {
            id: managerState.id,
            email: managerState.email.trim(),
            firstName: managerState.firstName.trim(),
            lastName: managerState.lastName.trim(),
            phone: managerState.phone.trim(),
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

        onUpdated();
      } catch (error) {
        console.error("Failed to update commune", error);
        setFormError(
          error instanceof Error ? error.message : "La mise à jour a échoué. Veuillez réessayer.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [commune.id, managerState, onUpdated, websiteUrl, isPartner],
  );

  return (
    <form className="fr-flow" onSubmit={handleSubmit}>
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Nom de la commune"
            disabled
            nativeInputProps={{
              value: commune.name,
              readOnly: true,
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Code postal"
            disabled
            nativeInputProps={{
              value: commune.postalCode,
              readOnly: true,
            }}
          />
        </div>
      </div>

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

      <div className="fr-mt-2w">
        <div className="fr-checkbox-group">
          <input
            type="checkbox"
            id="is-partner-checkbox-edit"
            checked={isPartner}
            onChange={handleIsPartnerChange}
          />
          <label className="fr-label" htmlFor="is-partner-checkbox-edit">
            Commune partenaire
          </label>
        </div>
      </div>

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
        </section>
      ) : (
        <Alert
          severity="warning"
          small
          title="Aucun manager"
          description="Aucun compte manager n’est associé à cette commune pour le moment."
        />
      )}

      {formError && (
        <Alert severity="error" title="Impossible d’enregistrer" description={formError} />
      )}

      <div className="fr-btns-group fr-btns-group--inline-sm fr-btns-group--right">
        <Button type="button" priority="secondary" onClick={onClose} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          type="submit"
          priority="primary"
          iconId={isSubmitting ? "fr-icon-refresh-line" : "fr-icon-save-line"}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}


