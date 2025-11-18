"use client";

import { useEffect } from "react";

type PwaSetupProps = {
  communeSlug: string;
};

export function PwaSetup({ communeSlug }: PwaSetupProps) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Ajouter le lien vers le manifest dynamique
    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = `/api/manifest/${communeSlug}`;
    document.head.appendChild(manifestLink);

    // Enregistrer le service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .then((registration) => {
          console.log("Service Worker registered:", registration.scope);

          // Vérifier les mises à jour périodiquement
          setInterval(() => {
            registration.update();
          }, 60000); // Vérifier toutes les minutes
        })
        .catch((error) => {
          console.warn("Service Worker registration failed:", error);
        });
    }

    // Nettoyage au démontage
    return () => {
      // Retirer le lien manifest si le composant est démonté
      const existingLink = document.querySelector(
        `link[rel="manifest"][href="/api/manifest/${communeSlug}"]`
      );
      if (existingLink) {
        existingLink.remove();
      }
    };
  }, [communeSlug]);

  return null;
}

