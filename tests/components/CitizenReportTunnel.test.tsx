import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi, afterEach } from "vitest";
import { CitizenReportTunnel } from "@/components/CitizenReportTunnel";

describe("CitizenReportTunnel", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test("auto-advances to the category step for suggestions", async () => {
    const user = userEvent.setup();

    render(
      <CitizenReportTunnel communeId="commune-1" communeName="Testville" />,
    );

    await user.click(screen.getByRole("button", { name: /suggérer/i }));
    expect(
      await screen.findByRole("heading", {
        name: /précisez la catégorie/i,
        timeout: 1500,
      }),
    ).toBeInTheDocument();
  });

  test("submits an alert successfully and reaches the confirmation screen", async () => {
    const user = userEvent.setup();

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

    render(
      <CitizenReportTunnel communeId="commune-42" communeName="Ville Test" />,
    );

    await user.click(screen.getByRole("button", { name: /alerter/i }));
    await user.click(screen.getByRole("button", { name: /continuer/i }));

    const categorySelect = screen.getByRole("combobox", {
      name: /^Catégorie$/i,
    });
    await user.selectOptions(categorySelect, "proprete");

    const subcategorySelect = await screen.findByRole("combobox", {
      name: /Sous-catégorie/i,
    });
    await user.selectOptions(subcategorySelect, "Déchets et dépôts sauvages");

    expect(
      await screen.findByRole("heading", {
        name: /vous y êtes presque/i,
        timeout: 1500,
      }),
    ).toBeInTheDocument();

    const detailsField = screen.getByLabelText(/décrivez la situation/i);
    await user.clear(detailsField);
    fireEvent.change(detailsField, {
      target: { value: "Description suffisamment longue." },
    });

    const locationField = screen.getByLabelText(/lieu concerné/i);
    await user.clear(locationField);
    fireEvent.change(locationField, { target: { value: "Rue des Tests" } });
    await waitFor(() => {
      expect(locationField).toHaveDisplayValue("Rue des Tests");
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /envoyer/i }),
      ).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: /envoyer/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock.mock.calls[0]?.[0]).toEqual("/api/contrib/reports");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /merci pour votre remontée/i }),
      ).toBeInTheDocument();
    });
  });
});

