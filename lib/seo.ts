import type { Metadata } from "next";

const siteName = "Contribcit";
const siteDescription =
  "Offrez à vos habitants un canal simple pour alerter et suggérer. Avec Contribcit, un QR code suffit pour remonter les informations de terrain, cartographier les besoins et accélérer le traitement.";
const siteUrl = process.env.BASE_URL || "https://contribcit.org";
const previewImagePath = "/marianne.png";
const previewImageAlt =
  "Contribcit - Marianne, symbole de la République française";

export function createMetadata(): Metadata {
  return {
    title: {
      default: siteName,
      template: `%s - ${siteName}`,
    },
    description: siteDescription,
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: siteUrl,
      siteName,
      title: siteName,
      description: siteDescription,
      images: [
        {
          url: previewImagePath,
          width: 1200,
          height: 630,
          alt: previewImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: siteDescription,
      images: [
        {
          url: previewImagePath,
          alt: previewImageAlt,
        },
      ],
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}

export function createJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteName,
        url: siteUrl,
        description: siteDescription,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}${previewImagePath}`,
        },
      },
      {
        "@type": "Product",
        "@id": `${siteUrl}/#product`,
        name: siteName,
        description: siteDescription,
        brand: {
          "@type": "Organization",
          name: siteName,
        },
        category: "Logiciel de gestion citoyenne",
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          priceCurrency: "EUR",
        },
        image: `${siteUrl}${previewImagePath}`,
      },
    ],
  };
}

