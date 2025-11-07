"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SideMenu, type SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

type AdminRole = "ADMIN" | "ACCOUNT_MANAGER" | null;

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
        if (role === "ADMIN" || role === "ACCOUNT_MANAGER") {
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

  const handleComingSoonClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

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

  const items: SideMenuProps["items"] = [
    {
      text: (
        <span className="fr-display-inline-flex fr-align-items-center fr-gap-1w fr-text-mention--grey">
          Dashboard
          <Badge small severity="info">
            Bientôt disponible
          </Badge>
        </span>
      ),
      isActive: false,
      linkProps: {
        href: "#dashboard",
        onClick: handleComingSoonClick,
        "aria-disabled": true,
        tabIndex: -1,
      },
    },
    {
      text: "Communes",
      isActive: pathname === "/admin/communes",
      linkProps: {
        href: "/admin/communes",
      },
    },
    ...(isAdmin
      ? [
          {
            text: "Chargés de compte",
            isActive: pathname === "/admin/account-managers",
            linkProps: {
              href: "/admin/account-managers",
            },
          },
        ]
      : []),
    {
      text: "Mon profil",
      isActive: pathname === "/admin/profile",
      linkProps: {
        href: "/admin/profile",
      },
    },
    {
      text: isLoggingOut ? "Déconnexion..." : "Déconnexion",
      isActive: false,
      linkProps: {
        href: "/admin/logout",
        onClick: handleLogout,
      },
    },
  ];

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
