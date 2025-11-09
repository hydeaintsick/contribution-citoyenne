import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, parseSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TownQrCodeCard } from "@/components/TownQrCodeCard";
import { QrEmbedTutorial } from "@/components/QrEmbedTutorial";

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

  const contributionUrl = normalizedBaseUrl
    ? `${normalizedBaseUrl}/contrib/${commune.id}`
    : `/contrib/${commune.id}`;

  const embedUrl = normalizedBaseUrl
    ? `${normalizedBaseUrl}/embed/qr/${commune.id}`
    : `/embed/qr/${commune.id}`;

  return (
    <main className="fr-pt-6w fr-pb-8w">
      <section className="fr-container fr-container--fluid">
        <div className="fr-grid-row fr-grid-row--center">
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
    </main>
  );
}
