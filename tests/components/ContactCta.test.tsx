import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { ContactCta } from "@/components/ContactCta";

const originalFetch = globalThis.fetch;

const { loadMock, getMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
  getMock: vi.fn(),
}));

vi.mock("@fingerprintjs/fingerprintjs", () => ({
  __esModule: true,
  default: {
    load: loadMock,
  },
}));

describe("ContactCta", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    loadMock.mockReset();
    getMock.mockReset();
    globalThis.fetch = vi.fn();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
  });

  test("Scenario: submission flow for a commune contact", async () => {
    console.info("Scenario: Contact form submission for commune visitor");

    const fingerprintId = "fp-commune";
    loadMock.mockResolvedValue({
      get: getMock.mockResolvedValue({ visitorId: fingerprintId }),
    });

    const retryAfter = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    (globalThis.fetch as unknown as vi.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "ticket-123",
        retryAfter,
      }),
    });

    render(<ContactCta />);

    await waitFor(() => expect(loadMock).toHaveBeenCalled());
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    const user = userEvent.setup();
    const submitButton = await screen.findByRole("button", {
      name: /contacter contribcit/i,
    });
    await waitFor(() => expect(submitButton).toBeEnabled());

    const nameInput = screen.getAllByLabelText(/^Nom$/i)[0] as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Jean Dupont" } });
    fireEvent.change(screen.getByLabelText(/Email professionnel/i), {
      target: { value: "jean.dupont@example.org" },
    });
    fireEvent.change(screen.getByLabelText(/^Fonction$/i), {
      target: { value: "Responsable citoyenneté" },
    });
    fireEvent.change(screen.getByLabelText(/^Commune$/i), {
      target: { value: "Ville-sur-Test" },
    });
    fireEvent.change(screen.getByLabelText(/^Message/i), {
      target: { value: "Nous souhaitons en savoir plus sur Contribcit." },
    });

    fireEvent.click(
      screen.getByLabelText(/J'accepte le traitement de mes données personnelles/i),
    );

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/contact-tickets", expect.any(Object)),
    );

    const payload = JSON.parse(
      (globalThis.fetch as unknown as vi.Mock).mock.calls[0]?.[1]?.body,
    );

    expect(payload).toMatchObject({
      fingerprint: fingerprintId,
      name: "Jean Dupont",
      commune: "Ville-sur-Test",
      consent: true,
    });

    expect(await screen.findByText(/demande envoyée/i)).toBeInTheDocument();

    expect(
      window.localStorage.getItem(`contribcit-contact-cooldown:${fingerprintId}`),
    ).toBeTruthy();
  });

  test("Scenario: financier contact must specify organisme", async () => {
    console.info("Scenario: Validation prevents financier contact without organisation");

    loadMock.mockResolvedValue({
      get: getMock.mockResolvedValue({ visitorId: "fp-financier" }),
    });

    (globalThis.fetch as unknown as vi.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(<ContactCta />);

    await waitFor(() => expect(loadMock).toHaveBeenCalled());
    await waitFor(() => expect(getMock).toHaveBeenCalled());

    const user = userEvent.setup();
    const submitButton = await screen.findByRole("button", {
      name: /contacter contribcit/i,
    });
    await waitFor(() => expect(submitButton).toBeEnabled());

    fireEvent.click(screen.getByLabelText(/Un organisme financier/i));
    const financierName = screen.getAllByLabelText(/^Nom$/i)[0] as HTMLInputElement;
    fireEvent.change(financierName, { target: { value: "Camille Martin" } });
    fireEvent.change(screen.getByLabelText(/Email professionnel/i), {
      target: { value: "camille@example.org" },
    });
    fireEvent.change(screen.getByLabelText(/^Fonction$/i), {
      target: { value: "Chargée de mission" },
    });
    fireEvent.change(screen.getByLabelText(/^Message/i), {
      target: { value: "Nous souhaitons soutenir le projet." },
    });
    fireEvent.click(
      screen.getByLabelText(/J'accepte le traitement de mes données personnelles/i),
    );

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    const organismeError = await screen.findByText(
      /Le nom de l'organisme doit contenir au moins 2 caractères/i,
    );
    expect(organismeError).toBeInTheDocument();

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test("Scenario: fingerprint initialisation failure blocks submission", async () => {
    console.info("Scenario: Fingerprint initialisation failure is surfaced to user");

    loadMock.mockRejectedValue(new Error("fingerprint unavailable"));

    render(<ContactCta />);

    const infoAlert = await screen.findByText(
      "Impossible d'initialiser la protection anti-spam. Veuillez rafraîchir la page ou réessayer plus tard.",
    );
    expect(infoAlert).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /contacter contribcit/i })).toBeDisabled();
  });
});

