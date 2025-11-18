"use client";

import { useEffect, useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { usePwaInstall } from "@/lib/usePwaInstall";

type PwaInstallPromptProps = {
  communeName: string;
  delay?: number; // Délai en millisecondes avant d'afficher le prompt
};

export function PwaInstallPrompt({
  communeName,
  delay = 3000,
}: PwaInstallPromptProps) {
  const { isInstallable, isInstalled, isPrompted, promptInstall, dismissPrompt, isIOS } =
    usePwaInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Détecter si on est sur mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Vérifier si on est sur mobile
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Détecter le scroll pour afficher le prompt
  useEffect(() => {
    if (typeof window === "undefined" || !isMobile) {
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 200 && !hasScrolled) {
        setHasScrolled(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMobile, hasScrolled]);

  // Afficher le prompt après le délai ou après le scroll
  useEffect(() => {
    // Sur iOS, on affiche même si isInstallable est false (car beforeinstallprompt n'existe pas)
    // Sur Android, on attend l'événement beforeinstallprompt
    const shouldShow = isIOS ? !isInstalled && !isPrompted : isInstallable;
    
    if (
      !isMobile ||
      isInstalled ||
      isPrompted ||
      !shouldShow ||
      isVisible
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    // Afficher aussi après le scroll
    if (hasScrolled) {
      clearTimeout(timer);
      setIsVisible(true);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [isMobile, isInstalled, isPrompted, isInstallable, isIOS, delay, hasScrolled, isVisible]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    setIsVisible(false);
  };

  // Ne rien afficher si :
  // - Pas sur mobile
  // - Déjà installé
  // - Déjà refusé
  // - Pas encore visible
  // Note: Sur iOS, on affiche même si isInstallable est false
  if (!isVisible || !isMobile || isInstalled || isPrompted) {
    return null;
  }

  // Sur Android, vérifier aussi isInstallable
  if (!isIOS && !isInstallable) {
    return null;
  }

  return (
    <div
      className="fr-consent-banner"
      role="dialog"
      aria-labelledby="fr-pwa-install-title"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "var(--background-raised-grey)",
        padding: "1rem",
        zIndex: 1000,
        boxShadow: "var(--raised-shadow)",
        borderTop: "1px solid var(--border-default-grey)",
      }}
    >
      <div className="fr-container">
        <div className="fr-grid-row fr-grid-row--middle">
          <div className="fr-col-12 fr-col-md-8">
            <h2 id="fr-pwa-install-title" className="fr-h6 fr-mb-2w">
              Installer l&apos;application
            </h2>
            {isIOS ? (
              <p className="fr-text--sm">
                Installez l&apos;application Contribcit pour{" "}
                <strong>{communeName}</strong> sur votre iPhone/iPad :{" "}
                <strong>Appuyez sur le bouton Partager</strong> (icône carrée avec flèche){" "}
                puis sélectionnez{" "}
                <strong>&quot;Sur l&apos;écran d&apos;accueil&quot;</strong>.
              </p>
            ) : (
              <p className="fr-text--sm">
                Installez l&apos;application Contribcit pour{" "}
                <strong>{communeName}</strong> sur votre appareil et accédez-y
                rapidement depuis votre écran d&apos;accueil.
              </p>
            )}
          </div>
          <div className="fr-col-12 fr-col-md-4 fr-mt-2w fr-mt-md-0">
            <div className="fr-btns-group fr-btns-group--inline">
              <Button
                priority="secondary"
                onClick={handleDismiss}
                iconId="fr-icon-close-line"
              >
                Plus tard
              </Button>
              <Button
                onClick={isIOS ? handleDismiss : handleInstall}
                iconId={isIOS ? "fr-icon-share-line" : "fr-icon-download-line"}
              >
                {isIOS ? "J'ai compris" : "Installer"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

