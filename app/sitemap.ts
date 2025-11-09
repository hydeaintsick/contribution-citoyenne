import type { MetadataRoute } from "next";

const siteUrl = process.env.BASE_URL || "https://contribcit.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "/",
    "/pitch",
    "/qui-sommes-nous",
    "/annuaire",
    "/confidentialite",
    "/bug",
    "/suivi-des-bugs",
  ];

  const lastModified = new Date();

  return staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
  }));
}


