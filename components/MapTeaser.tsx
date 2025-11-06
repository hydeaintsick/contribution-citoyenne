"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dynamic from "next/dynamic";

// Import dynamique de la carte pour éviter les problèmes SSR
const ParisMap = dynamic(() => import("./ParisMap").then((mod) => ({ default: mod.ParisMap })), {
  ssr: false,
  loading: () => (
    <div style={{ height: "500px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p>Chargement de la carte...</p>
    </div>
  ),
});

// Couleurs officielles du DSFR utilisées dans les visualisations
// - Bleu France : #0063cb (blue-france-sun-113-625)
// - Rouge Marianne : #e1000f (error-425-625)

// Données de démonstration pour le graphique par semaine
const weeklyData = [
  { semaine: "Sem. 1", alertes: 12, suggestions: 18 },
  { semaine: "Sem. 2", alertes: 15, suggestions: 22 },
  { semaine: "Sem. 3", alertes: 8, suggestions: 25 },
  { semaine: "Sem. 4", alertes: 20, suggestions: 15 },
  { semaine: "Sem. 5", alertes: 10, suggestions: 28 },
  { semaine: "Sem. 6", alertes: 18, suggestions: 20 },
  { semaine: "Sem. 7", alertes: 14, suggestions: 24 },
  { semaine: "Sem. 8", alertes: 16, suggestions: 19 },
];


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

      {/* Graphique en bâtonnets par semaine */}
      <motion.div
        className="fr-grid-row fr-grid-row--center fr-mt-6w"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="fr-col-12 fr-col-md-10">
          <div className="fr-card fr-card--no-border fr-card--shadow">
            <div className="fr-p-4w">
              <h3 className="fr-h4 fr-mb-4w">Évolution hebdomadaire</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semaine" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {/* Couleurs officielles DSFR : Rouge Marianne #e1000f, Bleu France #0063cb */}
                  <Bar dataKey="alertes" fill="#e1000f" name="Alertes" />
                  <Bar dataKey="suggestions" fill="#0063cb" name="Suggestions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Carte de Paris avec zones colorées */}
      <motion.div
        className="fr-grid-row fr-grid-row--center fr-mt-6w"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="fr-col-12 fr-col-md-10">
          <div className="fr-card fr-card--no-border fr-card--shadow">
            <div className="fr-p-4w">
              <h3 className="fr-h4 fr-mb-4w">Répartition géographique</h3>
              <div style={{ height: "500px", width: "100%", position: "relative" }}>
                <ParisMap />
              </div>
              <div className="fr-p-4w fr-mt-4w">
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
                    <span className="fr-text--sm">Zones à dominance d'alertes</span>
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
                    <span className="fr-text--sm">Zones à dominance de suggestions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
