import { render, screen } from "@testing-library/react";
import { describe, expect, test, beforeEach, vi } from "vitest";
import AnnuairePage from "@/app/annuaire/page";

const mockPrisma = vi.hoisted(() => ({
  commune: {
    findMany: vi.fn(),
  },
}));

const mockEnsureCommuneSlug = vi.hoisted(() => vi.fn());
const capturedDirectoryProps: unknown[] = [];

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/communes", () => ({
  ensureCommuneSlug: mockEnsureCommuneSlug,
}));

vi.mock("@/components/CityDirectory", () => ({
  CityDirectory: (props: unknown) => {
    capturedDirectoryProps.push(props);
    return <div data-testid="city-directory" />;
  },
}));

describe("AnnuairePage", () => {
  beforeEach(() => {
    capturedDirectoryProps.length = 0;
    mockPrisma.commune.findMany.mockReset();
    mockEnsureCommuneSlug.mockReset();
  });

  test("Scenario: loads visible communes and delegates to CityDirectory", async () => {
    console.info("Scenario: Annuaire page filters visible communes and decorates slugs");

    mockPrisma.commune.findMany.mockResolvedValue([
      { id: "1", name: "Paris", postalCode: "75000", websiteUrl: "https://paris.fr", slug: null },
    ]);

    mockEnsureCommuneSlug.mockResolvedValue("paris");

    const element = await AnnuairePage();
    render(element);

    expect(mockPrisma.commune.findMany).toHaveBeenCalledWith({
      where: { NOT: { isVisible: false } },
      select: {
        id: true,
        name: true,
        postalCode: true,
        websiteUrl: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    });

    expect(capturedDirectoryProps).toHaveLength(1);
    const directoryProps = capturedDirectoryProps[0] as { communes: Array<{ name: string; slug: string }> };

    expect(mockEnsureCommuneSlug).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1", name: "Paris" }),
    );
    expect(directoryProps.communes).toEqual([
      expect.objectContaining({
        id: "1",
        name: "Paris",
        postalCode: "75000",
        slug: "paris",
      }),
    ]);
    expect(screen.getByRole("heading", { level: 1, name: /Annuaire des villes/i })).toBeInTheDocument();
  });
});

