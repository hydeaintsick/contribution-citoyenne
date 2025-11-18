import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { EmbedChromeHider } from "@/components/EmbedChromeHider";
import { MediaKitBanner } from "@/components/MediaKitBanner";
import { fetchCommuneBySlugOrId } from "@/lib/communes";
import type { MediaKitBannerTheme } from "@/components/MediaKitBanner";

type EmbedBannerPageProps =
  | { params: { communeSlug: string }; searchParams: { theme?: string } }
  | {
      params: Promise<{ communeSlug: string }>;
      searchParams: Promise<{ theme?: string }>;
    };

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as Promise<T>).then === "function";
}

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EmbedBannerPage(props: EmbedBannerPageProps) {
  const resolvedParams = isPromise(props.params)
    ? await props.params
    : props.params;
  const resolvedSearchParams = isPromise(props.searchParams)
    ? await props.searchParams
    : props.searchParams;

  const communeSlugParam = Array.isArray(resolvedParams.communeSlug)
    ? resolvedParams.communeSlug[0]
    : resolvedParams.communeSlug;

  if (!communeSlugParam) {
    notFound();
  }

  const commune = await fetchCommuneBySlugOrId(communeSlugParam);

  if (!commune) {
    notFound();
  }

  if (commune.slug && commune.slug !== communeSlugParam) {
    redirect(`/embed/banner/${commune.slug}`);
  }

  const headerList = await headers();
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
    ? `${normalizedBaseUrl}/contrib/${commune.slug}`
    : `/contrib/${commune.slug}`;

  const themeParam = resolvedSearchParams.theme;
  const theme: MediaKitBannerTheme =
    themeParam === "white" ? "white" : "blue";

  return (
    <>
      <EmbedChromeHider />
      <main
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <MediaKitBanner
          communeName={commune.name}
          contributionUrl={contributionUrl}
          theme={theme}
          className="fr-m-2w"
        />
      </main>
    </>
  );
}

