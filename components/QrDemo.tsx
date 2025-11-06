"use client";

import { useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { motion } from "framer-motion";
import Image from "next/image";

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
  const { buttonProps, Component: Modal, open, close } = createModal({
    isOpenedByDefault: false,
    id: "qr-demo-modal",
  });

  return (
    <section className="fr-container fr-py-8w fr-background-alt--grey">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-text--center">
          <h2 className="fr-h2">Découvrez le tunnel en action</h2>
          <p className="fr-text--lg fr-mt-2w">
            Simulez l'expérience utilisateur en quelques clics
          </p>
        </div>
      </div>
      <motion.div
        className="fr-grid-row fr-grid-row--center fr-mt-6w"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
      >
        <div className="fr-col-12 fr-col-md-6 fr-text--center">
          <div className="fr-card fr-card--no-border fr-card--shadow fr-p-6w">
            <Image
              src="/illustrations/qr.svg"
              alt="QR code Contribcit"
              width={200}
              height={200}
              className="fr-responsive-img"
            />
            <Button className="fr-mt-4w" {...buttonProps} onClick={open}>
              Simuler
            </Button>
          </div>
        </div>
      </motion.div>

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
        <h3 className="fr-h4 fr-text--center">{tunnelSteps[currentStep].title}</h3>
        <p className="fr-text--center fr-mt-2w">{tunnelSteps[currentStep].description}</p>
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

