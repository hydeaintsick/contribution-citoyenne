"use client";

import { Header } from "@codegouvfr/react-dsfr/Header";

export function HeaderClient() {
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
        navigation={[
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
        ]}
        quickAccessItems={[
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
        ]}
      />
    </div>
  );
}
