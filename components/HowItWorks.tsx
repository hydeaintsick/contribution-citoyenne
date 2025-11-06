"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const steps = [
  {
    number: 1,
    title: "Le citoyen scanne",
    description: "Un QR code",
    icon: "/illustrations/qr.svg",
  },
  {
    number: 2,
    title: "Il choisit",
    description:
      "Alerter ou Suggérer, précise la catégorie et ajoute une description (photo/localisation possibles)",
    icon: "/illustrations/citoyens.svg",
  },
  {
    number: 3,
    title: "La mairie reçoit",
    description:
      "Et traite : suivi, cartographie, réponse par email, clôture avec motif",
    icon: "/illustrations/ville.svg",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="fr-container fr-py-8w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12">
          <h2 className="fr-h2 fr-text--center">Comment ça marche</h2>
          <p className="fr-text--lg fr-text--center fr-mt-2w">
            Un processus simple en 3 étapes
          </p>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters fr-mt-6w">
        {steps.map((step, index) => (
          <motion.div
            key={step.number}
            className="fr-col-12 fr-col-md-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="fr-card fr-card--no-border fr-card--shadow fr-p-4w">
              <div className="fr-text--center">
                <div
                  className="fr-badge fr-badge--info fr-badge--sm"
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                  }}
                >
                  {step.number}
                </div>
              </div>
              <h3 className="fr-h4 fr-text--center fr-mt-2w">{step.title}</h3>
              <p className="fr-text--center fr-mt-2w">{step.description}</p>
              <div className="fr-text--center fr-mt-4w">
                <Image
                  src={step.icon}
                  alt={`Étape ${step.number}: ${step.title}`}
                  width={120}
                  height={120}
                  className="fr-responsive-img"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
