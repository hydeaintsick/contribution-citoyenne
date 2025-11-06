"use client";

import { useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SideMenu, type SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";
import { Badge } from "@codegouvfr/react-dsfr/Badge";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    [isLoggingOut, router],
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
      text: (
        <span className="fr-display-inline-flex fr-align-items-center fr-gap-1w fr-text-mention--grey">
          Communes
          <Badge small severity="info">
            Bientôt disponible
          </Badge>
        </span>
      ),
      isActive: false,
      linkProps: {
        href: "#communes",
        onClick: handleComingSoonClick,
        "aria-disabled": true,
        tabIndex: -1,
      },
    },
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

