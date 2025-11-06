"use client";

import { motion } from "framer-motion";

const mottoItems = [
  {
    word: "Liberté",
    text: "parce que chacun est libre de s'exprimer et de vivre dans une ville sûre",
  },
  {
    word: "Égalité",
    text: "Parce que la voix de chacun compte",
  },
  {
    word: "Fraternité",
    text: "Parce que le vivre-ensemble commence par s'écouter",
  },
];

export function Motto() {
  return (
    <section className="fr-container fr-py-8w fr-background-alt--grey">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="fr-h2 fr-text--center fr-mb-6w">
              Liberté Égalité Fraternité
            </h2>
          </motion.div>
        </div>
      </div>
      <div className="fr-mt-6w" style={{ position: "relative", padding: "2rem 0" }}>
        {/* Ligne de connexion horizontale */}
        <div
          style={{
            position: "absolute",
            top: "60px",
            left: "15%",
            right: "15%",
            height: "3px",
            backgroundColor: "var(--blue-france-sun-113-625)",
            zIndex: 0,
          }}
        />
        <div className="fr-grid-row fr-grid-row--gutters">
          {mottoItems.map((item, index) => (
            <motion.div
              key={item.word}
              className="fr-col-12 fr-col-md-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              style={{ position: "relative", zIndex: 1 }}
            >
              <div className="fr-text--center">
                {/* Point sur la ligne */}
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    backgroundColor: "var(--blue-france-sun-113-625)",
                    margin: "0 auto 2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0, 99, 203, 0.3)",
                    border: "4px solid white",
                  }}
                >
                  <h3
                    className="fr-h4 fr-text--bold"
                    style={{
                      color: "white",
                      margin: 0,
                      fontSize: "1.1rem",
                    }}
                  >
                    {item.word}
                  </h3>
                </div>
                {/* Texte en dessous */}
                <p className="fr-text--lg fr-mt-2w" style={{ maxWidth: "300px", margin: "0 auto", lineHeight: "1.6" }}>
                  {item.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

