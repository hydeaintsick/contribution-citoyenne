import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";

const lookupSchema = z.object({
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Code postal invalide."),
});

type NominatimResult = {
  display_name?: string;
  boundingbox?: [string, string, string, string];
  lat?: string;
  lon?: string;
  osm_type?: string;
  osm_id?: number;
  place_id?: number;
  class?: string;
  type?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    borough?: string;
    city_district?: string;
    state_district?: string;
    suburb?: string;
    postcode?: string;
  };
};

const DEFAULT_USER_AGENT = "Contribcit/1.0 (+https://contribcit.fr)";

const ARRONDISSEMENT_CITIES = new Set(["Paris", "Lyon", "Marseille"]);

function getOrdinalSuffix(city: string, value: number) {
  if (city === "Lyon" && value === 1) {
    return "er";
  }
  return "e";
}

function normalizeArrondissementName(city: string, district?: string) {
  if (!district) {
    return city;
  }

  let cleaned = district
    .replace(new RegExp(city, "i"), "")
    .replace(/arrondissement(?:s)?/gi, "")
    .replace(/de\s+/i, "")
    .replace(/^\s*[-,–]?\s*/g, "")
    .trim();

  if (!cleaned) {
    cleaned = district.trim();
  }

  if (/^\d+/.test(cleaned)) {
    cleaned = cleaned.replace(/^0+/, "");

    if (/^\d+$/.test(cleaned)) {
      const number = Number.parseInt(cleaned, 10);
      if (Number.isFinite(number) && number >= 1) {
        return `${city} ${number}${getOrdinalSuffix(city, number)}`;
      }
    }
  } else {
    cleaned = cleaned
      .replace(/Arrondissement/i, "")
      .replace(/de\s*/i, "")
      .replace(new RegExp(city, "i"), "")
      .trim();
  }

  if (!cleaned) {
    return city;
  }

  return `${city} ${cleaned}`;
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNT_MANAGER")
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const url = new URL(request.url);
  const postalCode = url.searchParams.get("postalCode") ?? "";

  const validation = lookupSchema.safeParse({ postalCode });

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0]?.message ?? "Code postal invalide." },
      { status: 400 }
    );
  }

  const osmUrl = new URL("https://nominatim.openstreetmap.org/search");
  osmUrl.searchParams.set("format", "json");
  osmUrl.searchParams.set("addressdetails", "1");
  osmUrl.searchParams.set("limit", "1");
  osmUrl.searchParams.set("countrycodes", "fr");
  osmUrl.searchParams.set("postalcode", validation.data.postalCode);

  try {
    const response = await fetch(osmUrl, {
      headers: {
        "User-Agent": process.env.OSM_USER_AGENT ?? DEFAULT_USER_AGENT,
        "Accept-Language": "fr",
      },
      next: {
        revalidate: 0,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Le service d'annuaire est indisponible." },
        { status: 502 }
      );
    }

    const results = (await response.json()) as NominatimResult[];

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        {
          error: "Aucune commune trouvée pour ce code postal.",
        },
        { status: 404 }
      );
    }

    const {
      display_name: displayName,
      boundingbox,
      lat,
      lon,
      osm_id: osmId,
      osm_type: osmType,
      place_id: placeId,
      type: placeType,
      class: placeClass,
      address,
    } = results[0];

    if (!boundingbox || !lat || !lon) {
      return NextResponse.json(
        { error: "Les informations de la commune sont incomplètes." },
        { status: 502 }
      );
    }

    const resolvedOsmId =
      typeof osmId !== "undefined"
        ? String(osmId)
        : typeof placeId !== "undefined"
        ? String(placeId)
        : null;

    if (!resolvedOsmId) {
      return NextResponse.json(
        { error: "Les informations de la commune sont incomplètes." },
        { status: 502 }
      );
    }

    const resolvedOsmType = osmType ?? placeType ?? placeClass;

    if (!resolvedOsmType) {
      return NextResponse.json(
        { error: "Les informations de la commune sont incomplètes." },
        { status: 502 }
      );
    }

    const baseCity =
      address?.city ||
      address?.town ||
      address?.village ||
      address?.municipality;

    const arrondissementName =
      address?.city_district ||
      address?.borough ||
      address?.state_district ||
      address?.suburb;

    let name = baseCity || address?.county || displayName;

    if (baseCity && ARRONDISSEMENT_CITIES.has(baseCity) && arrondissementName) {
      const normalized = normalizeArrondissementName(
        baseCity,
        arrondissementName
      );
      if (normalized !== baseCity) {
        name = normalized;
      }
    }

    if (!name && displayName) {
      name = displayName;
    }

    if (!name) {
      return NextResponse.json(
        { error: "Impossible de déterminer le nom de la commune." },
        { status: 502 }
      );
    }

    const bboxNumbers = boundingbox.map((value) => Number.parseFloat(value));

    if (bboxNumbers.some((value) => Number.isNaN(value))) {
      return NextResponse.json(
        { error: "La zone géographique de la commune est invalide." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      name,
      postalCode: validation.data.postalCode,
      osmId: resolvedOsmId,
      osmType: resolvedOsmType,
      bbox: bboxNumbers,
      latitude: Number.parseFloat(lat),
      longitude: Number.parseFloat(lon),
    });
  } catch (error) {
    console.error("OSM lookup failed", error);
    return NextResponse.json(
      { error: "La vérification auprès d'OSM a échoué. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
