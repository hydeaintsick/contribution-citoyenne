import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { TownQrCodeCard } from "@/components/TownQrCodeCard";

const { qrMock } = vi.hoisted(() => ({
  qrMock: vi.fn(),
}));

vi.mock("qrcode.react", () => ({
  QRCodeSVG: (props: { value: string }) => {
    qrMock(props.value);
    return <div data-testid="qr-code" data-value={props.value} />;
  },
}));

describe("TownQrCodeCard", () => {
  test("Scenario: renders QR card with commune name and contribution URL", () => {
    console.info("Scenario: QR card shows commune identity and QR payload");

    render(
      <TownQrCodeCard
        communeName="Testville"
        contributionUrl="https://example.org/contrib/testville"
      />,
    );

    expect(
      screen.getByText(/Ville de Testville/i),
    ).toBeInTheDocument();
    expect(qrMock).toHaveBeenCalledWith("https://example.org/contrib/testville");
    expect(screen.getByTestId("qr-code")).toHaveAttribute(
      "data-value",
      "https://example.org/contrib/testville",
    );
  });
});

