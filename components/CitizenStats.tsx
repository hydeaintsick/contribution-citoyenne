"use client";

import { motion } from "framer-motion";

const stats = [
  {
    value: "68,6 millions",
    label: "d'habitants en France",
    description: "Autant de citoyens prêts à s'exprimer",
  },
  {
    value: "35%",
    label: "des Français engagés",
    description: "dans une association",
  },
  {
    value: "42%",
    label: "impliqués dans la vie locale",
    description: "dans au moins une organisation",
  },
  {
    value: "80%+",
    label: "vivent en milieu urbain",
    description: "où la participation citoyenne est essentielle",
  },
  {
    value: "66,4 millions",
    label: "en métropole",
    description: "un potentiel immense de participation",
  },
  {
    value: "2,2 millions",
    label: "dans les DOM",
    description: "également concernés par la participation",
  },
  {
    value: "35 000",
    label: "communes en France",
    description: "autant d'opportunités de dialogue",
  },
  {
    value: "75%",
    label: "souhaitent plus participer",
    description: "selon les dernières enquêtes",
  },
];

export function CitizenStats() {
  // Dupliquer les stats pour créer un effet de boucle infinie
  const duplicatedStats = [...stats, ...stats];

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
              Ils n'attendent qu'à prendre la parole
            </h2>
          </motion.div>
        </div>
      </div>
      <div 
        className="fr-mt-4w" 
        style={{ 
          overflow: "hidden",
          paddingTop: "1rem",
          paddingBottom: "1rem"
        }}
      >
        <motion.div
          className="fr-flex fr-flex-row"
          animate={{
            x: [0, -(280 + 24) * stats.length],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 30,
              ease: "linear",
            },
          }}
          style={{ 
            width: "max-content",
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: "1.5rem"
          }}
        >
          {duplicatedStats.map((stat, index) => (
            <div
              key={index}
              className="fr-card fr-card--no-border fr-card--shadow fr-p-2w fr-text--center"
              style={{ 
                minWidth: "280px", 
                flexShrink: 0,
                display: "inline-block"
              }}
            >
              <p className="fr-h1 fr-text--bold fr-text--blue-france">{stat.value}</p>
              <p className="fr-h4 fr-mt-1w">{stat.label}</p>
              {stat.description && (
                <p className="fr-text fr-mt-2w fr-text--grey">{stat.description}</p>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

