const GEO_API_BASE_URL = "https://geo.api.gouv.fr";

type RegionData = {
  code: string;
  nom: string;
};

type CommuneGeoData = {
  codeRegion?: string;
  nomRegion?: string;
  codeDepartement?: string;
  nomDepartement?: string;
};

const regionCache = new Map<string, CommuneGeoData>();

/**
 * Récupère les données géographiques (région, département) d'une commune via son code postal
 */
export async function getRegionFromPostalCode(
  postalCode: string,
): Promise<CommuneGeoData | null> {
  if (regionCache.has(postalCode)) {
    return regionCache.get(postalCode)!;
  }

  try {
    const response = await fetch(
      `${GEO_API_BASE_URL}/communes?codePostal=${encodeURIComponent(
        postalCode,
      )}&fields=codeRegion,nomRegion,codeDepartement,nomDepartement&format=json`,
      {
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: 60 * 60 * 24, // 24 hours
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as CommuneGeoData[];
    const first = data[0];

    if (!first) {
      regionCache.set(postalCode, {});
      return null;
    }

    const result: CommuneGeoData = {
      codeRegion: first.codeRegion,
      nomRegion: first.nomRegion,
      codeDepartement: first.codeDepartement,
      nomDepartement: first.nomDepartement,
    };

    regionCache.set(postalCode, result);
    return result;
  } catch {
    return null;
  }
}

/**
 * Liste des régions françaises avec leurs codes
 */
export const FRENCH_REGIONS: Record<string, string> = {
  "11": "Île-de-France",
  "24": "Centre-Val de Loire",
  "27": "Bourgogne-Franche-Comté",
  "28": "Normandie",
  "32": "Hauts-de-France",
  "44": "Grand Est",
  "52": "Pays de la Loire",
  "53": "Bretagne",
  "75": "Nouvelle-Aquitaine",
  "76": "Occitanie",
  "84": "Auvergne-Rhône-Alpes",
  "93": "Provence-Alpes-Côte d'Azur",
  "94": "Corse",
  "01": "Guadeloupe",
  "02": "Martinique",
  "03": "Guyane",
  "04": "La Réunion",
  "06": "Mayotte",
};

/**
 * Récupère le nom de la région depuis son code
 */
export function getRegionName(code: string | null | undefined): string {
  if (!code) {
    return "Non définie";
  }
  return FRENCH_REGIONS[code] ?? `Région ${code}`;
}

