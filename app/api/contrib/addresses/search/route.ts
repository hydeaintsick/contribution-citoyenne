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

type AddressSuggestion = {
  id: string;
  label: string;
  name: string;
  context: string | null;
  latitude: number;
  longitude: number;
  postcode: string | null;
  city: string | null;
};

type InternalSuggestion = AddressSuggestion & {
  origin: "primary" | "fallback";
};

const BAN_BASE_URL = "https://api-adresse.data.gouv.fr/search/";
const DEFAULT_USER_AGENT = "Contribcit/1.0 (+https://contribcit.org)";
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

function stripDiacritics(value: string | null | undefined) {
  return value
    ? value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
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

function isWithinBbox(
  latitude: number,
  longitude: number,
  bbox: number[],
  tolerance = COORDINATE_TOLERANCE
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
      { status: 400 }
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
        { status: 404 }
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

    const maxResults = Math.min(limit ?? 7, 10);

    const buildBanUrl = (
      query: string,
      options?: { includeTypeFilters?: boolean }
    ) => {
      const urlInstance = new URL(BAN_BASE_URL);
      urlInstance.searchParams.set("q", query);
      urlInstance.searchParams.set("limit", String(maxResults));
      urlInstance.searchParams.set("autocomplete", "1");
      if (options?.includeTypeFilters !== false) {
        urlInstance.searchParams.append("type", "housenumber");
        urlInstance.searchParams.append("type", "street");
        urlInstance.searchParams.append("type", "locality");
      }
      urlInstance.searchParams.set("lat", commune.latitude.toString());
      urlInstance.searchParams.set("lon", commune.longitude.toString());
      return urlInstance;
    };

    const fetchOptions: RequestInit & { next: { revalidate: number } } = {
      headers: {
        "User-Agent": process.env.BAN_USER_AGENT ?? DEFAULT_USER_AGENT,
        "Accept-Language": "fr",
      },
      next: {
        revalidate: 0,
      },
    };

    const mapFeaturesToSuggestions = (
      features: BanFeature[] | undefined,
      origin: InternalSuggestion["origin"]
    ) => {
      if (!features || features.length === 0) {
        return [] as InternalSuggestion[];
      }
      const mapped: InternalSuggestion[] = [];
      for (const feature of features) {
        const [lon, lat] = feature.geometry?.coordinates ?? [
          undefined,
          undefined,
        ];
        const label = feature.properties?.label?.trim();
        if (typeof lat !== "number" || typeof lon !== "number" || !label) {
          continue;
        }
        const matchesCommune =
          isWithinBbox(lat, lon, commune.bbox) ||
          doesFeatureMatchCommune(
            feature.properties,
            normalizedCommuneName,
            communePostalCodes
          );
        if (!matchesCommune) {
          continue;
        }
        mapped.push({
          id: feature.properties?.id
            ? String(feature.properties.id)
            : `${lat},${lon}`,
          label,
          name: feature.properties?.name ?? label,
          context: feature.properties?.context ?? null,
          latitude: lat,
          longitude: lon,
          postcode: feature.properties?.postcode ?? null,
          city: feature.properties?.city ?? null,
          origin,
        });
      }
      return mapped;
    };

    const response = await fetch(buildBanUrl(enrichedQuery), fetchOptions);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Le service d’autocomplétion est indisponible." },
        { status: 502 }
      );
    }

    const payload = (await response.json().catch(() => null)) as {
      features?: BanFeature[];
    } | null;

    const primarySuggestions = mapFeaturesToSuggestions(
      payload?.features ?? [],
      "primary"
    );

    const normalizedQueryTokens = normalizeString(q)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 || /\d/.test(token));

    const hasMeaningfulMatch =
      normalizedQueryTokens.length === 0
        ? primarySuggestions.length > 0
        : primarySuggestions.some((suggestion) => {
            const normalizedLabel = normalizeString(suggestion.label);
            return normalizedQueryTokens.every((token) =>
              normalizedLabel.includes(token)
            );
          });

    const shouldRunFallback = !hasMeaningfulMatch;

    const mergeSuggestions = (
      base: InternalSuggestion[],
      additional: InternalSuggestion[]
    ) => {
      if (additional.length === 0) {
        return base;
      }
      const seen = new Set(base.map((item) => item.id || item.label));
      const merged = [...base];
      for (const suggestion of additional) {
        const key = suggestion.id || suggestion.label;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        merged.push(suggestion);
      }
      return merged;
    };

    let suggestions = primarySuggestions;

    if (shouldRunFallback) {
      const fallbackQueries = new Set<string>();
      const strippedOriginal = stripDiacritics(q);
      const strippedCommuneName = stripDiacritics(commune.name);
      if (strippedOriginal) {
        fallbackQueries.add(strippedOriginal);
      }
      if (strippedOriginal && strippedCommuneName) {
        fallbackQueries.add(`${strippedOriginal} ${strippedCommuneName}`);
      }
      if (communePostalCodes.length > 0 && strippedOriginal) {
        fallbackQueries.add(`${strippedOriginal} ${communePostalCodes[0]}`);
      }

      for (const fallbackQuery of fallbackQueries) {
        if (!fallbackQuery) {
          continue;
        }
        try {
          const fallbackResponse = await fetch(
            buildBanUrl(fallbackQuery, { includeTypeFilters: false }),
            fetchOptions
          );
          if (!fallbackResponse.ok) {
            continue;
          }
          const fallbackPayload = (await fallbackResponse
            .json()
            .catch(() => null)) as { features?: BanFeature[] } | null;
          const fallbackSuggestions = mapFeaturesToSuggestions(
            fallbackPayload?.features ?? [],
            "fallback"
          );
          suggestions = mergeSuggestions(suggestions, fallbackSuggestions);
          if (
            normalizedQueryTokens.length > 0 &&
            suggestions.some((suggestion) => {
              const normalizedLabel = normalizeString(suggestion.label);
              return normalizedQueryTokens.every((token) =>
                normalizedLabel.includes(token)
              );
            })
          ) {
            break;
          }
        } catch (fallbackError) {
          console.warn("BAN fallback search failed", fallbackError);
        }
      }
    }

    if (normalizedQueryTokens.length > 0 && suggestions.length > 0) {
      const suggestionsWithScore = suggestions.map((suggestion) => {
        const normalizedLabel = normalizeString(suggestion.label);
        const normalizedName = normalizeString(suggestion.name);
        const tokenMatches = normalizedQueryTokens.reduce((acc, token) => {
          if (
            normalizedLabel.includes(token) ||
            (normalizedName && normalizedName.includes(token))
          ) {
            return acc + 1;
          }
          return acc;
        }, 0);

        const startsWithQuery = normalizedLabel.startsWith(
          normalizeString(q).trim()
        )
          ? 1
          : 0;

        const numericTokens = normalizedQueryTokens.filter((token) =>
          /\d/.test(token)
        );
        const numericMatch =
          numericTokens.length === 0
            ? 1
            : numericTokens.every(
                (token) =>
                  normalizedLabel.includes(token) ||
                  normalizedName.includes(token)
              )
            ? 1
            : 0;

        const score =
          tokenMatches * 10 + startsWithQuery * 5 + numericMatch * 3;

        return {
          suggestion,
          tokenMatches,
          score,
        };
      });

      const filtered =
        suggestionsWithScore.filter((item) => item.tokenMatches > 0) ??
        suggestionsWithScore;

      const baseToSort = filtered.length > 0 ? filtered : suggestionsWithScore;

      baseToSort.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (a.suggestion.origin !== b.suggestion.origin) {
          return a.suggestion.origin === "primary" ? -1 : 1;
        }
        return a.suggestion.label.localeCompare(b.suggestion.label, "fr");
      });

      suggestions = baseToSort.map((item) => item.suggestion);
    }

    const publicSuggestions: AddressSuggestion[] = suggestions.map(
      ({ origin: _origin, ...rest }) => rest
    );

    return NextResponse.json({ suggestions: publicSuggestions });
  } catch (error) {
    console.error("BAN search failed", error);
    return NextResponse.json(
      { error: "La recherche d’adresse a échoué. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
