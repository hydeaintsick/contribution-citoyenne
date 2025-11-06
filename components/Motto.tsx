"use client";

import { motion } from "framer-motion";

const mottoItems = [
  {
    word: "Liberté",
    text: "parce que chacun est libre de s'exprimer et de vivre dans une ville sûre",
    iconId: "fr-icon-global-line",
    position: "right",
  },
  {
    word: "Égalité",
    text: "Parce que la voix de chacun compte",
    iconId: "fr-icon-check-line",
    position: "left",
  },
  {
    word: "Fraternité",
    text: "Parce que le vivre-ensemble commence par s'écouter",
    iconId: "fr-icon-discuss-line",
    position: "right",
  },
];

export function Motto() {
  return (
    <section className="fr-container fr-py-8w fr-background-alt--grey" style={{ position: "relative", overflow: "hidden" }}>
      {/* Cœurs discrets en arrière-plan */}
      <div style={{ position: "absolute", top: "10%", left: "5%", opacity: 0.1, fontSize: "2rem" }}>
        ❤️
      </div>
      <div style={{ position: "absolute", top: "60%", right: "8%", opacity: 0.1, fontSize: "1.5rem" }}>
        ❤️
      </div>
      <div style={{ position: "absolute", bottom: "15%", left: "12%", opacity: 0.1, fontSize: "1.8rem" }}>
        ❤️
      </div>

      {/* Logo officiel du DS avec devise */}
      <div className="fr-grid-row fr-grid-row--center fr-mb-8w">
        <div className="fr-col-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="fr-text--center"
          >
            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1.5rem 2rem",
                border: "2px solid var(--blue-france-sun-113-625)",
                borderRadius: "8px",
                backgroundColor: "white",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                  color: "var(--blue-france-sun-113-625)",
                  letterSpacing: "0.1em",
                }}
              >
                RÉPUBLIQUE FRANÇAISE
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "var(--blue-france-sun-113-625)",
                  marginTop: "0.25rem",
                }}
              >
                Liberté Égalité Fraternité
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Items avec layout alterné */}
      <div className="fr-mt-6w" style={{ position: "relative" }}>
        {mottoItems.map((item, index) => (
          <motion.div
            key={item.word}
            initial={{ opacity: 0, x: item.position === "left" ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            style={{
              marginBottom: index === 1 ? "5rem" : "4rem",
              marginTop: index === 1 ? "3rem" : "0",
            }}
          >
            <div className="fr-grid-row fr-grid-row--gutters">
              <div
                className={`fr-col-12 fr-col-md-10 ${
                  item.position === "left" ? "fr-col-md-offset-2" : ""
                }`}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: item.position === "left" ? "row" : "row-reverse",
                    alignItems: "flex-start",
                    gap: "2rem",
                  }}
                >
                  {/* Icône avec petit cœur */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: "90px",
                        height: "90px",
                        borderRadius: "50%",
                        backgroundColor: "var(--blue-france-sun-113-625)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 16px rgba(0, 99, 203, 0.25)",
                        border: "4px solid white",
                      }}
                    >
                      <span
                        className={`${item.iconId} fr-icon--lg`}
                        style={{
                          color: "white",
                          fontSize: "2.25rem",
                        }}
                        aria-hidden="true"
                      />
                    </div>
                    {/* Petit cœur discret près de l'icône */}
                    <div
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: item.position === "left" ? "-8px" : "auto",
                        left: item.position === "left" ? "auto" : "-8px",
                        opacity: 0.3,
                        fontSize: "1.2rem",
                      }}
                    >
                      ❤️
                    </div>
                  </div>

                  {/* Contenu texte */}
                  <div style={{ flex: 1, paddingTop: "0.5rem" }}>
                    <h3
                      className="fr-h3"
                      style={{
                        color: "var(--blue-france-sun-113-625)",
                        marginBottom: "0.75rem",
                        fontSize: "1.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      {item.word}
                    </h3>
                    <p
                      className="fr-text--lg"
                      style={{
                        lineHeight: "1.7",
                        color: "var(--text-default-grey)",
                        fontSize: "1.125rem",
                      }}
                    >
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

