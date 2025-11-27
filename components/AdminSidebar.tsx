"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SideMenu, type SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";

type AdminRole =
  | "ADMIN"
  | "ACCOUNT_MANAGER"
  | "TOWN_MANAGER"
  | "TOWN_EMPLOYEE"
  | null;

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<AdminRole>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          headers: {
            "Cache-Control": "no-store",
          },
        });
        if (!isMounted) {
          return;
        }
        if (!response.ok) {
          setUserRole(null);
          return;
        }
        const data = (await response.json().catch(() => null)) as {
          user?: { role?: string | null };
        } | null;
        const role = data?.user?.role;
        if (
          role === "ADMIN" ||
          role === "ACCOUNT_MANAGER" ||
          role === "TOWN_MANAGER" ||
          role === "TOWN_EMPLOYEE"
        ) {
          setUserRole(role);
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error("Failed to load session", error);
        if (isMounted) {
          setUserRole(null);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const isAdmin = userRole === "ADMIN";
  const isAccountManager = userRole === "ACCOUNT_MANAGER";
  const isTownManager = userRole === "TOWN_MANAGER";
  const isTownEmployee = userRole === "TOWN_EMPLOYEE";

  const handleLogout = useCallback(
    async (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (isLoggingOut) {
        return;
      }
      setIsLoggingOut(true);
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
        });
        router.push("/admin/login");
        router.refresh();
      } finally {
        setIsLoggingOut(false);
      }
    },
    [isLoggingOut, router]
  );

  const townDashboardActive =
    pathname === "/admin" ||
    pathname === "/admin/" ||
    pathname === "/admin/dashboard";

  const items: SideMenuProps["items"] = (() => {
    if (!userRole) {
      return [];
    }

    if (isAdmin || isAccountManager) {
      const baseItems: SideMenuProps["items"] = [
        {
          text: "Tableau de bord",
          isActive: pathname === "/admin" || pathname === "/admin/",
          linkProps: {
            href: "/admin",
          },
        },
        {
          text: "Communes",
          isActive: pathname === "/admin/communes",
          linkProps: {
            href: "/admin/communes",
          },
        },
        {
          text: "Annonces",
          isActive: pathname === "/admin/news",
          linkProps: {
            href: "/admin/news",
          },
        },
      ];

      if (isAdmin) {
        baseItems.push({
          text: "Chargés de compte",
          isActive: pathname === "/admin/account-managers",
          linkProps: {
            href: "/admin/account-managers",
          },
        });
      }

      baseItems.push({
        text: "Mon profil",
        isActive: pathname === "/admin/profile",
        linkProps: {
          href: "/admin/profile",
        },
      });

      baseItems.push({
        text: isLoggingOut ? "Déconnexion..." : "Déconnexion",
        isActive: false,
        linkProps: {
          href: "/admin/logout",
          onClick: handleLogout,
        },
      });

      return baseItems;
    }

    if (isTownManager || isTownEmployee) {
      const townItems: SideMenuProps["items"] = [
        {
          text: "Dashboard",
          isActive: townDashboardActive,
          linkProps: {
            href: "/admin",
          },
        },
        {
          text: "Retours citoyens",
          isActive: pathname.startsWith("/admin/retours"),
          linkProps: {
            href: "/admin/retours",
          },
        },
        {
          text: "Kit média",
          isActive: pathname === "/admin/kit-media",
          linkProps: {
            href: "/admin/kit-media",
          },
        },
        {
          text: "Configuration",
          isActive: pathname === "/admin/configuration-ville",
          linkProps: {
            href: "/admin/configuration-ville",
          },
        },
        {
          text: "API",
          isActive: pathname === "/admin/api",
          linkProps: {
            href: "/admin/api",
          },
        },
      ];

      if (isTownManager) {
        townItems.push({
          text: "Accès salariés",
          isActive: pathname.startsWith("/admin/acces-salaries"),
          linkProps: {
            href: "/admin/acces-salaries",
          },
        });
      }

      townItems.push({
        text: "Mon profil",
        isActive: pathname === "/admin/profile",
        linkProps: {
          href: "/admin/profile",
        },
      });

      townItems.push({
        text: isLoggingOut ? "Déconnexion..." : "Déconnexion",
        isActive: false,
        linkProps: {
          href: "/admin/logout",
          onClick: handleLogout,
        },
      });

      return townItems;
    }

    return [];
  })();

  if (!items.length) {
    return null;
  }

  return (
    <SideMenu
      title="Navigation"
      burgerMenuButtonText="Menu"
      items={items}
      classes={{
        link: "fr-text--md",
      }}
      className="fr-mb-2w"
    />
  );
}
