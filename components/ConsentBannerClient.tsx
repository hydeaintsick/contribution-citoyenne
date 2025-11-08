"use client";

import { useState, useEffect } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";

export function ConsentBannerClient() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("consent-analytics");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem("consent-analytics", "true");
    setIsVisible(false);
    // Ici vous pouvez charger Matomo ou autre service d'analyse
  };

  const rejectAll = () => {
    localStorage.setItem("consent-analytics", "false");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fr-consent-banner"
      role="dialog"
      aria-labelledby="fr-consent-banner-title"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--background-raised-grey)",
        padding: "1rem",
        zIndex: 1000,
        boxShadow: "var(--raised-shadow)",
      }}
    >
      <div className="fr-container">
        <div className="fr-grid-row fr-grid-row--middle">
          <div className="fr-col-12 fr-col-md-8">
            <h2 id="fr-consent-banner-title" className="fr-h6 fr-mb-2w">
              Gestion des cookies
            </h2>
            <p className="fr-text--sm">
              Ce site utilise des cookies pour analyser l'audience. Vous pouvez accepter ou
              refuser ces cookies.
            </p>
            <p className="fr-text--sm fr-mt-1w">
              <a href="/confidentialite" className="fr-link">
                En savoir plus
              </a>
            </p>
          </div>
          <div className="fr-col-12 fr-col-md-4 fr-mt-2w fr-mt-md-0">
            <div className="fr-btns-group fr-btns-group--inline">
              <Button priority="secondary" onClick={rejectAll}>
                Tout refuser
              </Button>
              <Button onClick={acceptAll}>Tout accepter</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
