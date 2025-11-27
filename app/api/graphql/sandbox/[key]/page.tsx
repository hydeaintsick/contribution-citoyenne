"use client";

import { ApolloSandbox } from "@apollo/sandbox/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function GraphQLSandboxPageWithKey() {
  const params = useParams();
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Décoder la clé API depuis l'URL une fois que les params sont disponibles
    if (params?.key) {
      try {
        setApiKey(decodeURIComponent(String(params.key)));
      } catch (error) {
        console.error("Erreur lors du décodage de la clé API:", error);
      }
    }
  }, [params]);

  useEffect(() => {
    // Ne rien faire si pas de clé API
    if (!apiKey) return;
    // Fonction pour masquer uniquement les éléments spécifiques indésirables
    const hideElements = () => {
      const selectors = [
        "header",
        "footer",
        "nav:not([data-sandbox])",
        '[id*="consent"]',
        '[class*="SocialMedias"]',
        '[class*="ConsentBanner"]',
        '[class*="HeaderClient"]',
        '[class*="Footer"]',
        ".fr-follow",
        ".fr-follow__social",
        ".admin-shell",
        ".admin-shell-container",
      ];

      selectors.forEach((selector) => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            // Ne pas masquer si c'est dans notre conteneur sandbox
            if (!htmlEl.closest("[data-sandbox-container]")) {
              htmlEl.style.display = "none";
            }
          });
        } catch (e) {
          // Ignore les erreurs de sélecteur
        }
      });
    };

    // Forcer les dimensions sur html, body et #__next pour plein écran
    document.documentElement.style.height = "100vh";
    document.documentElement.style.width = "100vw";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";

    document.body.style.height = "100vh";
    document.body.style.width = "100vw";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    const nextRoot = document.getElementById("__next");
    if (nextRoot) {
      nextRoot.style.height = "100vh";
      nextRoot.style.width = "100vw";
      nextRoot.style.overflow = "hidden";
      nextRoot.style.margin = "0";
      nextRoot.style.padding = "0";
    }

    // S'assurer que le main prend toute la hauteur
    const main = document.querySelector("main");
    if (main) {
      const mainEl = main as HTMLElement;
      mainEl.style.height = "100vh";
      mainEl.style.width = "100vw";
      mainEl.style.margin = "0";
      mainEl.style.padding = "0";
      mainEl.style.overflow = "hidden";
    }

    // Forcer l'iframe et tous ses conteneurs à prendre toute la hauteur/largeur
    const forceFullScreen = () => {
      const iframe = document.querySelector("iframe");
      if (iframe) {
        iframe.style.width = "100vw";
        iframe.style.height = "100vh";
        iframe.style.margin = "0";
        iframe.style.padding = "0";
        iframe.style.border = "none";
        iframe.style.position = "fixed";
        iframe.style.top = "0";
        iframe.style.left = "0";
        iframe.style.zIndex = "99999";

        // Forcer tous les parents de l'iframe
        let parent = iframe.parentElement;
        while (parent && parent !== document.body) {
          parent.style.width = "100vw";
          parent.style.height = "100vh";
          parent.style.margin = "0";
          parent.style.padding = "0";
          parent.style.overflow = "hidden";
          parent = parent.parentElement;
        }
      }
    };

    // Masquer les éléments indésirables après un court délai pour laisser le temps au DOM de se charger
    setTimeout(() => {
      hideElements();
      forceFullScreen();
    }, 100);

    // Observer pour forcer le plein écran quand l'iframe est ajouté
    const iframeObserver = new MutationObserver(() => {
      forceFullScreen();
    });

    iframeObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Observer pour masquer les nouveaux éléments ajoutés dynamiquement (mais pas trop agressif)
    const observer = new MutationObserver((mutations) => {
      let shouldHide = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const el = node as HTMLElement;
            // Vérifier si c'est un header, footer, etc.
            if (
              el.tagName === "HEADER" ||
              el.tagName === "FOOTER" ||
              el.tagName === "NAV" ||
              el.id?.includes("consent") ||
              el.className?.includes("SocialMedias") ||
              el.className?.includes("ConsentBanner") ||
              el.className?.includes("HeaderClient") ||
              el.className?.includes("Footer")
            ) {
              // Ne pas masquer si c'est dans notre conteneur sandbox
              if (!el.closest("[data-sandbox-container]")) {
                shouldHide = true;
              }
            }
          }
        });
      });
      if (shouldHide) {
        hideElements();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Nettoyer les observers au démontage
    return () => {
      observer.disconnect();
      iframeObserver.disconnect();
    };
  }, [apiKey]);

  // Si pas de clé API, afficher un message d'attente
  if (!apiKey) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Chargement de la sandbox...</p>
      </div>
    );
  }

  return (
    <div
      data-sandbox-container
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <ApolloSandbox
        initialEndpoint="/api/graphql"
        includeCookies={false}
        initialState={{
          document: `# Bienvenue dans la sandbox GraphQL Contribcit
# 
# Cette API est réservée aux communes premium.
# 
# Votre clé API a été automatiquement configurée dans les headers.
#
# Exemple de requête :

query {
  commune {
    id
    name
    postalCode
  }
  
  contributions(pagination: { first: 10 }) {
    totalCount
    edges {
      node {
        id
        ticketNumber
        type
        status
        categoryLabel
        createdAt
      }
    }
  }
  
  stats {
    totals {
      overall
      last30Days
      alerts {
        count
        percentage
      }
    }
  }
}`,
          headers: {
            "X-API-Key": apiKey || "",
          },
        }}
      />
    </div>
  );
}

