import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, parseSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TownQrCodeCard } from "@/components/TownQrCodeCard";
import { QrEmbedTutorial } from "@/components/QrEmbedTutorial";
import { ContributionDirectLink } from "@/components/ContributionDirectLink";
import { ensureCommuneSlug } from "@/lib/communes";

export default async function TownQrCodePage() {
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

  const embedUrl = normalizedBaseUrl
    ? `${normalizedBaseUrl}/embed/qr/${slug}`
    : `/embed/qr/${slug}`;

  return (
    <main className="fr-pt-6w fr-pb-8w">
      <section className="fr-container fr-container--fluid">
        <div className="fr-grid-row">
          <div className="fr-col-12 fr-col-lg-10">
            <h1 className="fr-h2">QR Code de la ville</h1>
            <p className="fr-text--lg fr-mb-4w">
              Partagez ce QR Code pour permettre aux citoyennes et citoyens
              d&apos;accéder directement au tunnel de contribution de votre
              commune.
            </p>
          </div>
        </div>
      </section>
      <TownQrCodeCard
        communeName={commune.name}
        contributionUrl={contributionUrl}
      />
      <QrEmbedTutorial embedBaseUrl={embedUrl} />
      <section className="fr-container fr-container--fluid fr-mt-4w">
        <div className="fr-grid-row">
          <div className="fr-col-12 fr-col-lg-10">
            <h2 className="fr-h3 fr-mb-2w">Intégrer le tunnel directement</h2>
            <p className="fr-text--sm">
              Vous pouvez aussi partager le lien vers le tunnel ci-dessous pour
              l&apos;intégrer directement sur vos supports numériques, sans
              passer par le QR Code.
            </p>
            <ContributionDirectLink contributionUrl={contributionUrl} />
          </div>
        </div>
      </section>
    </main>
  );
}
