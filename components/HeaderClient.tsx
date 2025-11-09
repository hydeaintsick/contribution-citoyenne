"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header, type HeaderProps } from "@codegouvfr/react-dsfr/Header";
import { useTheme } from "@/components/ThemeProviderClient";

type QuickAccessItems = NonNullable<HeaderProps["quickAccessItems"]>;
type QuickAccessIconId = HeaderProps.QuickAccessItem["iconId"];

type UserRole = "ADMIN" | "ACCOUNT_MANAGER" | "TOWN_MANAGER" | "TOWN_EMPLOYEE";

type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  communeId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  lastLoginAt?: string | null;
};

type HeaderClientProps = {
  initialSessionUser: SessionUser | null;
};

function areSessionUsersEqual(a: SessionUser | null, b: SessionUser | null) {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return (
    a.id === b.id &&
    a.email === b.email &&
    a.role === b.role &&
    a.firstName === b.firstName &&
    a.lastName === b.lastName &&
    a.lastLoginAt === b.lastLoginAt
  );
}

const communePortalUrl =
  process.env.NEXT_PUBLIC_COMMUNE_PORTAL_URL ?? "/admin/login";

export function HeaderClient({ initialSessionUser }: HeaderClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasSession, setHasSession] = useState(
    () => initialSessionUser !== null
  );
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(
    () => initialSessionUser
  );
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === "dark";

  const updateSessionState = useCallback((nextUser: SessionUser | null) => {
    setSessionUser((currentUser) => {
      if (areSessionUsersEqual(currentUser, nextUser)) {
        return currentUser;
      }
      return nextUser;
    });
    setHasSession((currentHasSession) => {
      const nextHasSession = Boolean(nextUser);
      if (currentHasSession === nextHasSession) {
        return currentHasSession;
      }
      return nextHasSession;
    });
  }, []);

  const openAdminSpace = useCallback(() => {
    window.open("/admin", "_blank", "noopener,noreferrer");
  }, []);

  const openCommuneSpace = useCallback(() => {
    window.open(communePortalUrl, "_blank", "noopener,noreferrer");
  }, []);

  const isAdminArea =
    pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin");

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

        if (!response.ok) {
          updateSessionState(null);
          return;
        }

        const data = (await response.json()) as { user: SessionUser | null };

        if (!isMounted) {
          return;
        }

        updateSessionState(data.user ?? null);
      } catch (error) {
        if (
          !isMounted ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }
        updateSessionState(null);
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [pathname, updateSessionState]);

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
        updateSessionState(null);
      }
      router.push("/admin/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router, updateSessionState]);

  const userRole = sessionUser?.role ?? null;

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
          text: "Annuaire",
          linkProps: {
            href: "/annuaire",
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

    if (!userRole) {
      return [
        {
          text: "Dashboard",
          linkProps: {
            href: "/admin",
          },
        },
        {
          text: "Mon profil",
          linkProps: {
            href: "/admin/profile",
          },
        },
      ];
    }

    if (userRole === "ADMIN") {
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
          text: "Retours produits",
          linkProps: {
            href: "/admin/retours-produits",
          },
        },
        {
          text: "Chargés de compte",
          linkProps: {
            href: "/admin/account-managers",
          },
        },
        {
          text: "Mon profil",
          linkProps: {
            href: "/admin/profile",
          },
        },
      ];
    }

    if (userRole === "ACCOUNT_MANAGER") {
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
          text: "Retours produits",
          linkProps: {
            href: "/admin/retours-produits",
          },
        },
        {
          text: "Mon profil",
          linkProps: {
            href: "/admin/profile",
          },
        },
      ];
    }

    if (userRole === "TOWN_MANAGER") {
      return [
        {
          text: "Dashboard",
          linkProps: {
            href: "/admin",
          },
        },
        {
          text: "Retours citoyens",
          linkProps: {
            href: "/admin/retours",
          },
        },
        {
          text: "QRCode",
          linkProps: {
            href: "/admin/qr-code",
          },
        },
        {
          text: "Accès salariés",
          linkProps: {
            href: "/admin/acces-salaries",
          },
        },
        {
          text: "Mon profil",
          linkProps: {
            href: "/admin/profile",
          },
        },
      ];
    }

    if (userRole === "TOWN_EMPLOYEE") {
      return [
        {
          text: "Dashboard",
          linkProps: {
            href: "/admin",
          },
        },
        {
          text: "Retours citoyens",
          linkProps: {
            href: "/admin/retours",
          },
        },
        {
          text: "QRCode",
          linkProps: {
            href: "/admin/qr-code",
          },
        },
        {
          text: "Mon profil",
          linkProps: {
            href: "/admin/profile",
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
        text: "Mon profil",
        linkProps: {
          href: "/admin/profile",
        },
      },
    ];
  }, [isAdminArea, userRole]);

  const quickAccessItems = useMemo<QuickAccessItems>(() => {
    const themeToggleItem: QuickAccessItems[number] = {
      iconId: isDarkTheme ? "fr-icon-sun-line" : "fr-icon-moon-line",
      text: "",
      buttonProps: {
        onClick: toggleTheme,
        "aria-pressed": isDarkTheme,
        "aria-label": isDarkTheme
          ? "Basculer vers le mode clair"
          : "Basculer vers le mode nuit",
        title: isDarkTheme
          ? "Basculer vers le mode clair"
          : "Basculer vers le mode nuit",
        className: "fr-btn--icon fr-btn--sm",
        style: { minWidth: "auto" },
      },
    };

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

      if (!hasSession && !isAdminRoute) {
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

      return [themeToggleItem, ...items];
    }

    return [
      themeToggleItem,
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
    isAdminRoute,
    isDarkTheme,
    isLoggingOut,
    openAdminSpace,
    openCommuneSpace,
    toggleTheme,
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
        serviceTagline="La parole aux citoyens des territoires"
        navigation={navigation}
        quickAccessItems={quickAccessItems}
      />
    </div>
  );
}
