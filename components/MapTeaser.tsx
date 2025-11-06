"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function MapTeaser() {
  return (
    <section className="fr-container fr-py-8w">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12">
          <h2 className="fr-h2 fr-text--center">Cartographie des retours</h2>
          <p className="fr-text--lg fr-text--center fr-mt-2w">
            Visualisez en temps réel les alertes et suggestions de vos habitants
          </p>
        </div>
      </div>
      <motion.div
        className="fr-grid-row fr-grid-row--center fr-mt-6w"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="fr-col-12 fr-col-md-10">
          <div className="fr-card fr-card--no-border fr-card--shadow">
            <Image
              src="/illustrations/carte.svg"
              alt="Carte avec points de géolocalisation des alertes et suggestions"
              width={1200}
              height={600}
              className="fr-responsive-img"
            />
            <div className="fr-p-4w">
              <div className="fr-flex fr-flex-row fr-gap-4w fr-flex-wrap">
                <div className="fr-flex fr-flex-row fr-gap-2w fr-align-items-center">
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: "#e1000f",
                    }}
                  />
                  <span className="fr-text--sm">Alertes</span>
                </div>
                <div className="fr-flex fr-flex-row fr-gap-2w fr-align-items-center">
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: "#0063cb",
                    }}
                  />
                  <span className="fr-text--sm">Suggestions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

