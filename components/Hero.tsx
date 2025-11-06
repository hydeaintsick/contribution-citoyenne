"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { motion } from "framer-motion";
import Image from "next/image";

export function Hero() {
  return (
    <section id="hero" className="fr-container fr-py-8w">
      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
        <div className="fr-col-12 fr-col-md-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="fr-h1">Contribcit</h1>
            <h2 className="fr-h2 fr-mt-2w">Pour une ville sûre qui nous unit</h2>
            <p className="fr-text--lg fr-mt-4w">
              Offrez à vos habitants un canal simple pour <strong>alerter</strong> et{" "}
              <strong>suggérer</strong>. Avec Contribcit, un QR code suffit pour remonter les
              informations de terrain, cartographier les besoins et{" "}
              <strong>accélérer le traitement</strong>.
            </p>
            <div className="fr-mt-6w fr-btns-group fr-btns-group--inline-md">
              <Button
                iconId="fr-icon-mail-line"
                onClick={() => {
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Contacter Contribcit
              </Button>
              <Button
                priority="secondary"
                iconId="fr-icon-arrow-down-line"
                onClick={() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Voir comment ça marche
              </Button>
            </div>
            <div className="fr-mt-4w">
              <Badge severity="success" noIcon>
                Conforme RGPD
              </Badge>
            </div>
          </motion.div>
        </div>
        <div className="fr-col-12 fr-col-md-6 fr-mt-4w fr-mt-md-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <Image
                src="/bike_illustration.svg"
                alt="Illustration d'une femme à vélo dans une ville moderne"
                width={390}
                height={260}
                priority
                className="fr-responsive-img"
                style={{
                  objectFit: "contain",
                  maxWidth: "390px",
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

