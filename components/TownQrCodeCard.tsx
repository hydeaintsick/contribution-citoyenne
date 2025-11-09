"use client";

import Image from "next/image";
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
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.3em",
                }}
              >
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
              <div
                style={{
                  position: "relative",
                  width: "18rem",
                  height: "18rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background:
                      "repeating-linear-gradient(135deg, rgba(0, 0, 145, 0.12) 0px, rgba(0, 0, 145, 0.12) 14px, rgba(255, 255, 255, 0.92) 14px, rgba(255, 255, 255, 0.92) 28px)",
                    boxShadow: "inset 0 0 0 10px rgba(255, 255, 255, 0.65)",
                  }}
                />
                <QRCodeSVG
                  value={qrValue}
                  size={280}
                  bgColor="#ffffff"
                  fgColor="#000091"
                  level="H"
                  includeMargin={false}
                  style={{
                    width: "70%",
                    height: "70%",
                    position: "relative",
                  }}
                />
                <Image
                  src="/marianne.png"
                  alt="Symbole Marianne"
                  width={72}
                  height={72}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    borderRadius: "1rem",
                    objectFit: "cover",
                    border: "4px solid rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  }}
                  priority
                />
              </div>
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
