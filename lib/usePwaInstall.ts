"use client";

import { useEffect, useState, useCallback } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaInstallState = {
  isInstallable: boolean;
  isInstalled: boolean;
  isPrompted: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  isIOS: boolean;
};

const STORAGE_KEY = "contribcit-pwa-install-dismissed";

// Détecter iOS
function isIOS(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function usePwaInstall() {
  const [state, setState] = useState<PwaInstallState>({
    isInstallable: false,
    isInstalled: false,
    isPrompted: false,
    deferredPrompt: null,
    isIOS: false,
  });

  // Détecter iOS et vérifier si l'app est déjà installée
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const ios = isIOS();

    // Vérifier si l'app est en mode standalone (installée)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    // Vérifier si l'utilisateur a déjà refusé l'installation
    const wasDismissed = localStorage.getItem(STORAGE_KEY) === "true";

    setState((prev) => ({
      ...prev,
      isIOS: ios,
      isInstalled: isStandalone,
      isPrompted: wasDismissed,
      // Sur iOS, considérer comme installable si pas déjà installé et pas déjà refusé
      isInstallable: ios ? !isStandalone && !wasDismissed : prev.isInstallable,
    }));
  }, []);

  // Écouter l'événement beforeinstallprompt
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher le prompt par défaut du navigateur
      e.preventDefault();

      const beforeInstallPromptEvent = e as BeforeInstallPromptEvent;

      setState((prev) => ({
        ...prev,
        isInstallable: true,
        deferredPrompt: beforeInstallPromptEvent,
      }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Écouter l'événement appinstalled (quand l'app est installée)
    const handleAppInstalled = () => {
      setState((prev) => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        deferredPrompt: null,
      }));
      localStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    // Sur iOS, on ne peut pas déclencher le prompt programmatiquement
    // On retourne true pour indiquer qu'on a "traité" la demande
    // mais l'utilisateur devra utiliser le menu partage
    if (state.isIOS) {
      // Marquer comme "vu" pour ne pas réafficher immédiatement
      setState((prev) => ({
        ...prev,
        isPrompted: true,
      }));
      localStorage.setItem(STORAGE_KEY, "true");
      return true;
    }

    if (!state.deferredPrompt) {
      return false;
    }

    try {
      // Afficher le prompt d'installation (Android uniquement)
      await state.deferredPrompt.prompt();

      // Attendre la réponse de l'utilisateur
      const choiceResult = await state.deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        setState((prev) => ({
          ...prev,
          isInstalled: true,
          isInstallable: false,
          deferredPrompt: null,
        }));
        localStorage.removeItem(STORAGE_KEY);
        return true;
      } else {
        // L'utilisateur a refusé
        setState((prev) => ({
          ...prev,
          isPrompted: true,
        }));
        localStorage.setItem(STORAGE_KEY, "true");
        return false;
      }
    } catch (error) {
      console.error("Error prompting for PWA install:", error);
      return false;
    }
  }, [state.deferredPrompt, state.isIOS]);

  const dismissPrompt = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPrompted: true,
    }));
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  return {
    ...state,
    promptInstall,
    dismissPrompt,
  };
}

