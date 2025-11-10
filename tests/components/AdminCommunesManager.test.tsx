import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AdminCommunesManager } from "@/components/AdminCommunesManager";

const originalFetch = globalThis.fetch;
const mockRouter = {
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

const sampleCommune = {
  id: "commune-1",
  name: "Testville",
  slug: "testville",
  postalCode: "75000",
  osmId: "osm-123",
  osmType: "relation",
  bbox: [0, 1, 0, 1],
  latitude: 48.8566,
  longitude: 2.3522,
  country: "FR",
  websiteUrl: null,
  isVisible: true,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-02T00:00:00Z"),
  users: [
    {
      id: "user-1",
      email: "manager@example.org",
      firstName: "Marie",
      lastName: "Curie",
      phone: "0102030405",
    },
  ],
  createdBy: null,
  updatedBy: null,
  auditLogs: [],
};

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  mockRouter.refresh.mockReset();
});

describe("AdminCommunesManager", () => {
  test("Scenario: toggling visibility calls API and refreshes on success", async () => {
    console.info("Scenario: Admin can toggle commune visibility");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminCommunesManager communes={[sampleCommune]} />);

    await userEvent.click(screen.getByRole("button", { name: /Désactiver/i }));
    await userEvent.click(screen.getByRole("button", { name: /Confirmer/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/communes/commune-1", expect.any(Object)),
    );

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      isVisible: false,
    });
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  test("Scenario: toggling visibility shows error on failure", async () => {
    console.info("Scenario: Visibility toggle surfaces API error to the admin");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Service indisponible" }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminCommunesManager communes={[sampleCommune]} />);

    await userEvent.click(screen.getByRole("button", { name: /Désactiver/i }));
    await userEvent.click(screen.getByRole("button", { name: /Confirmer/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(
      await screen.findByText(/Service indisponible/i),
    ).toBeInTheDocument();
  });

  test("Scenario: deleting a commune calls API and refreshes", async () => {
    console.info("Scenario: Admin can delete a commune from the manager");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminCommunesManager communes={[sampleCommune]} />);

    const [openDeleteButton] = await screen.findAllByRole("button", { name: /Supprimer/i });
    await userEvent.click(openDeleteButton);
    const deleteModal = await screen.findByRole("dialog", {
      name: /Supprimer la commune/i,
    });
    await userEvent.click(
      within(deleteModal).getByRole("button", { name: /^Supprimer$/i }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/communes/commune-1", {
        method: "DELETE",
      }),
    );
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  test("Scenario: deletion failure displays an error alert", async () => {
    console.info("Scenario: Deletion failure informs the admin user");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Opération impossible" }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminCommunesManager communes={[sampleCommune]} />);

    const [openDeleteButton] = await screen.findAllByRole("button", { name: /Supprimer/i });
    await userEvent.click(openDeleteButton);
    const deleteModal = await screen.findByRole("dialog", {
      name: /Supprimer la commune/i,
    });
    await userEvent.click(
      within(deleteModal).getByRole("button", { name: /^Supprimer$/i }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(
      await screen.findByText(/Opération impossible/i),
    ).toBeInTheDocument();
  });
});

