import { describe, expect, test } from "vitest";

import { buildTownDashboardData, type MapPoint } from "@/lib/contributionStats";

const referenceDate = new Date("2024-04-15T00:00:00.000Z");

function createContribution(partial: MapPoint & { type: "ALERT" | "SUGGESTION" }) {
  return {
    id: partial.id,
    type: partial.type,
    status: "PENDING" as const,
    createdAt: partial.createdAt ? new Date(partial.createdAt) : new Date(referenceDate),
    latitude: partial.latitude ?? 48.8,
    longitude: partial.longitude ?? 2.35,
    locationLabel: partial.locationLabel ?? null,
  };
}

describe("buildTownDashboardData", () => {
  test("Scenario: aggregates totals, percentages, timeline and map points", () => {
    console.info("Scenario: Town dashboard aggregates contribution KPIs");

    const contributions = [
      createContribution({
        id: "alert-1",
        type: "ALERT",
        createdAt: "2024-04-10T10:00:00.000Z",
        latitude: 48.85,
        longitude: 2.35,
      }),
      createContribution({
        id: "alert-2",
        type: "ALERT",
        createdAt: "2024-02-01T08:00:00.000Z",
        latitude: 48.86,
        longitude: 2.33,
      }),
      createContribution({
        id: "suggestion-1",
        type: "SUGGESTION",
        createdAt: "2023-11-15T09:30:00.000Z",
        latitude: null,
        longitude: null,
      }),
    ];

    const dashboard = buildTownDashboardData(contributions, {
      bbox: [48.0, 49.0, 2.0, 3.0],
      latitude: 48.8566,
      longitude: 2.3522,
    }, referenceDate);

    expect(dashboard.totals).toEqual({
      overall: 3,
      last30Days: 1,
      alerts: { count: 2, percentage: 66.7 },
      suggestions: { count: 1, percentage: 33.3 },
    });

    expect(dashboard.timeline.weekly).toHaveLength(3);
    expect(dashboard.timeline.monthly.at(-1)?.label).toMatch(/avril 2024/i);
    expect(dashboard.timeline.yearly.map((point) => point.label)).toEqual(["2023", "2024"]);

    expect(dashboard.map.points).toHaveLength(2);
    expect(dashboard.map.bounds[0][0]).toBeLessThanOrEqual(48.85);
    expect(dashboard.map.bounds[1][1]).toBeGreaterThanOrEqual(2.35);
  });

  test("Scenario: falls back to commune geometry when no map points", () => {
    console.info("Scenario: Town dashboard bounds use commune bbox fallback");

    const dashboard = buildTownDashboardData(
      [
        createContribution({
        id: "no-geo",
          type: "ALERT",
          createdAt: "2024-04-01T00:00:00.000Z",
          latitude: null,
          longitude: null,
        }),
      ],
      {
        bbox: [47.9, 48.2, 1.9, 2.1],
        latitude: 48.0,
        longitude: 2.0,
      },
      referenceDate,
    );

    expect(dashboard.map.points).toHaveLength(0);
    expect(dashboard.map.bounds).toEqual([
      [47.9, 1.9],
      [48.2, 2.1],
    ]);
  });

  test("Scenario: uses centroid fallback when bbox missing", () => {
    console.info("Scenario: Town dashboard bounds use centroid fallback");

    const dashboard = buildTownDashboardData([], {
      bbox: null,
      latitude: 46.5,
      longitude: 1.5,
    });

    expect(dashboard.map.points).toEqual([]);
    expect(dashboard.map.bounds).toEqual([
      [46.45, 1.45],
      [46.55, 1.55],
    ]);
  });
});

