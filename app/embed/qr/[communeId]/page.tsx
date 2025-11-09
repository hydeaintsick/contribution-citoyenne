import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { EmbedChromeHider } from "@/components/EmbedChromeHider";
import { prisma } from "@/lib/prisma";

type EmbedQrPageProps =
  | { params: { communeId: string } }
  | { params: Promise<{ communeId: string }> };

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof (value as Promise<T>).then === "function";
}

export default async function EmbedQrPage(props: EmbedQrPageProps) {
  const resolvedParams = isPromise(props.params)
    ? await props.params
    : props.params;

  const communeIdParam = Array.isArray(resolvedParams.communeId)
    ? resolvedParams.communeId[0]
    : resolvedParams.communeId;

  if (!communeIdParam) {
    notFound();
  }

  const commune = await prisma.commune.findUnique({
    where: { id: communeIdParam },
    select: {
      id: true,
      name: true,
    },
  });

  if (!commune) {
    notFound();
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
    ? `${normalizedBaseUrl}/contrib/${commune.id}`
    : `/contrib/${commune.id}`;

  const accentColor = "#000091";
  const textColor = "#ffffff";

  return (
    <>
      <EmbedChromeHider />
      <main
        style={{
          margin: 0,
          padding: "8vh 4vw",
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: accentColor,
          color: textColor,
          textAlign: "center",
          boxSizing: "border-box",
          gap: "4vh",
        }}
      >
        <header
          style={{
            display: "grid",
            gap: "1vh",
            justifyItems: "center",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontSize: "0.85rem",
              fontWeight: 600,
              letterSpacing: "0.3em",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "0.75rem",
                height: "1.5rem",
                background:
                  "linear-gradient(180deg, #000091 0%, #000091 33%, #ffffff 33%, #ffffff 66%, #e1000f 66%, #e1000f 100%)",
                marginRight: "0.75rem",
              }}
            />
            RÉPUBLIQUE FRANÇAISE
          </span>
          <span
            style={{
              fontSize: "3rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Contribcit
          </span>
        </header>

        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "3rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 18px 40px rgba(0, 0, 0, 0.25)",
            borderRadius: 0,
            width: "100%",
            maxWidth: "520px",
          }}
        >
          <QRCodeSVG
            value={contributionUrl}
            size={512}
            bgColor="#ffffff"
            fgColor={accentColor}
            level="H"
            includeMargin
            style={{ width: "100%", height: "auto" }}
          />
        </div>

        <footer>
          <p
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            Ville de {commune.name}
          </p>
          <p
            style={{
              margin: "0.75rem 0 0",
              fontSize: "1rem",
              color: "rgba(255, 255, 255, 0.85)",
            }}
          >
            Votre avis compte.
          </p>
        </footer>
      </main>
    </>
  );
}
