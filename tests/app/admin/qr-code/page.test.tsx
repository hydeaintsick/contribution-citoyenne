import { render, screen } from "@testing-library/react";
import { describe, expect, test, beforeEach, vi } from "vitest";
import TownQrCodePage from "@/app/admin/qr-code/page";

const mockHeaders = vi.hoisted(() => ({
  get: vi.fn(),
}));

const mockRedirect = vi.hoisted(() => vi.fn());
const mockRouter = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

const mockParseSession = vi.hoisted(() => vi.fn());
const mockGetSessionCookieName = vi.hoisted(() => vi.fn());
const mockPrisma = vi.hoisted(() => ({
  commune: {
    findUnique: vi.fn(),
  },
}));
const mockEnsureCommuneSlug = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: mockHeaders.get,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    mockRedirect(path);
    throw new Error(`redirect:${path}`);
  },
  useRouter: () => mockRouter,
}));

vi.mock("@/lib/auth", () => ({
  parseSessionCookie: mockParseSession,
  getSessionCookieName: mockGetSessionCookieName,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/communes", () => ({
  ensureCommuneSlug: mockEnsureCommuneSlug,
}));

vi.mock("@/components/TownQrCodeCard", () => ({
  TownQrCodeCard: ({ communeName, contributionUrl }: { communeName: string; contributionUrl: string }) => (
    <div data-testid="town-card">
      {communeName}::{contributionUrl}
    </div>
  ),
}));

vi.mock("@/components/QrEmbedTutorial", () => ({
  QrEmbedTutorial: ({ embedBaseUrl }: { embedBaseUrl: string }) => (
    <div data-testid="embed-tutorial">{embedBaseUrl}</div>
  ),
}));

vi.mock("@/components/ContributionDirectLink", () => ({
  ContributionDirectLink: ({ contributionUrl }: { contributionUrl: string }) => (
    <div data-testid="direct-link">{contributionUrl}</div>
  ),
}));

describe("TownQrCodePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockHeaders.get.mockReset();
    mockRedirect.mockReset();
    mockRouter.refresh.mockReset();
    mockParseSession.mockReset();
    mockGetSessionCookieName.mockReturnValue("session");
    mockPrisma.commune.findUnique.mockReset();
    mockEnsureCommuneSlug.mockReset();
  });

  test("Scenario: redirects to /admin when session is missing", async () => {
    console.info("Scenario: QR code page redirects when session is absent");

    mockHeaders.get.mockReturnValueOnce(null);
    mockParseSession.mockResolvedValue(null);

    await expect(TownQrCodePage()).rejects.toThrow("redirect:/admin");
    expect(mockRedirect).toHaveBeenCalledWith("/admin");
  });

  test("Scenario: redirects when user role is not a town manager", async () => {
    console.info("Scenario: QR code page refuses non-town roles");

    mockHeaders.get.mockImplementation((name: string) => {
      if (name === "cookie") {
        return "session=token";
      }
      return null;
    });
    mockParseSession.mockResolvedValue({
      user: { role: "ADMIN" },
    });

    await expect(TownQrCodePage()).rejects.toThrow("redirect:/admin");
    expect(mockRedirect).toHaveBeenCalledWith("/admin");
  });

  test("Scenario: renders QR code card with computed URLs for town manager", async () => {
    console.info("Scenario: QR code page builds contribution and embed URLs");

    mockHeaders.get.mockImplementation((name: string) => {
      if (name === "cookie") {
        return "session=token";
      }
      if (name === "x-forwarded-proto") {
        return "https";
      }
      if (name === "host") {
        return "app.contribcit.fr";
      }
      return null;
    });

    mockParseSession.mockResolvedValue({
      user: {
        role: "TOWN_MANAGER",
        communeId: "commune-1",
      },
    });

    mockPrisma.commune.findUnique.mockResolvedValue({
      id: "commune-1",
      name: "Testville",
      slug: "testville",
      postalCode: "75000",
    });

    mockEnsureCommuneSlug.mockResolvedValue("testville");

    const element = await TownQrCodePage();
    render(element);

    expect(screen.getByTestId("town-card")).toHaveTextContent(
      "Testville::https://app.contribcit.fr/contrib/testville",
    );
    expect(screen.getByTestId("embed-tutorial")).toHaveTextContent(
      "https://app.contribcit.fr/embed/qr/testville",
    );
    expect(screen.getByTestId("direct-link")).toHaveTextContent(
      "https://app.contribcit.fr/contrib/testville",
    );
  });
});

