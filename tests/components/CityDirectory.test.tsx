import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { CityDirectory } from "@/components/CityDirectory";

const sampleCommunes = [
  { id: "1", name: "Paris", postalCode: "75000", websiteUrl: "https://paris.fr", slug: "paris" },
  { id: "2", name: "Poitiers", postalCode: "86000", websiteUrl: null, slug: "poitiers" },
  { id: "3", name: "Lyon", postalCode: "69000", websiteUrl: "https://lyon.fr", slug: "lyon" },
];

afterEach(() => {
  cleanup();
});

describe("CityDirectory", () => {
  test("Scenario: displays grouped communes and filter matches postal code", async () => {
    console.info("Scenario: City directory filters communes by text or postal code");

    render(<CityDirectory communes={sampleCommunes} />);

    expect(screen.getByRole("heading", { name: "L" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "P" })).toBeInTheDocument();
    expect(screen.getByText(/Paris/i)).toBeInTheDocument();
    expect(screen.getByText(/Poitiers/i)).toBeInTheDocument();
    expect(screen.getByText(/Lyon/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByRole("searchbox"), "86000");

    expect(screen.getByText(/Poitiers/i)).toBeInTheDocument();
    expect(screen.queryByText(/Paris/i)).not.toBeInTheDocument();
  });

  test("Scenario: empty results show informational callout", () => {
    console.info("Scenario: City directory displays empty state when no communes match");

    render(<CityDirectory communes={sampleCommunes} />);

    const searchbox = screen.getByRole("searchbox");
    fireEvent.change(searchbox, { target: { value: "ZZZ" } });

    expect(
      screen.getByText(/Aucun résultat/i),
    ).toBeInTheDocument();
  });
});

