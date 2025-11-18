import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, parseSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TownQrCodeCard } from "@/components/TownQrCodeCard";
import { QrEmbedTutorial } from "@/components/QrEmbedTutorial";
import { ContributionDirectLink } from "@/components/ContributionDirectLink";
import { MediaKitBannerSection } from "@/components/MediaKitBannerSection";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { ensureCommuneSlug } from "@/lib/communes";

export default async function MediaKitPage() {
  const headerList = await headers();
  const cookieHeader = headerList.get("cookie") ?? "";
  const cookieName = `${getSessionCookieName()}=`;
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookieName))
    ?.substring(cookieName.length);

  const session = await parseSessionCookie(sessionCookie);

  if (
    !session ||
    !["TOWN_MANAGER", "TOWN_EMPLOYEE"].includes(session.user.role)
  ) {
    redirect("/admin");
  }

  const communeId = session.user.communeId;

  if (!communeId) {
    redirect("/admin/profile");
  }

  const commune = await prisma.commune.findUnique({
    where: { id: communeId },
    select: {
      id: true,
      name: true,
      slug: true,
      postalCode: true,
    },
  });

  if (!commune) {
    redirect("/admin");
  }

  const protoHeader =
    headerList.get("x-forwarded-proto") ??
    headerList.get("x-forwarded-protocol") ??
    headerList.get("forwarded") ??
    "";
  const hostHeader =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const originHeader =
    headerList.get("origin") ?? headerList.get("referer") ?? "";

  const protocol = protoHeader.split(",")[0]?.split(";")[0]?.trim() || "https";
  const host = hostHeader.split(",")[0]?.trim() ?? "";

  let baseUrl = "";

  if (host) {
    baseUrl = `${protocol}://${host}`;
  } else if (originHeader) {
    try {
      const originUrl = new URL(originHeader);
      baseUrl = `${originUrl.protocol}//${originUrl.host}`;
    } catch {
      // ignore parse errors
    }
  }

  if (!baseUrl) {
    const fallback =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_ADMIN_URL ??
      "";
    baseUrl = fallback;
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  const slug = await ensureCommuneSlug(commune);

  const contributionUrl = normalizedBaseUrl
    ? `${normalizedBaseUrl}/contrib/${slug}`
    : `/contrib/${slug}`;

  const embedQrUrl = normalizedBaseUrl
    ? `${normalizedBaseUrl}/embed/qr/${slug}`
    : `/embed/qr/${slug}`;

  const embedBannerUrl = normalizedBaseUrl
    ? `${normalizedBaseUrl}/embed/banner/${slug}`
    : `/embed/banner/${slug}`;

  return (
    <main className="fr-pt-6w fr-pb-8w">
      <section className="fr-container fr-container--fluid">
        <div className="fr-grid-row">
          <div className="fr-col-12 fr-col-lg-10">
            <h1 className="fr-h2">Kit média</h1>
            <p className="fr-text--lg fr-mb-4w">
              Utilisez ces outils pour promouvoir votre portail citoyen et
              faciliter l&apos;accès des citoyennes et citoyens au tunnel de
              contribution de votre commune. Chaque section peut être intégrée
              sur votre site web ou partagée sur vos supports de communication.
            </p>
          </div>
        </div>
      </section>

      <section className="fr-container fr-container--fluid fr-mt-4w">
        <div className="fr-grid-row">
          <div className="fr-col-12 fr-col-lg-10">
            <Accordion label="QR Code" className="fr-mb-2w">
              <div className="fr-flow">
                <TownQrCodeCard
                  communeName={commune.name}
                  contributionUrl={contributionUrl}
                />
                <QrEmbedTutorial embedBaseUrl={embedQrUrl} />
              </div>
            </Accordion>

            <Accordion label="Bannière web" className="fr-mb-2w">
              <MediaKitBannerSection
                communeName={commune.name}
                contributionUrl={contributionUrl}
                embedBaseUrl={embedBannerUrl}
              />
            </Accordion>

            <Accordion label="Lien direct" className="fr-mb-2w">
              <div className="fr-flow">
                <p className="fr-text--sm">
                  Vous pouvez aussi partager le lien vers le tunnel ci-dessous
                  pour l&apos;intégrer directement sur vos supports numériques,
                  sans passer par le QR Code ou la bannière.
                </p>
                <ContributionDirectLink contributionUrl={contributionUrl} />
              </div>
            </Accordion>
          </div>
        </div>
      </section>
    </main>
  );
}
