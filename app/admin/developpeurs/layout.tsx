"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SideMenu, type SideMenuProps } from "@codegouvfr/react-dsfr/SideMenu";

export default function DeveloppeursLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const items: SideMenuProps["items"] = [
    {
      text: "API & Webhooks",
      isActive: pathname === "/admin/developpeurs/api",
      linkProps: {
        href: "/admin/developpeurs/api",
      },
    },
    {
      text: "GraphQL",
      isActive: pathname === "/admin/developpeurs/opengraph",
      linkProps: {
        href: "/admin/developpeurs/opengraph",
      },
    },
  ];

  return (
    <div className="admin-shell admin-shell--default">
      <div className="admin-shell-container fr-container fr-py-8w">
        <div className="fr-grid-row fr-grid-row--gutters">
          {/* Menu latéral */}
          <aside className="fr-col-12 fr-col-md-3">
            <SideMenu
              title="Développeurs"
              burgerMenuButtonText="Menu"
              items={items}
              classes={{
                link: "fr-text--md",
              }}
              className="fr-mb-2w"
            />
          </aside>
          {/* Contenu principal */}
          <main className="fr-col-12 fr-col-md-9">
            <div className="fr-p-6w fr-background-alt--grey fr-radius--md">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

