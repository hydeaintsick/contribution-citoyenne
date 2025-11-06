import type { Metadata } from "next";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { DsfrProviderClient } from "@/components/DsfrProviderClient";
import { HeaderClient } from "@/components/HeaderClient";
import { ConsentBannerClient } from "@/components/ConsentBannerClient";
import { createMetadata, createJsonLd } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = createMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = createJsonLd();

  return (
    <html lang="fr" data-fr-theme="light">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <DsfrProviderClient>
          <HeaderClient />
          <ConsentBannerClient />
          {children}
          <Footer
            accessibility="non compliant"
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
            contentDescription={
              <>
                Contribcit - Pour une ville sûre qui nous unit
                <br />
                La contribution citoyenne, simple et sécurisée
              </>
            }
            bottomItems={[
              {
                text: "Mentions légales",
                linkProps: {
                  href: "/#mentions-legales",
                },
              },
              {
                text: "Politique de confidentialité",
                linkProps: {
                  href: "/confidentialite",
                },
              },
              {
                text: "Contact",
                linkProps: {
                  href: "/#contact",
                },
              },
              {
                text: "Code source",
                linkProps: {
                  href: "https://github.com/hydeaintsick/contribution-citoyenne",
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              },
            ]}
          />
        </DsfrProviderClient>
      </body>
    </html>
  );
}
