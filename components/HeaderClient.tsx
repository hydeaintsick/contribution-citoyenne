"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header, type HeaderProps } from "@codegouvfr/react-dsfr/Header";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { prDsfrLoaded } from "@codegouvfr/react-dsfr/start";
import { useTheme } from "@/components/ThemeProviderClient";
import { headerMenuModalIdPrefix } from "@codegouvfr/react-dsfr/Header/Header";

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

const HEADER_ID = "contribcit-header";
const MENU_MODAL_ID = `${headerMenuModalIdPrefix}-${HEADER_ID}`;

type DsfrGlobal = {
  dsfr?: {
    internals?: {
      state?: {
        isActive?: boolean;
      };
    };
  };
};

function hasDsfrStarted() {
  if (typeof window === "undefined") {
    return false;
  }
  const { dsfr } = window as Window & DsfrGlobal;
  return Boolean(dsfr?.internals?.state?.isActive);
}

function waitForDsfrStartSignal() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (hasDsfrStarted()) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    const html = document.documentElement;
    let timeoutId: number | undefined;

    const cleanup = () => {
      html.removeEventListener("dsfr.start", handleStart);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };

    const handleStart = () => {
      cleanup();
      resolve();
    };

    html.addEventListener("dsfr.start", handleStart, { once: true });

    timeoutId = window.setTimeout(() => {
      cleanup();
      resolve();
    }, 2000);
  });
}

let dsfrReadyPromise: Promise<void> | null = null;

function getDsfrReadyPromise() {
  if (dsfrReadyPromise) {
    return dsfrReadyPromise;
  }
  dsfrReadyPromise = (async () => {
    try {
      await prDsfrLoaded;
    } catch {
      return;
    }

    await waitForDsfrStartSignal();
  })();
  return dsfrReadyPromise;
}

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
  const [hasPremiumAccess, setHasPremiumAccess] = useState<boolean | null>(null);
  const [isDsfrReady, setIsDsfrReady] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === "dark";

  // Charger l'accès premium pour les communes
  useEffect(() => {
    if (
      !sessionUser ||
      !sessionUser.communeId ||
      (sessionUser.role !== "TOWN_MANAGER" && sessionUser.role !== "TOWN_EMPLOYEE")
    ) {
      setHasPremiumAccess(null);
      return;
    }

    let isCancelled = false;

    async function loadPremiumAccess() {
      try {
        const response = await fetch("/api/admin/communes/premium-access", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-store",
          },
        });
        if (isCancelled) {
          return;
        }
        if (response.ok) {
          const data = (await response.json()) as {
            hasPremiumAccess?: boolean;
          };
          const premiumAccess = data.hasPremiumAccess ?? false;
          setHasPremiumAccess(premiumAccess);
        } else {
          setHasPremiumAccess(false);
        }
      } catch (error) {
        console.error("Failed to load premium access", error);
        if (!isCancelled) {
          setHasPremiumAccess(false);
        }
      }
    }

    loadPremiumAccess();

    return () => {
      isCancelled = true;
    };
  }, [sessionUser]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    let isCancelled = false;
    const fallbackId = window.setTimeout(() => {
      if (isCancelled) {
        return;
      }
      setIsDsfrReady(true);
    }, 3000);

    getDsfrReadyPromise()
      .catch(() => {
        // Ignore errors, we use the fallback timeout to unlock the menu.
      })
      .finally(() => {
        if (isCancelled) {
          return;
        }
        window.clearTimeout(fallbackId);
        setIsDsfrReady(true);
      });
    return () => {
      isCancelled = true;
      window.clearTimeout(fallbackId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isDsfrReady) {
      return;
    }
    const menuButton = document.getElementById(`${HEADER_ID}-menu-button`);
    if (!menuButton) {
      return;
    }

    let hasPendingOpen = false;

    const handleClick = (event: MouseEvent) => {
      if (!event.isTrusted) {
        return;
      }
      if (isDsfrReady) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      const triggerOpen = () => {
        hasPendingOpen = false;
        if (!menuButton.isConnected) {
          return;
        }
        window.requestAnimationFrame(() => {
          menuButton.click();
        });
      };

      if (hasPendingOpen) {
        return;
      }
      hasPendingOpen = true;

      getDsfrReadyPromise().finally(triggerOpen);
    };

    menuButton.addEventListener("click", handleClick, true);

    return () => {
      menuButton.removeEventListener("click", handleClick, true);
    };
  }, [isDsfrReady]);

  useEffect(() => {
    if (typeof window === "undefined" || !isDsfrReady) {
      return;
    }
    const menuButton = document.getElementById(`${HEADER_ID}-menu-button`);
    const menuModal = document.getElementById(MENU_MODAL_ID);

    if (!menuButton || !menuModal) {
      return;
    }

    let isReplayInProgress = false;

    const handleClick = (event: MouseEvent) => {
      if (!event.isTrusted || isReplayInProgress) {
        return;
      }

      const wasOpen = menuButton.getAttribute("data-fr-opened") === "true";
      const expectedOpen = !wasOpen;

      window.requestAnimationFrame(() => {
        const isOpenNow = menuButton.getAttribute("data-fr-opened") === "true";
        const modalIsOpen = menuModal.getAttribute("open") === "true";

        if (isOpenNow === expectedOpen && modalIsOpen === expectedOpen) {
          return;
        }

        isReplayInProgress = true;

        window.requestAnimationFrame(() => {
          if (!menuButton.isConnected) {
            isReplayInProgress = false;
            return;
          }
          menuButton.click();
          window.setTimeout(() => {
            isReplayInProgress = false;
          }, 0);
        });
      });
    };

    menuButton.addEventListener("click", handleClick, true);

    return () => {
      menuButton.removeEventListener("click", handleClick, true);
    };
  }, [isDsfrReady]);

  const updateSessionState = useCallback(
    (nextUser: SessionUser | null) => {
      setSessionUser((currentUser) => {
        // Si nextUser est null mais qu'on a un initialSessionUser et pas de currentUser,
        // utiliser initialSessionUser comme fallback pour éviter de perdre la session au rafraîchissement
        if (!nextUser && initialSessionUser && !currentUser) {
          return initialSessionUser;
        }
        // Si nextUser est null mais qu'on a déjà un currentUser, le garder
        // (évite d'écraser une session valide en cas d'erreur réseau temporaire)
        if (!nextUser && currentUser) {
          return currentUser;
        }
        if (areSessionUsersEqual(currentUser, nextUser)) {
          return currentUser;
        }
        return nextUser;
      });
      setHasSession((currentHasSession) => {
        const nextHasSession = Boolean(nextUser ?? initialSessionUser);
        if (currentHasSession === nextHasSession) {
          return currentHasSession;
        }
        return nextHasSession;
      });
    },
    [initialSessionUser]
  );

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

  // Utiliser initialSessionUser comme fallback pour éviter que la navigation disparaisse au rafraîchissement
  const userRole = sessionUser?.role ?? initialSessionUser?.role ?? null;

  const normalizePath = useCallback((href: string) => {
    const [pathWithoutHash] = href.split("#");
    const [pathWithoutSearch] = (pathWithoutHash ?? href).split("?");
    const path = pathWithoutSearch ?? href;
    if (path === "/") {
      return path;
    }
    return path.replace(/\/+$/, "");
  }, []);

  const computeMatchScore = useCallback(
    (href: string) => {
      if (href.includes("#")) {
        return 0;
      }
      const linkPath = normalizePath(href);
      if (!linkPath) {
        return 0;
      }
      const currentPath = normalizePath(pathname);
      if (linkPath === currentPath) {
        return linkPath.length;
      }
      if (linkPath !== "/" && currentPath.startsWith(`${linkPath}/`)) {
        return linkPath.length;
      }
      return 0;
    },
    [normalizePath, pathname]
  );

  const withActiveNavigation = useCallback(
    <T extends { linkProps: { href: string } }>(items: T[]) => {
      let bestScore = 0;
      const scores = items.map(({ linkProps }) => {
        const score = computeMatchScore(linkProps.href);
        if (score > bestScore) {
          bestScore = score;
        }
        return score;
      });
      return items.map((item, index) => ({
        ...item,
        isActive: bestScore > 0 && scores[index] === bestScore,
      }));
    },
    [computeMatchScore]
  );

  const navigation = useMemo(() => {
    if (!isAdminArea) {
      return withActiveNavigation([
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
      ]);
    }

    if (!userRole) {
      return withActiveNavigation([
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
      ]);
    }

    if (userRole === "ADMIN") {
      return withActiveNavigation([
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
          text: "Annonces",
          linkProps: {
            href: "/admin/news",
          },
        },
        {
          text: "Retours produits",
          linkProps: {
            href: "/admin/retours-produits",
          },
        },
        {
          text: "Demandes de contact",
          linkProps: {
            href: "/admin/contact-tickets",
          },
        },
        {
          text: "Activité",
          linkProps: {
            href: "/admin/activite",
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
        {
          text: "Configuration",
          linkProps: {
            href: "/admin/configuration",
          },
        },
      ]);
    }

    if (userRole === "ACCOUNT_MANAGER") {
      return withActiveNavigation([
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
          text: "Annonces",
          linkProps: {
            href: "/admin/news",
          },
        },
        {
          text: "Retours produits",
          linkProps: {
            href: "/admin/retours-produits",
          },
        },
        {
          text: "Demandes de contact",
          linkProps: {
            href: "/admin/contact-tickets",
          },
        },
        {
          text: "Activité",
          linkProps: {
            href: "/admin/activite",
          },
        },
        {
          text: "Mon profil",
          linkProps: {
            href: "/admin/profile",
          },
        },
        {
          text: "Configuration",
          linkProps: {
            href: "/admin/configuration",
          },
        },
      ]);
    }

    if (userRole === "TOWN_MANAGER") {
      const items = [
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
          text: "Kit média",
          linkProps: {
            href: "/admin/kit-media",
          },
        },
        {
          text: "Configuration",
          linkProps: {
            href: "/admin/configuration-ville",
          },
        },
      ];

      // Ajouter le lien Développeurs uniquement si l'accès premium est activé
      if (hasPremiumAccess === true) {
        items.push({
          text: (
            <>
              Développeurs
              <Badge
                as="span"
                severity="new"
                small
                noIcon
                style={{
                  display: "inline-block",
                  marginLeft: "0.5rem",
                  backgroundColor: "#FFD700",
                  color: "#1a1a1a",
                  fontWeight: 600,
                }}
              >
                Premium
              </Badge>
            </>
          ) as any,
          linkProps: {
            href: "/admin/developpeurs/api",
          },
        });
      }

      items.push(
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
      );

      return withActiveNavigation(items);
    }

    if (userRole === "TOWN_EMPLOYEE") {
      const items = [
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
          text: "Kit média",
          linkProps: {
            href: "/admin/kit-media",
          },
        },
        {
          text: "Configuration",
          linkProps: {
            href: "/admin/configuration-ville",
          },
        },
      ];

      // Ajouter le lien Développeurs uniquement si l'accès premium est activé
      if (hasPremiumAccess === true) {
        items.push({
          text: (
            <>
              Développeurs
              <Badge
                as="span"
                severity="new"
                small
                noIcon
                style={{
                  display: "inline-block",
                  marginLeft: "0.5rem",
                  backgroundColor: "#FFD700",
                  color: "#1a1a1a",
                  fontWeight: 600,
                }}
              >
                Premium
              </Badge>
            </>
          ) as any,
          linkProps: {
            href: "/admin/developpeurs/api",
          },
        });
      }

      items.push({
        text: "Mon profil",
        linkProps: {
          href: "/admin/profile",
        },
      });

      return withActiveNavigation(items);
    }

    return withActiveNavigation([
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
    ]);
  }, [isAdminArea, userRole, withActiveNavigation, initialSessionUser, hasPremiumAccess]);

  const quickAccessItems = useMemo<QuickAccessItems>(() => {
    const themeToggleItem: QuickAccessItems[number] = {
      iconId: isDarkTheme ? "fr-icon-sun-line" : "fr-icon-moon-line",
      text: "Mode " + (isDarkTheme ? "clair" : "nuit"),
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
        id={HEADER_ID}
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
        serviceTagline={
          <>
            La parole aux citoyens des territoires
            <br />
            <Badge
              as="span"
              severity="info"
              small
              noIcon
              style={{
                display: "inline-block",
                marginTop: "0.25rem",
                backgroundColor: "var(--background-action-low-blue-france)",
                color: "var(--text-title-blue-france)",
              }}
            >
              Version bêta
            </Badge>
          </>
        }
        navigation={navigation}
        quickAccessItems={quickAccessItems}
      />
    </div>
  );
}
