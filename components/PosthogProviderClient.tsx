"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const CONSENT_STORAGE_KEY = "consent-analytics";

let posthogInitialized = false;

function hasConsent(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(CONSENT_STORAGE_KEY) === "true";
}

type PosthogProviderClientProps = {
  children: ReactNode;
};

export function PosthogProviderClient({
  children,
}: PosthogProviderClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !POSTHOG_KEY) {
      return;
    }

    if (!posthogInitialized) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false,
        capture_pageleave: false,
        opt_out_capturing_by_default: true,
      });
      posthogInitialized = true;
    }

    const syncConsentWithPosthog = () => {
      if (!hasConsent()) {
        posthog.opt_out_capturing();
        return;
      }

      posthog.opt_in_capturing();
    };

    syncConsentWithPosthog();
    setIsReady(true);

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key !== CONSENT_STORAGE_KEY) {
        return;
      }
      syncConsentWithPosthog();
    };

    const handleCustomConsentChange = () => {
      syncConsentWithPosthog();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("consent-analytics-change", handleCustomConsentChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "consent-analytics-change",
        handleCustomConsentChange,
      );
    };
  }, []);

  useEffect(() => {
    if (!POSTHOG_KEY || !isReady || typeof window === "undefined") {
      return;
    }

    if (!hasConsent()) {
      return;
    }

    posthog.capture("$pageview");
  }, [pathname, searchParams, isReady]);

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

