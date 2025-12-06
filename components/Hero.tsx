"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { motion } from "framer-motion";
import Image from "next/image";

export function Hero() {
  return (
    <section id="hero" style={{ backgroundColor: "var(--blue-france-925-125)", }}>
      <div className="fr-container">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
          <div className="fr-col-12 fr-col-lg-6">
            <div className="fr-pt-4w fr-pb-4w fr-pb-md-14w fr-pt-md-10w">
              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="fr-h2 fr-mt-2w" style={{ color: "var(--blue-france-sun-113-625)", }}>Offrez à vos administrés un canal citoyen direct, et à vos équipes un gain de temps concret.</h1>
              <p className="fr-text--lg fr-mt-4w">
                Contribcit <strong>centralise</strong> et <strong>classe automatiquement</strong> les <strong>signalements et suggestions</strong> de vos <strong>administrés</strong>, permettant à vos <strong>équipes</strong> de <strong>gagner un temps précieux</strong> tout en <strong>améliorant le suivi et l’action sur le terrain</strong>.

              </p>
              <div className="fr-mt-6w">
                <Button
                  onClick={() => {
                    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Nous contacter
                </Button>
              </div>
            </motion.div>
            </div>
          </div>
          <div className="fr-col-12 fr-col-lg-6 fr-mt-md-0 fr-pb-0" style={{ alignSelf: "flex-end" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div>
                <Image
                  src="/mock.png"
                  alt="Aperçu de l'interface de ContribCit sur smartphone."
                  width={390}
                  height={260}
                  priority
                  className="hero-img fr-responsive-img"
                  style={{
                    objectFit: "contain",
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

