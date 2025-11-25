"use client";

import { useCallback, useState, useTransition } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import Link from "next/link";

type CommuneSettingsFormProps = {
  communeId: string;
  initialSafeModeEnabled: boolean;
};

export function CommuneSettingsForm({
  communeId,
  initialSafeModeEnabled,
}: CommuneSettingsFormProps) {
  const [safeModeEnabled, setSafeModeEnabled] = useState(initialSafeModeEnabled);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSafeModeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.checked;
      const previousValue = safeModeEnabled;
      setSafeModeEnabled(newValue);
      setError(null);
      setSuccess(false);

      startTransition(async () => {
        try {
          const response = await fetch(
            `/api/admin/communes/${communeId}/safe-mode`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                safeModeEnabled: newValue,
              }),
            }
          );

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as {
              error?: string;
            } | null;
            throw new Error(
              payload?.error ?? "La mise à jour a échoué. Veuillez réessayer."
            );
          }

          setSuccess(true);
        } catch (error) {
          console.error("Failed to update safe mode", error);
          setError(
            error instanceof Error
              ? error.message
              : "Une erreur est survenue pendant la mise à jour."
          );
          // Revert to previous value on error
          setSafeModeEnabled(previousValue);
        }
      });
    },
    [communeId, safeModeEnabled]
  );

  return (
    <div className="fr-flow">
      <section className="fr-card fr-card--no-arrow fr-card--shadow fr-card--horizontal">
        <div className="fr-card__body fr-px-4w fr-py-4w">
          <h2 className="fr-h5 fr-mb-2w">Safe mode</h2>
          <p className="fr-text--md fr-mb-2w">
            Activez le safe mode pour masquer automatiquement le titre et le contenu des retours détectés comme potentiellement malveillants.
          </p>

          <div className="fr-mt-2w">
            <div className="fr-toggle">
              <input
                type="checkbox"
                id="safe-mode-toggle"
                checked={safeModeEnabled}
                onChange={handleSafeModeChange}
                disabled={isPending}
              />
              <label
                className="fr-toggle__label"
                htmlFor="safe-mode-toggle"
                data-fr-checked-label="Activé"
                data-fr-unchecked-label="Désactivé"
              >
                Safe mode
              </label>
            </div>
          </div>

          {safeModeEnabled && (
            <Alert
              severity="warning"
              small
              title="Attention"
              description={
                <>
                  Cette fonctionnalité fonctionne grâce à{" "}
                  <Link
                    href="https://mistral.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fr-link"
                  >
                    MistralAI
                  </Link>{" "}
                  et peut encore faire des erreurs. En cas de problème vous pouvez{" "}
                  <Link href="/bug" className="fr-link">
                    signaler un bug
                  </Link>
                  .
                </>
              }
              className="fr-mt-2w"
            />
          )}

          {error && (
            <Alert
              severity="error"
              title="Erreur"
              description={error}
              className="fr-mt-2w"
            />
          )}

          {success && (
            <Alert
              severity="success"
              title="Paramètres mis à jour"
              description="Les réglages ont été enregistrés avec succès."
              className="fr-mt-2w"
            />
          )}
        </div>
      </section>
    </div>
  );
}

