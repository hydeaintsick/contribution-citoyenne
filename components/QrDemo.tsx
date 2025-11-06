"use client";

import { useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { motion } from "framer-motion";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

const tunnelSteps = [
  {
    title: "Scanner le QR code",
    description: "Le citoyen scanne le QR code avec son smartphone",
    image: "/illustrations/qr.svg",
  },
  {
    title: "Choisir le type",
    description: "Alerter ou Suggérer",
    image: "/illustrations/citoyens.svg",
  },
  {
    title: "Remplir le formulaire",
    description: "Catégorie, description, photo optionnelle, géolocalisation",
    image: "/illustrations/ville.svg",
  },
  {
    title: "Confirmation",
    description: "Le retour est envoyé à la mairie",
    image: "/illustrations/qr.svg",
  },
];

export function QrDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const {
    buttonProps,
    Component: Modal,
    open,
    close,
  } = createModal({
    isOpenedByDefault: false,
    id: "qr-demo-modal",
  });

  // Logo Marianne française SVG encodé en base64
  // Symbole Marianne simplifié (bonnet phrygien)
  const marianneLogoSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="10" r="3" fill="#000091"/>
    <path d="M8 16c0-2 1.79-4 4-4s4 2 4 4" stroke="#000091" stroke-width="1.5" fill="none"/>
    <path d="M10 6L12 4L14 6" stroke="#000091" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
  
  // Encodage base64 côté client
  const marianneLogoBase64 = typeof window !== 'undefined' 
    ? `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(marianneLogoSVG)))}`
    : '';

  return (
    <section
      style={{
        backgroundColor: "#000091", // Bleu marine DSFR
        color: "white",
        position: "relative",
      }}
    >
      {/* Bandeau "Bientôt disponible" */}
      <div
        style={{
          backgroundColor: "#ffb600", // Jaune DSFR pour les alertes/notifications
          color: "#000091",
          textAlign: "center",
          padding: "8px 0",
          fontSize: "0.875rem",
          fontWeight: "bold",
        }}
      >
        Bientôt disponible
      </div>
      <div className="fr-container fr-py-3w">
        <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-8" style={{ paddingRight: "3rem" }}>
            <h2 className="fr-h3" style={{ color: "white", margin: 0 }}>
              Découvrez le tunnel en action
            </h2>
            <p
              className="fr-text--md fr-mt-3w"
              style={{ color: "white", opacity: 0.95, lineHeight: "1.6" }}
            >
              Plongez-vous dans l'expérience de vos concitoyens et découvrez la
              simplicité du parcours qu'ils suivent pour vous alerter ou vous
              faire des suggestions. Testez par vous-même la fluidité de notre
              interface.
            </p>
          </div>
          <div className="fr-col-12 fr-col-md-4 fr-text--right">
            <div className="fr-flex fr-flex-row fr-gap-2w fr-align-items-center fr-justify-content-md-end">
              <div
                onClick={open}
                style={{
                  cursor: "pointer",
                  display: "inline-block",
                  position: "relative",
                }}
              >
                <QRCodeSVG
                  value="https://contribcit.fr"
                  size={80}
                  level="H"
                  fgColor="#ffffff"
                  bgColor="transparent"
                  imageSettings={{
                    src: marianneLogoBase64,
                    height: 20,
                    width: 20,
                    excavate: true,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="Simulation du tunnel Contribcit"
        concealingBackdrop={true}
        buttons={[
          {
            priority: "secondary",
            disabled: currentStep === 0,
            children: "Précédent",
            onClick: () => setCurrentStep(Math.max(0, currentStep - 1)),
            doClosesModal: false,
          },
          currentStep < tunnelSteps.length - 1
            ? {
                children: "Suivant",
                onClick: () => setCurrentStep(currentStep + 1),
                doClosesModal: false,
              }
            : {
                children: "Fermer",
                onClick: () => {
                  setCurrentStep(0);
                  close();
                },
                doClosesModal: true,
              },
        ]}
      >
        <div className="fr-text--center fr-mb-4w">
          <Image
            src={tunnelSteps[currentStep].image}
            alt={tunnelSteps[currentStep].title}
            width={150}
            height={150}
            className="fr-responsive-img"
          />
        </div>
        <h3 className="fr-h4 fr-text--center">
          {tunnelSteps[currentStep].title}
        </h3>
        <p className="fr-text--center fr-mt-2w">
          {tunnelSteps[currentStep].description}
        </p>
        <div className="fr-flex fr-flex-row fr-gap-2w fr-justify-content-center fr-mt-4w">
          {tunnelSteps.map((_, index) => (
            <button
              key={index}
              type="button"
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: index === currentStep ? "#0063cb" : "#e5e5e5",
                cursor: "pointer",
                border: "none",
                padding: 0,
              }}
              onClick={() => setCurrentStep(index)}
              aria-label={`Étape ${index + 1}`}
            />
          ))}
        </div>
      </Modal>
    </section>
  );
}
