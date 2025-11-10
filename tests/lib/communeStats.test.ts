import { beforeEach, describe, expect, test, vi } from "vitest";

import { buildCommuneStats } from "@/lib/communeStats";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

describe("buildCommuneStats", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  test("Scenario: returns empty structure when no communes", async () => {
    console.info("Scenario: Commune stats handle empty dataset");

    const stats = await buildCommuneStats([]);
    expect(stats).toEqual({
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
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("Scenario: aggregates totals with unique postal codes", async () => {
    console.info("Scenario: Commune stats aggregate geo API data");

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ population: 12000, surface: 15340 }],
    });

    const baseDate = new Date("2024-03-10T00:00:00.000Z");
    const stats = await buildCommuneStats([
      {
        id: "commune-1",
        name: "Testville",
        postalCode: "75000",
        bbox: [47.9, 48.2, 1.9, 2.1],
        createdAt: baseDate,
      },
      {
        id: "commune-2",
        name: "Testopolis",
        postalCode: "75000",
        bbox: [48.1, 48.3, 2.0, 2.2],
        createdAt: new Date("2024-04-01T00:00:00.000Z"),
      },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(stats.totals).toEqual({
      communes: 2,
      population: 12000,
      surfaceKm2: 153.4,
    });

    expect(stats.communes.map((commune) => commune.id)).toEqual(["commune-1", "commune-2"]);
    expect(stats.timeline.weekly.at(0)).toMatchObject({
      label: expect.stringMatching(/Semaine/),
      value: 1,
    });
    expect(stats.timeline.weekly.at(-1)?.value).toBe(2);
    expect(stats.timeline.monthly).toHaveLength(2);
  });

  test("Scenario: ignores invalid bbox and missing geo data", async () => {
    console.info("Scenario: Commune stats skip invalid communess and missing API data");

    fetchMock.mockResolvedValueOnce({
      ok: false,
    });

    const stats = await buildCommuneStats([
      {
        id: "invalid-bbox",
        name: "Broken",
        postalCode: "00000",
        bbox: [1, 2, 3],
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        id: "valid",
        name: "Valid Town",
        postalCode: "10000",
        bbox: [44.0, 44.5, 1.0, 1.5],
        createdAt: new Date("2024-02-01T00:00:00.000Z"),
      },
    ]);

    expect(stats.totals).toEqual({
      communes: 1,
      population: 0,
      surfaceKm2: 0,
    });
    expect(stats.communes).toHaveLength(1);
    expect(stats.timeline.weekly).toHaveLength(1);
  });
});

