import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const reverseSchema = z.object({
  communeId: z.string().trim().min(1, "Commune manquante."),
  latitude: z.number().finite(),
  longitude: z.number().finite(),
});

type BanReverseFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    label?: string;
    name?: string;
    postcode?: string;
    city?: string;
    context?: string;
  };
};

const BAN_REVERSE_URL = "https://api-adresse.data.gouv.fr/reverse/";
const DEFAULT_USER_AGENT = "Contribcit/1.0 (+https://contribcit.org)";

function isWithinBbox(
  latitude: number,
  longitude: number,
  bbox: number[],
  tolerance = 0
) {
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

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload JSON invalide." },
      { status: 400 }
    );
  }

  const validation = reverseSchema.safeParse(payload);
  if (!validation.success) {
    const [issue] = validation.error.issues;
    return NextResponse.json(
      { error: issue?.message ?? "Données de géolocalisation invalides." },
      { status: 400 }
    );
  }

  const { communeId, latitude, longitude } = validation.data;

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
        isVisible: true,
      },
    });

    if (!commune || !commune.isVisible) {
      return NextResponse.json(
        { error: "Commune introuvable ou indisponible." },
        { status: 404 }
      );
    }

    if (!isWithinBbox(latitude, longitude, commune.bbox, 0.001)) {
      return NextResponse.json(
        { error: "Les coordonnées sont en dehors de la commune sélectionnée." },
        { status: 400 }
      );
    }

    const reverseUrl = new URL(BAN_REVERSE_URL);
    reverseUrl.searchParams.set("lat", latitude.toString());
    reverseUrl.searchParams.set("lon", longitude.toString());
    reverseUrl.searchParams.set("limit", "1");
    reverseUrl.searchParams.set("postcode", commune.postalCode);
    reverseUrl.searchParams.set("city", commune.name);

    const response = await fetch(reverseUrl, {
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
        { error: "Le service de géocodage est indisponible." },
        { status: 502 }
      );
    }

    const result = (await response.json().catch(() => null)) as {
      features?: BanReverseFeature[];
    } | null;

    if (
      !result ||
      !Array.isArray(result.features) ||
      result.features.length === 0
    ) {
      return NextResponse.json(
        { error: "Aucune adresse trouvée pour ces coordonnées." },
        { status: 404 }
      );
    }

    const feature = result.features[0];
    const [lon, lat] = feature.geometry?.coordinates ?? [undefined, undefined];

    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json(
        { error: "Les données de géolocalisation sont incomplètes." },
        { status: 502 }
      );
    }

    if (!isWithinBbox(lat, lon, commune.bbox, 0.001)) {
      return NextResponse.json(
        { error: "L’adresse trouvée n’appartient pas à la commune." },
        { status: 400 }
      );
    }

    const label = feature.properties?.label?.trim();
    if (!label) {
      return NextResponse.json(
        { error: "Impossible de déterminer l’adresse correspondante." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      address: {
        label,
        name: feature.properties?.name ?? label,
        context: feature.properties?.context ?? null,
        postcode: feature.properties?.postcode ?? null,
        city: feature.properties?.city ?? null,
        latitude: lat,
        longitude: lon,
      },
    });
  } catch (error) {
    console.error("BAN reverse failed", error);
    return NextResponse.json(
      { error: "La conversion des coordonnées en adresse a échoué." },
      { status: 500 }
    );
  }
}
