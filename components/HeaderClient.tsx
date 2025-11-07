"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header, type HeaderProps } from "@codegouvfr/react-dsfr/Header";

type QuickAccessItems = NonNullable<HeaderProps["quickAccessItems"]>;
type QuickAccessIconId = HeaderProps.QuickAccessItem["iconId"];

const communePortalUrl =
  process.env.NEXT_PUBLIC_COMMUNE_PORTAL_URL ?? "/admin/login";

export function HeaderClient() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const openAdminSpace = useCallback(() => {
    window.open("/admin", "_blank", "noopener,noreferrer");
  }, []);

  const openCommuneSpace = useCallback(() => {
    window.open(communePortalUrl, "_blank", "noopener,noreferrer");
  }, []);

  const isAdminArea =
    pathname.startsWith("/admin") && pathname !== "/admin/login";

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          signal: controller.signal,
        });

        if (!isMounted) {
          return;
        }

        setHasSession(response.ok);
      } catch (error) {
        if (
          !isMounted ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }
        setHasSession(false);
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        setHasSession(false);
      }
      router.push("/admin/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router]);

  const navigation = useMemo(() => {
    if (!isAdminArea) {
      return [
        {
          text: "Accueil",
          linkProps: {
            href: "/",
          },
        },
        {
          text: "Comment ça marche",
          linkProps: {
            href: "/#how-it-works",
          },
        },
        {
          text: "Contact",
          linkProps: {
            href: "/#contact",
          },
        },
        {
          text: "Notre mission",
          linkProps: {
            href: "/qui-sommes-nous",
          },
        },
      ];
    }

    return [
      {
        text: "Dashboard",
        linkProps: {
          href: "/admin",
        },
      },
      {
        text: "Communes",
        linkProps: {
          href: "/admin/communes",
        },
      },
      {
        text: "Mon profil",
        linkProps: {
          href: "/admin/profile",
        },
      },
    ];
  }, [isAdminArea]);

  const quickAccessItems = useMemo<QuickAccessItems>(() => {
    const logoutIconId: QuickAccessIconId = isLoggingOut
      ? "fr-icon-refresh-line"
      : "fr-icon-logout-box-r-line";

    if (!isAdminArea) {
      const items: QuickAccessItems = [
        {
          iconId: "fr-icon-mail-line",
          text: "Nous contacter",
          buttonProps: {
            onClick: () => {
              document
                .getElementById("contact")
                ?.scrollIntoView({ behavior: "smooth" });
            },
          },
        },
      ];

      if (!hasSession) {
        items.push({
          iconId: "fr-icon-lock-line",
          text: "Espace commune",
          buttonProps: {
            onClick: openCommuneSpace,
            className: "fr-btn--primary",
          },
        });
      }

      if (hasSession) {
        items.push({
          iconId: "fr-icon-external-link-line",
          text: "Espace admin",
          buttonProps: {
            onClick: openAdminSpace,
            className: "fr-btn--primary",
          },
        });
        items.push({
          iconId: logoutIconId,
          text: isLoggingOut ? "Déconnexion..." : "Déconnexion",
          buttonProps: {
            onClick: handleLogout,
            disabled: isLoggingOut,
            className: "fr-btn--secondary",
          },
        });
      }

      return items;
    }

    return [
      {
        iconId: logoutIconId,
        text: isLoggingOut ? "Déconnexion..." : "Déconnexion",
        buttonProps: {
          onClick: handleLogout,
          disabled: isLoggingOut,
          className: "fr-btn--secondary",
        },
      },
    ] satisfies QuickAccessItems;
  }, [
    handleLogout,
    hasSession,
    isAdminArea,
    isLoggingOut,
    openAdminSpace,
    openCommuneSpace,
  ]);

  return (
    <div suppressHydrationWarning>
      <Header
        brandTop={
          <>
            RÉPUBLIQUE
            <br />
            FRANÇAISE
          </>
        }
        homeLinkProps={{
          href: "/",
          title: "Accueil - Contribcit",
        }}
        serviceTitle="Contribcit"
        serviceTagline="Pour une ville sûre qui nous unit"
        navigation={navigation}
        quickAccessItems={quickAccessItems}
      />
    </div>
  );
}
