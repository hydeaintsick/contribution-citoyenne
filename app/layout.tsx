import Link from "next/link";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { cookies } from "next/headers";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { HeaderClient } from "@/components/HeaderClient";
import { ConsentBannerClient } from "@/components/ConsentBannerClient";
import { DsfrProviderClient } from "@/components/DsfrProviderClient";
import { ThemeProviderClient } from "@/components/ThemeProviderClient";
import { PosthogProviderClient } from "@/components/PosthogProviderClient";
import { createMetadata, createJsonLd } from "@/lib/seo";
import { getSessionCookieName, parseSessionCookie } from "@/lib/session";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { SocialMediasBanner } from "@/components/SocialMediasBanner";
import "./globals.css";

export const metadata: Metadata = createMetadata();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionCookieValue =
    cookieStore.get(getSessionCookieName())?.value ?? undefined;
  const session = await parseSessionCookie(sessionCookieValue);
  const initialSessionUser = session?.user ?? null;

  const jsonLd = createJsonLd();

  return (
    <html
      lang="fr"
      data-fr-theme="light"
      data-fr-scheme="light"
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#000091" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Contribcit" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script type="module" src="/dsfr/dsfr/dsfr.module.js" defer />
        <script
          type="text/javascript"
          noModule
          src="/dsfr/dsfr/dsfr.nomodule.js"
          defer
        />
      </head>
      <body suppressHydrationWarning>
        <PosthogProviderClient>
          <DsfrProviderClient>
            <ThemeProviderClient>
              <HeaderClient initialSessionUser={initialSessionUser} />
              <ConsentBannerClient />
              {children}
              <GoogleAnalytics />
              <SocialMediasBanner />
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
                    Contribcit - La parole aux citoyens des territoires
                    <br />
                    La contribution citoyenne, simple et sécurisée
                    <br />
                    <span className="fr-text--sm">
                      Projet d'initiative citoyenne d'utilité publique, sans
                      soutien officiel de l'État.
                    </span>
                    <br />
                    <span className="fr-text--sm">
                      Pour toute réclamation, vous pouvez remplir le{" "}
                      <Link href="/#contact" className="fr-link fr-link--sm">
                        formulaire de contact
                      </Link>
                      .
                    </span>
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
                    text: "Signaler un bug",
                    linkProps: {
                      href: "/bug",
                    },
                  },
                  {
                    text: "Suivi des bugs",
                    linkProps: {
                      href: "/suivi-des-bugs",
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
                  {
                    text: "Mistral AI",
                    linkProps: {
                      href: "https://mistral.ai",
                      target: "_blank",
                      rel: "noopener noreferrer",
                      title: "Visiter le site de Mistral AI (nouvelle fenêtre)",
                    },
                  },
                ]}
              />
            </ThemeProviderClient>
          </DsfrProviderClient>
        </PosthogProviderClient>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
