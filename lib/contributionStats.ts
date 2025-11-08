import type { ContributionStatus, ContributionType } from "@prisma/client";

type ContributionInput = {
  id: string;
  type: ContributionType;
  status: ContributionStatus;
  createdAt: Date;
  latitude: number | null;
  longitude: number | null;
  locationLabel?: string | null;
};

type CommuneGeo = {
  bbox: number[] | null;
  latitude: number;
  longitude: number;
};

export type TrendPoint = {
  label: string;
  date: string;
  alerts: number;
  suggestions: number;
};

export type MapPoint = {
  id: string;
  type: ContributionType;
  latitude: number;
  longitude: number;
  createdAt: string;
  locationLabel?: string | null;
};

export type Bounds = [[number, number], [number, number]];

export type TownDashboardData = {
  totals: {
    overall: number;
    last30Days: number;
    alerts: {
      count: number;
      percentage: number;
    };
    suggestions: {
      count: number;
      percentage: number;
    };
  };
  timeline: {
    weekly: TrendPoint[];
    monthly: TrendPoint[];
    yearly: TrendPoint[];
  };
  map: {
    bounds: Bounds;
    points: MapPoint[];
  };
};

function startOfWeek(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  if (day !== 1) {
    d.setUTCDate(d.getUTCDate() - (day - 1));
  }
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function startOfYear(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(date: Date) {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `Semaine du ${formatter.format(date)}`;
}

function formatMonthLabel(date: Date) {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return formatter.format(date);
}

function formatYearLabel(date: Date) {
  return date.getUTCFullYear().toString();
}

type TrendAccumulator = Map<
  string,
  {
    date: Date;
    alerts: number;
    suggestions: number;
    label: string;
  }
>;

function trackTrend(
  accumulator: TrendAccumulator,
  key: string,
  date: Date,
  type: ContributionType,
  label: string,
) {
  if (!accumulator.has(key)) {
    accumulator.set(key, {
      date,
      alerts: 0,
      suggestions: 0,
      label,
    });
  }
  const entry = accumulator.get(key)!;
  if (type === "ALERT") {
    entry.alerts += 1;
  } else {
    entry.suggestions += 1;
  }
}

function buildTrendPoints(accumulator: TrendAccumulator): TrendPoint[] {
  return Array.from(accumulator.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((entry) => ({
      label: entry.label,
      date: entry.date.toISOString(),
      alerts: entry.alerts,
      suggestions: entry.suggestions,
    }));
}

function computeBounds(
  points: MapPoint[],
  commune: CommuneGeo,
): Bounds {
  if (points.length > 0) {
    const latitudes = points.map((point) => point.latitude);
    const longitudes = points.map((point) => point.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const latPadding = Math.max((maxLat - minLat) * 0.1, 0.01);
    const lngPadding = Math.max((maxLng - minLng) * 0.1, 0.01);
    return [
      [minLat - latPadding, minLng - lngPadding],
      [maxLat + latPadding, maxLng + lngPadding],
    ];
  }

  if (commune.bbox && commune.bbox.length === 4) {
    const [south, north, west, east] = commune.bbox;
    return [
      [south, west],
      [north, east],
    ];
  }

  const fallbackLat = commune.latitude;
  const fallbackLng = commune.longitude;
  return [
    [fallbackLat - 0.05, fallbackLng - 0.05],
    [fallbackLat + 0.05, fallbackLng + 0.05],
  ];
}

export function buildTownDashboardData(
  contributions: ContributionInput[],
  commune: CommuneGeo,
  referenceDate: Date = new Date(),
): TownDashboardData {
  const total = contributions.length;
  const alertsCount = contributions.filter((contribution) => contribution.type === "ALERT").length;
  const suggestionsCount = total - alertsCount;

  const thirtyDaysAgo = new Date(referenceDate);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

  const last30DaysCount = contributions.filter(
    (contribution) => contribution.createdAt >= thirtyDaysAgo,
  ).length;

  const alertsPercentage = total === 0 ? 0 : (alertsCount / total) * 100;
  const suggestionsPercentage = total === 0 ? 0 : (suggestionsCount / total) * 100;

  const weeklyAccumulator: TrendAccumulator = new Map();
  const monthlyAccumulator: TrendAccumulator = new Map();
  const yearlyAccumulator: TrendAccumulator = new Map();

  const mapPoints: MapPoint[] = [];

  for (const contribution of contributions) {
    const createdAt = contribution.createdAt;

    const weekStart = startOfWeek(createdAt);
    const weekKey = `week-${weekStart.toISOString()}`;
    trackTrend(weeklyAccumulator, weekKey, weekStart, contribution.type, formatWeekLabel(weekStart));

    const monthStart = startOfMonth(createdAt);
    const monthKey = `month-${monthStart.toISOString()}`;
    trackTrend(
      monthlyAccumulator,
      monthKey,
      monthStart,
      contribution.type,
      formatMonthLabel(monthStart),
    );

    const yearStart = startOfYear(createdAt);
    const yearKey = `year-${yearStart.toISOString()}`;
    trackTrend(
      yearlyAccumulator,
      yearKey,
      yearStart,
      contribution.type,
      formatYearLabel(yearStart),
    );

    if (typeof contribution.latitude === "number" && typeof contribution.longitude === "number") {
      mapPoints.push({
        id: contribution.id,
        type: contribution.type,
        latitude: contribution.latitude,
        longitude: contribution.longitude,
        createdAt: contribution.createdAt.toISOString(),
        locationLabel: contribution.locationLabel ?? null,
      });
    }
  }

  return {
    totals: {
      overall: total,
      last30Days: last30DaysCount,
      alerts: {
        count: alertsCount,
        percentage: Number(alertsPercentage.toFixed(1)),
      },
      suggestions: {
        count: suggestionsCount,
        percentage: Number(suggestionsPercentage.toFixed(1)),
      },
    },
    timeline: {
      weekly: buildTrendPoints(weeklyAccumulator),
      monthly: buildTrendPoints(monthlyAccumulator),
      yearly: buildTrendPoints(yearlyAccumulator),
    },
    map: {
      bounds: computeBounds(mapPoints, commune),
      points: mapPoints,
    },
  };
}

