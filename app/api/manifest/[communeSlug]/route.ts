import { NextRequest, NextResponse } from "next/server";
import { fetchCommuneBySlugOrId } from "@/lib/communes";

const BASE_URL = process.env.BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://contribcit.org";

function getBaseUrl(request: NextRequest): string {
  const url = new URL(request.url);
  const protoHeader =
    request.headers.get("x-forwarded-proto") ??
    request.headers.get("x-forwarded-protocol") ??
    "";
  const hostHeader =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";

  const protocol = protoHeader.split(",")[0]?.split(";")[0]?.trim() || url.protocol.slice(0, -1) || "https";
  const host = hostHeader.split(",")[0]?.trim() ?? url.host;

  if (host) {
    return `${protocol}://${host}`;
  }

  return BASE_URL;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ communeSlug: string }> | { communeSlug: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const communeSlug = Array.isArray(resolvedParams.communeSlug)
    ? resolvedParams.communeSlug[0]
    : resolvedParams.communeSlug;

  if (!communeSlug) {
    return NextResponse.json({ error: "Commune slug required" }, { status: 400 });
  }

  const commune = await fetchCommuneBySlugOrId(communeSlug);

  if (!commune || !commune.isVisible) {
    return NextResponse.json({ error: "Commune not found" }, { status: 404 });
  }

  const baseUrl = getBaseUrl(request);
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const startUrl = `${normalizedBaseUrl}/contrib/${commune.slug}`;

  const manifest = {
    name: `Contribcit - ${commune.name}`,
    short_name: "Contribcit",
    description: `Portail citoyen de ${commune.name} - Signalez un problème ou partagez une idée pour améliorer la vie locale`,
    start_url: startUrl,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000091",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    categories: ["government", "utilities"],
    lang: "fr",
    dir: "ltr",
    scope: `${normalizedBaseUrl}/contrib/${commune.slug}`,
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

