"use client";

import { useState } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";

type GraphQLApiKeyDisplayProps = {
  apiKey: string | null;
};

export function GraphQLApiKeyDisplay({ apiKey }: GraphQLApiKeyDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy", error);
    }
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || "https://contribcit.org";

  return (
    <>
      <div className="fr-mb-4w">
        <h2 className="fr-h4 fr-mb-2w">Clé API</h2>
        <p className="fr-text--sm fr-mb-2w">
          Utilisez cette clé API pour vous authentifier auprès de l'endpoint
          GraphQL. Cette clé est la même que celle utilisée pour les webhooks.
        </p>
        {apiKey ? (
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="api-key">
              Votre clé API
            </label>
            <div className="fr-input-wrap fr-input-wrap--addon">
              <input
                id="api-key"
                className="fr-input"
                type="text"
                value={apiKey}
                readOnly
                style={{ fontFamily: "monospace" }}
              />
              <button
                type="button"
                className="fr-btn fr-btn--secondary"
                title="Copier la clé API"
                onClick={handleCopy}
                style={{ minWidth: "auto" }}
              >
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
            <p className="fr-hint-text fr-mt-1v">
              Cette clé est générée automatiquement et doit être gardée secrète.
            </p>
          </div>
        ) : (
          <Alert
            severity="warning"
            title="Clé API non disponible"
            description="Veuillez configurer un webhook pour générer une clé API."
            className="fr-mb-2w"
          />
        )}
      </div>

      <div className="fr-mb-4w">
        <h2 className="fr-h4 fr-mb-2w">Endpoint GraphQL</h2>
        <div className="fr-input-group">
          <label className="fr-label" htmlFor="graphql-endpoint">
            URL de l'endpoint
          </label>
          <input
            id="graphql-endpoint"
            className="fr-input"
            type="text"
            value={`${baseUrl}/api/graphql`}
            readOnly
            style={{ fontFamily: "monospace" }}
          />
        </div>
      </div>

      <div className="fr-mb-4w">
        <h2 className="fr-h4 fr-mb-2w">Sandbox de test</h2>
        <p className="fr-text--sm fr-mb-2w">
          Testez vos requêtes GraphQL directement dans votre navigateur avec
          notre sandbox Apollo intégrée.
        </p>
        {apiKey ? (
          <Link
            href={`/api/graphql/sandbox/${encodeURIComponent(apiKey)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fr-btn fr-btn--primary fr-icon-external-link-line"
          >
            Accéder à la sandbox
          </Link>
        ) : (
          <Link
            href="/admin/developpeurs/opengraph"
            className="fr-btn fr-btn--primary fr-icon-external-link-line"
            style={{
              opacity: 0.6,
              cursor: "not-allowed",
              pointerEvents: "none",
            }}
          >
            Accéder à la sandbox (clé API requise)
          </Link>
        )}
      </div>

      <div className="fr-mb-4w">
        <h2 className="fr-h4 fr-mb-2w">Documentation</h2>
        <p className="fr-text--sm fr-mb-2w">
          Consultez la documentation complète de l'API GraphQL pour découvrir
          toutes les fonctionnalités disponibles.
        </p>
        <Button
          linkProps={{
            href: "/docs#graphql",
            target: "_blank",
            rel: "noopener noreferrer",
          }}
          priority="secondary"
        >
          Voir la documentation
        </Button>
      </div>
    </>
  );
}
