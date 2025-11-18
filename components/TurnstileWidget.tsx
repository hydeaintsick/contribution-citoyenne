"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: (error: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          language?: string;
          size?: "normal" | "compact";
          retry?: "auto" | "never";
          "retry-interval"?: number;
          "refresh-expired"?: "auto" | "manual" | "never";
          appearance?: "always" | "execute" | "interaction-only";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

export type TurnstileWidgetProps = {
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  onExpired?: () => void;
  theme?: "light" | "dark" | "auto";
  className?: string;
};

/**
 * Cloudflare Turnstile widget component
 * 
 * Uses "managed" mode (invisible) by default - no user interaction required in 99% of cases
 * 
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 */
export function TurnstileWidget({
  onSuccess,
  onError,
  onExpired,
  theme = "auto",
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRenderedRef = useRef(false);

  // Store callbacks in refs to avoid re-renders
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onExpiredRef = useRef(onExpired);

  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onExpiredRef.current = onExpired;
  }, [onSuccess, onError, onExpired]);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      console.warn("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured");
      setError("Configuration manquante");
      return;
    }

    // Load Turnstile script if not already loaded
    if (typeof window !== "undefined" && !window.turnstile) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsLoaded(true);
      };
      script.onerror = () => {
        setError("Impossible de charger Turnstile");
        if (onErrorRef.current) {
          onErrorRef.current("script-load-error");
        }
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      setIsLoaded(true);
    }
  }, [siteKey]);

  useEffect(() => {
    // Prevent multiple renders
    if (hasRenderedRef.current) {
      return;
    }

    if (!isLoaded || !siteKey || !containerRef.current || !window.turnstile) {
      return;
    }

    // Render Turnstile widget in managed mode (invisible)
    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          onSuccessRef.current(token);
        },
        "error-callback": (errorCode: string) => {
          console.error("Turnstile error", errorCode);
          setError(`Erreur Turnstile: ${errorCode}`);
          if (onErrorRef.current) {
            onErrorRef.current(errorCode);
          }
        },
        "expired-callback": () => {
          console.warn("Turnstile token expired");
          if (onExpiredRef.current) {
            onExpiredRef.current();
          }
        },
        theme,
        appearance: "execute", // Managed mode - invisible, executes automatically
        size: "normal",
        retry: "auto",
        "retry-interval": 8000,
        "refresh-expired": "auto",
      });

      widgetIdRef.current = widgetId;
      hasRenderedRef.current = true;
    } catch (err) {
      console.error("Failed to render Turnstile widget", err);
      setError("Erreur lors de l'initialisation");
      if (onErrorRef.current) {
        onErrorRef.current("render-error");
      }
    }

    // Cleanup function
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (err) {
          console.warn("Failed to remove Turnstile widget", err);
        }
        widgetIdRef.current = null;
        hasRenderedRef.current = false;
      }
    };
  }, [isLoaded, siteKey, theme]);

  if (!siteKey) {
    return (
      <div className={className} aria-hidden="true">
        {/* Silent failure - don't block form submission if Turnstile is not configured */}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} aria-hidden="true">
        {/* Silent failure - don't show error to user, form can still be submitted */}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      aria-label="Vérification de sécurité"
      aria-live="polite"
    />
  );
}

