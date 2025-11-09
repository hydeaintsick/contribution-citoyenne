"use client";

import { QRCodeSVG } from "qrcode.react";
import { useMemo } from "react";

type TownQrCodeCardProps = {
  communeName: string;
  contributionUrl: string;
};

export function TownQrCodeCard({
  communeName,
  contributionUrl,
}: TownQrCodeCardProps) {
  const qrValue = useMemo(() => contributionUrl, [contributionUrl]);

  return (
    <div className="fr-container fr-my-6w">
      <div
        className="fr-p-5w fr-grid-row fr-grid-row--center"
        style={{
          backgroundColor: "#000091",
          borderRadius: "1.5rem",
          color: "var(--text-inverse-default, #ffffff)",
          textAlign: "center",
          boxShadow: "0 18px 40px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2.5rem",
              alignItems: "center",
            }}
          >
            <header
              style={{
                display: "grid",
                gap: "0.25rem",
                justifyItems: "center",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.3em",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: "0.75rem",
                    height: "1.5rem",
                    background:
                      "linear-gradient(180deg, #000091 0%, #000091 33%, #ffffff 33%, #ffffff 66%, #e1000f 66%, #e1000f 100%)",
                    borderRadius: "0.125rem",
                    marginRight: "0.75rem",
                  }}
                />
                RÉPUBLIQUE FRANÇAISE
              </span>
              <span
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Contribcit
              </span>
            </header>

            <div
              style={{
                backgroundColor: "var(--background-default-grey, #ffffff)",
                borderRadius: "1.25rem",
                padding: "1.75rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 36px rgba(0, 0, 0, 0.18)",
              }}
            >
              <QRCodeSVG
                value={qrValue}
                size={256}
                bgColor="#ffffff"
                fgColor="#000091"
                level="H"
                includeMargin
              />
            </div>

            <footer>
              <p
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                Ville de {communeName}
              </p>
              <p
                style={{
                  margin: "0.5rem 0 0",
                  fontSize: "0.875rem",
                  color: "rgba(255, 255, 255, 0.78)",
                }}
              >
                Votre avis compte.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
