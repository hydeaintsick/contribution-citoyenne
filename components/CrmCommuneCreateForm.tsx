"use client";

import { useCallback, useMemo, useState } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

type CommunePayload = {
  name: string;
  postalCode: string;
  osmId: string;
  osmType: string;
  bbox: number[];
  latitude: number;
  longitude: number;
};

type FormStatus = {
  type: "success" | "error";
  message: string;
};

type CrmCommuneCreateFormProps = {
  onCommuneCreated?: () => void;
};

export function CrmCommuneCreateForm({ onCommuneCreated }: CrmCommuneCreateFormProps) {
  const [postalCode, setPostalCode] = useState("");
  const [communeData, setCommuneData] = useState<CommunePayload | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [verificationState, setVerificationState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus | null>(null);

  const handleVerifyPostalCode = useCallback(async () => {
    setFormStatus(null);
    setVerificationMessage(null);

    if (!/^\d{5}$/.test(postalCode.trim())) {
      setVerificationState("error");
      setVerificationMessage("Le code postal doit comporter 5 chiffres.");
      setCommuneData(null);
      return;
    }

    setVerificationState("loading");

    try {
      const response = await fetch(
        `/api/admin/communes/lookup?postalCode=${encodeURIComponent(postalCode.trim())}`,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setVerificationState("error");
        setCommuneData(null);
        setVerificationMessage(
          payload?.error ?? "Impossible de vérifier la commune.",
        );
        return;
      }

      const data = (await response.json()) as CommunePayload;
      setCommuneData(data);
      setVerificationState("success");
      setVerificationMessage(`Commune identifiée : ${data.name}`);
    } catch (error) {
      console.error("Postal code verification failed", error);
      setVerificationState("error");
      setCommuneData(null);
      setVerificationMessage(
        "La vérification a échoué. Veuillez réessayer dans quelques instants.",
      );
    }
  }, [postalCode]);

  const resetForm = useCallback(() => {
    setPostalCode("");
    setCommuneData(null);
    setWebsiteUrl("");
    setVerificationState("idle");
    setVerificationMessage(null);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormStatus(null);

      if (!communeData) {
        setFormStatus({
          type: "error",
          message: "Veuillez vérifier le code postal avant de créer la commune.",
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch("/api/admin/communes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...communeData,
            websiteUrl: websiteUrl.trim(),
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          setFormStatus({
            type: "error",
            message: payload?.error ?? "La création a échoué.",
          });
          return;
        }

        const payload = (await response.json()) as {
          commune: { name: string; postalCode: string };
        };

        setFormStatus({
          type: "success",
          message: `La commune ${payload.commune.name} (${payload.commune.postalCode}) a été créée avec succès.`,
        });
        onCommuneCreated?.();
        resetForm();
      } catch (error) {
        console.error("CRM commune creation failed", error);
        setFormStatus({
          type: "error",
          message: "Une erreur est survenue. Veuillez réessayer.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [communeData, onCommuneCreated, resetForm, websiteUrl],
  );

  const bboxDisplayValue = useMemo(() => {
    if (!communeData) {
      return "";
    }
    const [south, north, west, east] = communeData.bbox;
    return `Sud: ${south.toFixed(6)} | Nord: ${north.toFixed(6)} | Ouest: ${west.toFixed(6)} | Est: ${east.toFixed(6)}`;
  }, [communeData]);

  return (
    <form className="fr-flow" onSubmit={handleSubmit}>
      <p className="fr-text--sm">
        Identifiez la commune via son code postal puis créez la commune (non visible sur la plateforme).
      </p>

      {formStatus && (
        <Alert
          severity={formStatus.type === "success" ? "success" : "error"}
          small
          title={formStatus.type === "success" ? "Commune créée" : "Erreur"}
          description={formStatus.message}
        />
      )}

      <section aria-labelledby="commune-info" className="fr-flow">
        <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4 fr-mb-0">
            <Input
              label="Code postal"
              nativeInputProps={{
                value: postalCode,
                onChange: (event) => setPostalCode(event.target.value),
                inputMode: "numeric",
                pattern: "\\d{5}",
                maxLength: 5,
                required: true,
                autoComplete: "postal-code",
              }}
            />
          </div>
          <div className="fr-col-12 fr-col-md-4 fr-col-lg-3 fr-align-self-end fr-mt-0 fr-mt-md-4w">
            <Button
              type="button"
              priority="primary"
              onClick={handleVerifyPostalCode}
              disabled={verificationState === "loading"}
              iconId={verificationState === "loading" ? "fr-icon-refresh-line" : undefined}
            >
              {verificationState === "loading" ? "Vérification…" : "Vérifier"}
            </Button>
          </div>
        </div>

        {verificationState === "success" && verificationMessage && (
          <div className="fr-mt-2w">
            <Alert
              severity="success"
              small
              title="Commune vérifiée"
              description={verificationMessage}
            />
          </div>
        )}

        {verificationState === "error" && verificationMessage && (
          <div className="fr-mt-2w">
            <Alert severity="error" small title="Vérification impossible" description={verificationMessage} />
          </div>
        )}

        <div className="fr-grid-row fr-grid-row--gutters fr-mt-2w">
          <div className="fr-col-12 fr-col-md-6">
            <Input
              label="Nom de la commune"
              disabled
              nativeInputProps={{
                value: communeData?.name ?? "",
                readOnly: true,
                placeholder: "Vérifiez le code postal pour remplir ce champ",
              }}
            />
          </div>
          <div className="fr-col-12 fr-col-md-3">
            <Input
              label="Latitude"
              disabled
              nativeInputProps={{
                value: communeData ? communeData.latitude.toFixed(6) : "",
                readOnly: true,
              }}
            />
          </div>
          <div className="fr-col-12 fr-col-md-3">
            <Input
              label="Longitude"
              disabled
              nativeInputProps={{
                value: communeData ? communeData.longitude.toFixed(6) : "",
                readOnly: true,
              }}
            />
          </div>
        </div>

        <div className="fr-mt-2w">
          <Input
            label="Site internet (optionnel)"
            nativeInputProps={{
              type: "url",
              value: websiteUrl,
              onChange: (event) => setWebsiteUrl(event.target.value),
              placeholder: "https://www.ville-exemple.fr",
              inputMode: "url",
            }}
          />
        </div>

        <div className="fr-mt-2w">
          <Input
            label="Emprise géographique (bbox)"
            disabled
            nativeInputProps={{
              value: bboxDisplayValue,
              readOnly: true,
            }}
          />
        </div>
      </section>

      <Button
        type="submit"
        priority="primary"
        disabled={isSubmitting || verificationState !== "success"}
        iconId={isSubmitting ? "fr-icon-refresh-line" : undefined}
        className="fr-mt-2w"
      >
        {isSubmitting ? "Création…" : "Créer la commune"}
      </Button>
    </form>
  );
}

