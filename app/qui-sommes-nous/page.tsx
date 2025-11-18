"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { motion } from "framer-motion";

export default function QuiSommesNousPage() {
  return (
    <main>
      {/* Section Hero */}
      <section className="fr-container fr-py-8w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="fr-h1 fr-text--center">
                Contribcit, c&apos;est quoi ?
              </h1>
              <p className="fr-text--lg fr-text--center fr-mt-4w">
                Contribcit est une plateforme qui vous permet de signaler des
                problèmes ou de suggérer des améliorations dans votre commune,
                directement depuis votre smartphone. Simple, rapide et efficace.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Comment ça marche */}
      <section className="fr-container fr-py-8w fr-background-alt--grey">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="fr-h2 fr-text--center">Comment ça marche ?</h2>
              <div className="fr-grid-row fr-grid-row--gutters fr-mt-6w">
                <div className="fr-col-12 fr-col-md-4">
                  <div className="fr-text--center">
              <div
                      className="fr-badge fr-badge--blue-france"
                style={{
                        fontSize: "2rem",
                        width: "4rem",
                        height: "4rem",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                  borderRadius: "50%",
                        marginBottom: "1rem",
                      }}
                    >
                      1
              </div>
                    <h3 className="fr-h4">Scannez le QR Code</h3>
                    <p className="fr-text--sm">
                      Dans votre commune, repérez un QR Code Contribcit affiché
                      sur un panneau ou un support de communication.
                    </p>
                  </div>
                </div>
                <div className="fr-col-12 fr-col-md-4">
                  <div className="fr-text--center">
                    <div
                      className="fr-badge fr-badge--blue-france"
                  style={{
                        fontSize: "2rem",
                        width: "4rem",
                        height: "4rem",
                    display: "inline-flex",
                    alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        marginBottom: "1rem",
                      }}
                    >
                      2
                    </div>
                    <h3 className="fr-h4">Décrivez votre remontée</h3>
                    <p className="fr-text--sm">
                      Indiquez s&apos;il s&apos;agit d&apos;une alerte (problème
                      à signaler) ou d&apos;une suggestion (idée
                      d&apos;amélioration), puis décrivez la situation.
                    </p>
              </div>
          </div>
                <div className="fr-col-12 fr-col-md-4">
                  <div className="fr-text--center">
                    <div
                      className="fr-badge fr-badge--blue-france"
                style={{
                        fontSize: "2rem",
                        width: "4rem",
                        height: "4rem",
                    display: "inline-flex",
                    alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        marginBottom: "1rem",
                      }}
                    >
                      3
                    </div>
                    <h3 className="fr-h4">Votre mairie traite</h3>
                    <p className="fr-text--sm">
                      Votre contribution est transmise directement aux services
                      municipaux qui l&apos;analysent et y répondent dans les
                      meilleurs délais.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Pourquoi Contribcit */}
      <section className="fr-container fr-py-8w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="fr-h2 fr-text--center">
                Pourquoi utiliser Contribcit ?
              </h2>
              <div className="fr-mt-6w">
                <div className="fr-grid-row fr-grid-row--gutters">
                  <div className="fr-col-12 fr-col-md-6">
                    <div className="fr-card fr-card--no-arrow fr-card--shadow">
                      <div className="fr-card__body">
                        <h3 className="fr-card__title fr-h5">
                          Simple et rapide
                        </h3>
                        <p className="fr-card__desc fr-text--sm">
                          Pas besoin de créer de compte ou de télécharger une
                          application. Un simple scan de QR Code et vous pouvez
                          contribuer en quelques clics.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="fr-col-12 fr-col-md-6">
                    <div className="fr-card fr-card--no-arrow fr-card--shadow">
                      <div className="fr-card__body">
                        <h3 className="fr-card__title fr-h5">Direct et efficace</h3>
                        <p className="fr-card__desc fr-text--sm">
                          Vos remontées arrivent directement aux bons services
                          municipaux, sans intermédiaire. Vous pouvez même
                          ajouter une photo pour illustrer votre signalement.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="fr-col-12 fr-col-md-6">
                    <div className="fr-card fr-card--no-arrow fr-card--shadow">
                      <div className="fr-card__body">
                        <h3 className="fr-card__title fr-h5">Transparent</h3>
                        <p className="fr-card__desc fr-text--sm">
                          Vous recevez un numéro de suivi pour suivre
                          l&apos;avancement du traitement de votre contribution.
                          Votre mairie vous tient informé de la suite donnée.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="fr-col-12 fr-col-md-6">
                    <div className="fr-card fr-card--no-arrow fr-card--shadow">
                      <div className="fr-card__body">
                        <h3 className="fr-card__title fr-h5">
                          Votre voix compte
                        </h3>
                        <p className="fr-card__desc fr-text--sm">
                          Contribcit redonne la parole aux citoyens. Vos alertes
                          et suggestions aident à améliorer la vie quotidienne
                          dans votre commune.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Exemples */}
      <section className="fr-container fr-py-8w fr-background-alt--grey">
          <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="fr-h2 fr-text--center">
                Que pouvez-vous signaler ?
              </h2>
              <div className="fr-mt-6w">
                <div className="fr-grid-row fr-grid-row--gutters">
                  <div className="fr-col-12 fr-col-md-6">
                    <div className="fr-tile fr-tile--horizontal">
                      <div className="fr-tile__body">
                        <h3 className="fr-tile__title fr-h6">Alertes</h3>
                        <p className="fr-tile__desc fr-text--sm">
                          Signalez des problèmes concrets : nid de poule, panneau
                          cassé, éclairage défaillant, déchet abandonné, etc.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="fr-col-12 fr-col-md-6">
                    <div className="fr-tile fr-tile--horizontal">
                      <div className="fr-tile__body">
                        <h3 className="fr-tile__title fr-h6">Suggestions</h3>
                        <p className="fr-tile__desc fr-text--sm">
                          Proposez des améliorations : nouvelle piste cyclable,
                          meilleur éclairage, aménagement d&apos;un espace vert,
                          etc.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section À propos */}
      <section className="fr-container fr-py-8w">
          <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="fr-h2 fr-text--center">Qui sommes-nous ?</h2>
              <p className="fr-text--lg fr-mt-4w" style={{ lineHeight: "1.8" }}>
                Contribcit est né de la conviction que la technologie doit être
                au service de la démocratie participative et du bien commun.
                Créée en 2024 par deux développeurs passionnés par le vivre
                ensemble, notre plateforme a pour mission de faciliter le dialogue
                entre les citoyens et leurs représentants locaux.
              </p>
              <p className="fr-text--lg fr-mt-4w" style={{ lineHeight: "1.8" }}>
                Nous croyons que chaque voix compte et que les citoyens doivent
                pouvoir s&apos;exprimer facilement sur les sujets qui les
                concernent au quotidien. Contribcit offre une solution simple,
                intuitive et efficace pour améliorer la qualité de vie dans les
                territoires.
              </p>
              <div
                className="fr-mt-6w fr-text--center"
                style={{
                  padding: "2rem",
                  backgroundColor: "var(--background-alt-blue-france)",
                  borderRadius: "8px",
                }}
              >
                <p
                  className="fr-text--lg"
                  style={{ fontWeight: "bold", margin: 0 }}
                >
                  Contribcit :{" "}
                  <span style={{ color: "var(--blue-france-sun-113-625)" }}>
                    redonner la parole aux citoyens pour construire ensemble des
                    villes plus sûres, plus agréables et plus proches de leurs
                    habitants.
                  </span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section CTA */}
      <section
        style={{
          backgroundColor: "#000091",
          color: "white",
        }}
      >
        <div className="fr-container fr-py-8w">
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-12 fr-col-md-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="fr-text--center"
              >
                <h2 className="fr-h2" style={{ color: "white" }}>
                  Prêt à contribuer ?
                </h2>
                <p
                  className="fr-text--lg fr-mt-4w"
                  style={{ color: "white", lineHeight: "1.8" }}
                >
                  Si votre commune utilise Contribcit, cherchez les QR Codes
                  affichés dans l&apos;espace public et commencez à contribuer
                  dès maintenant !
                </p>
                <p
                  className="fr-text--md fr-mt-4w"
                  style={{ color: "rgba(255, 255, 255, 0.9)" }}
                >
                  Votre commune n&apos;utilise pas encore Contribcit ?{" "}
                  <a
                    href="/#contact"
                    className="fr-link"
                    style={{ color: "white", textDecoration: "underline" }}
                  >
                    Parlez-en à votre mairie
                  </a>
                  .
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
