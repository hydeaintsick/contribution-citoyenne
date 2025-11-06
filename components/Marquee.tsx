"use client";

import { motion } from "framer-motion";

const logos = [
  { name: "Collectivité 1", id: 1 },
  { name: "Collectivité 2", id: 2 },
  { name: "Collectivité 3", id: 3 },
  { name: "Collectivité 4", id: 4 },
  { name: "Collectivité 5", id: 5 },
  { name: "Collectivité 6", id: 6 },
];

export function Marquee() {
  return (
    <section className="fr-container fr-py-4w fr-background-alt--grey">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12">
          <p className="fr-text--sm fr-text--center fr-mb-2w">
            Conçu selon le <strong>Design System de l'État (DSFR)</strong>
          </p>
          <div className="fr-marquee" style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
            <motion.div
              className="fr-flex fr-flex-row fr-gap-4w"
              animate={{
                x: [0, -50 * logos.length],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 20,
                  ease: "linear",
                },
              }}
            >
              {[...logos, ...logos].map((logo, index) => (
                <div
                  key={`${logo.id}-${index}`}
                  className="fr-p-2w fr-bg--white fr-rounded"
                  style={{ minWidth: "150px", textAlign: "center" }}
                >
                  <span className="fr-text--sm">{logo.name}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

