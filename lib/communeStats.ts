type CommuneInput = {
  id: string;
  name: string;
  postalCode: string;
  bbox: number[];
  createdAt: Date;
};

type TimelinePoint = {
  label: string;
  date: string;
  value: number;
};

type CommuneStats = {
  totals: {
    communes: number;
    population: number;
    surfaceKm2: number;
  };
  communes: Array<{
    id: string;
    name: string;
    postalCode: string;
    bbox: [number, number, number, number];
    createdAt: string;
  }>;
  timeline: {
    weekly: TimelinePoint[];
    monthly: TimelinePoint[];
  };
};

type GeoApiResponse = {
  surface?: number | null;
  population?: number | null;
};

const GEO_API_BASE_URL = "https://geo.api.gouv.fr";

const postalCodeCache = new Map<string, GeoApiResponse>();

async function fetchGeoDataForPostalCode(
  postalCode: string,
): Promise<GeoApiResponse> {
  if (postalCodeCache.has(postalCode)) {
    return postalCodeCache.get(postalCode)!;
  }

  try {
    const response = await fetch(
      `${GEO_API_BASE_URL}/communes?codePostal=${encodeURIComponent(
        postalCode,
      )}&fields=surface,population&format=json`,
      {
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: 60 * 60 * 6, // 6 hours
        },
      },
    );

    if (!response.ok) {
      return { population: null, surface: null };
    }

    const data = (await response.json()) as GeoApiResponse[];
    const first = data[0];

    if (!first) {
      postalCodeCache.set(postalCode, { population: null, surface: null });
      return { population: null, surface: null };
    }

    postalCodeCache.set(postalCode, first);
    return first;
  } catch {
    return { population: null, surface: null };
  }
}

function toSafeBBox(values: number[]): [number, number, number, number] | null {
  if (values.length !== 4) {
    return null;
  }

  if (values.some((value) => Number.isNaN(value))) {
    return null;
  }

  const [south, north, west, east] = values;
  return [south, north, west, east];
}

function getISOWeekInfo(date: Date) {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff =
    (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000);
  const week = 1 + Math.floor(diff);
  const year = target.getUTCFullYear();

  const startOfWeek = new Date(target);
  startOfWeek.setUTCDate(target.getUTCDate() - 3);
  const adjustment = (startOfWeek.getUTCDay() + 6) % 7;
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - adjustment);

  return { year, week, startOfWeek };
}

function formatWeekLabel(week: number, year: number) {
  return `Semaine ${week.toString().padStart(2, "0")} ${year}`;
}

function getMonthKey(date: Date) {
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
}

function buildTimeline(
  communes: CommuneInput[],
  granularity: "weekly" | "monthly",
): TimelinePoint[] {
  if (communes.length === 0) {
    return [];
  }

  const groups = new Map<
    string,
    { count: number; date: Date; label: string }
  >();

  for (const commune of communes) {
    const createdAt = commune.createdAt;

    if (granularity === "weekly") {
      const { week, year, startOfWeek } = getISOWeekInfo(createdAt);
      const key = `${year}-W${week.toString().padStart(2, "0")}`;

      if (!groups.has(key)) {
        groups.set(key, {
          count: 0,
          date: startOfWeek,
          label: formatWeekLabel(week, year),
        });
      }

      groups.get(key)!.count += 1;
    } else {
      const key = getMonthKey(createdAt);
      if (!groups.has(key)) {
        const startOfMonth = new Date(
          Date.UTC(createdAt.getUTCFullYear(), createdAt.getUTCMonth(), 1),
        );
        const label = new Intl.DateTimeFormat("fr-FR", {
          month: "long",
          year: "numeric",
        }).format(startOfMonth);

        groups.set(key, {
          count: 0,
          date: startOfMonth,
          label,
        });
      }

      groups.get(key)!.count += 1;
    }
  }

  const sortedGroups = Array.from(groups.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const points: TimelinePoint[] = [];
  let cumulative = 0;

  for (const group of sortedGroups) {
    cumulative += group.count;
    points.push({
      label: group.label,
      date: group.date.toISOString(),
      value: cumulative,
    });
  }

  return points;
}

function sumUniquePostalCodeData(
  postalCodes: string[],
  extractor: (data: GeoApiResponse) => number | null | undefined,
  reducer: (acc: number, value: number) => number,
  initialValue: number,
) {
  return postalCodes.reduce((total, code) => {
    const geoData = postalCodeCache.get(code);
    if (!geoData) {
      return total;
    }

    const value = extractor(geoData);
    if (value === null || value === undefined) {
      return total;
    }

    return reducer(total, value);
  }, initialValue);
}

export async function buildCommuneStats(
  communes: CommuneInput[],
): Promise<CommuneStats> {
  if (communes.length === 0) {
    return {
      totals: {
        communes: 0,
        population: 0,
        surfaceKm2: 0,
      },
      communes: [],
      timeline: {
        weekly: [],
        monthly: [],
      },
    };
  }

  postalCodeCache.clear();

  const uniquePostalCodes = Array.from(
    new Set(communes.map((commune) => commune.postalCode).filter(Boolean)),
  );

  await Promise.all(
    uniquePostalCodes.map(async (postalCode) => {
      if (!postalCode) {
        return;
      }

      const geoData = await fetchGeoDataForPostalCode(postalCode);
      postalCodeCache.set(postalCode, geoData);
    }),
  );

  const populationTotal = sumUniquePostalCodeData(
    uniquePostalCodes,
    (data) => data.population ?? null,
    (acc, value) => acc + value,
    0,
  );

  const surfaceTotalKm2 = sumUniquePostalCodeData(
    uniquePostalCodes,
    (data) => data.surface ?? null,
    (acc, value) => acc + value / 100,
    0,
  );

  const validCommunesWithDate = communes
    .map((commune) => {
      const safeBbox = toSafeBBox(commune.bbox);
      if (!safeBbox) {
        return null;
      }

      return {
        id: commune.id,
        name: commune.name,
        postalCode: commune.postalCode,
        bbox: safeBbox,
        createdAt: commune.createdAt,
      };
    })
    .filter(
      (
        commune,
      ): commune is {
        id: string;
        name: string;
        postalCode: string;
        bbox: [number, number, number, number];
        createdAt: Date;
      } => commune !== null,
    );

  const validCommunes = validCommunesWithDate.map((commune) => ({
    ...commune,
    createdAt: commune.createdAt.toISOString(),
  }));

  return {
    totals: {
      communes: validCommunes.length,
      population: populationTotal,
      surfaceKm2: Number(surfaceTotalKm2.toFixed(2)),
    },
    communes: validCommunes,
    timeline: {
      weekly: buildTimeline(validCommunesWithDate, "weekly"),
      monthly: buildTimeline(validCommunesWithDate, "monthly"),
    },
  };
}

export type { CommuneStats, CommuneInput, TimelinePoint };

