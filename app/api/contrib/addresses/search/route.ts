import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const searchSchema = z.object({
  communeId: z.string().trim().min(1, "Commune manquante."),
  q: z.string().trim().min(2, "Requête trop courte."),
  limit: z
    .string()
    .transform((value) => Number.parseInt(value, 10))
    .pipe(z.number().int().min(1).max(10))
    .optional(),
});

type BanFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    id?: string | number;
    label?: string;
    name?: string;
    postcode?: string;
    city?: string;
    context?: string;
    importance?: number;
    score?: number;
  };
};

const BAN_BASE_URL = "https://api-adresse.data.gouv.fr/search/";
const DEFAULT_USER_AGENT = "Contribcit/1.0 (+https://contribcit.fr)";
const COORDINATE_TOLERANCE = 0.01; // ~1km, laisse un peu de marge pour BAN

function normalizeString(value: string | null | undefined) {
  return value
    ? value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
    : "";
}

function doesFeatureMatchCommune(
  properties: BanFeature["properties"],
  normalizedCommuneName: string,
  communePostalCodes: string[]
) {
  const normalizedCity = normalizeString(properties?.city);
  if (normalizedCity && normalizedCity === normalizedCommuneName) {
    return true;
  }

  const normalizedContext = normalizeString(properties?.context);
  if (
    normalizedContext &&
    (normalizedContext === normalizedCommuneName ||
      normalizedContext.includes(normalizedCommuneName))
  ) {
    return true;
  }

  const postcode = properties?.postcode?.trim();
  if (postcode && communePostalCodes.length > 0) {
    return communePostalCodes.some((code) => postcode.startsWith(code));
  }

  return false;
}

function isWithinBbox(latitude: number, longitude: number, bbox: number[], tolerance = COORDINATE_TOLERANCE) {
  if (bbox.length !== 4) {
    return true;
  }
  const [south, north, west, east] = bbox;
  return (
    latitude >= south - tolerance &&
    latitude <= north + tolerance &&
    longitude >= west - tolerance &&
    longitude <= east + tolerance
  );
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const input = {
    communeId: url.searchParams.get("communeId") ?? "",
    q: url.searchParams.get("q") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
  };

  const validation = searchSchema.safeParse(input);

  if (!validation.success) {
    const [issue] = validation.error.issues;
    return NextResponse.json(
      {
        error: issue?.message ?? "Paramètres de recherche invalides.",
      },
      { status: 400 },
    );
  }

  const { communeId, q, limit } = validation.data;

  try {
    const commune = await prisma.commune.findUnique({
      where: {
        id: communeId,
      },
      select: {
        id: true,
        name: true,
        postalCode: true,
        bbox: true,
        latitude: true,
        longitude: true,
        isVisible: true,
      },
    });

    if (!commune || !commune.isVisible) {
      return NextResponse.json(
        { error: "Commune introuvable ou indisponible." },
        { status: 404 },
      );
    }

    const enrichedQuery = [q, commune.name]
      .filter((part) => part && part.length > 0)
      .join(" ");

    const normalizedCommuneName = normalizeString(commune.name);
    const communePostalCodes = commune.postalCode
      ? commune.postalCode
          .split(/[,; ]+/)
          .map((part) => part.trim())
          .filter((part) => part.length > 0)
      : [];

    const banUrl = new URL(BAN_BASE_URL);
    banUrl.searchParams.set("q", enrichedQuery);
    banUrl.searchParams.set("limit", String(Math.min(limit ?? 7, 10)));
    banUrl.searchParams.set("autocomplete", "1");
    banUrl.searchParams.append("type", "housenumber");
    banUrl.searchParams.append("type", "street");
    banUrl.searchParams.append("type", "locality");
    banUrl.searchParams.set("lat", commune.latitude.toString());
    banUrl.searchParams.set("lon", commune.longitude.toString());

    const response = await fetch(banUrl, {
      headers: {
        "User-Agent": process.env.BAN_USER_AGENT ?? DEFAULT_USER_AGENT,
        "Accept-Language": "fr",
      },
      next: {
        revalidate: 0,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Le service d’autocomplétion est indisponible." },
        { status: 502 },
      );
    }

    const payload = (await response.json().catch(() => null)) as
      | { features?: BanFeature[] }
      | null;

    if (!payload || !Array.isArray(payload.features)) {
      return NextResponse.json(
        { suggestions: [] },
        { status: 200 },
      );
    }

    const suggestions = payload.features
      .map((feature) => {
        const [lon, lat] = feature.geometry?.coordinates ?? [undefined, undefined];
        const label = feature.properties?.label?.trim();
        if (
          typeof lat !== "number" ||
          typeof lon !== "number" ||
          !label
        ) {
          return null;
        }
        const matchesCommune =
          isWithinBbox(lat, lon, commune.bbox) ||
          doesFeatureMatchCommune(feature.properties, normalizedCommuneName, communePostalCodes);
        if (!matchesCommune) {
          return null;
        }
        return {
          id: feature.properties?.id ? String(feature.properties.id) : `${lat},${lon}`,
          label,
          name: feature.properties?.name ?? label,
          context: feature.properties?.context ?? null,
          latitude: lat,
          longitude: lon,
          postcode: feature.properties?.postcode ?? null,
          city: feature.properties?.city ?? null,
        };
      })
      .filter((suggestion): suggestion is NonNullable<typeof suggestion> => suggestion !== null);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("BAN search failed", error);
    return NextResponse.json(
      { error: "La recherche d’adresse a échoué. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
