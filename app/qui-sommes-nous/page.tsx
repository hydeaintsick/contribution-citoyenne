"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

export default function QuiSommesNousPage() {
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState(false);

  const scrollToContact = () => {
    window.location.href = "/#contact";
  };

  const handleShare = async () => {
    const shareText = `Découvrez Contribcit, une solution innovante pour redonner la parole aux citoyens et aider les communes à mieux comprendre les besoins de leurs habitants. Contribcit permet aux citoyens d'alerter et de suggérer des améliorations via des QR codes déployés dans l'espace public, offrant aux communes des outils pertinents pour faciliter et améliorer le vivre ensemble. ${window.location.origin}`;

    // Utiliser l'API Web Share si disponible (mobile)
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Contribcit - La parole aux citoyens des territoires",
          text: shareText,
          url: window.location.origin,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 5000);
      } catch (error: any) {
        // L'utilisateur a annulé le partage
        if (error.name !== "AbortError") {
          setShareError(true);
          setTimeout(() => setShareError(false), 5000);
        }
      }
    } else {
      // Fallback : copier dans le presse-papier
      try {
        await navigator.clipboard.writeText(shareText);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 5000);
      } catch (error) {
        setShareError(true);
        setTimeout(() => setShareError(false), 5000);
      }
    }
  };

  return (
    <main>
      {/* Section Hero / Introduction */}
      <section className="fr-container fr-py-8w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="fr-h1 fr-text--center">Qui sommes nous ?</h1>
              <p className="fr-text--lg fr-text--center fr-mt-4w">
                Deux développeurs passionnés par la démocratie participative et
                le vivre ensemble, qui ont décidé de mettre leur expertise au
                service des communes et de leurs concitoyens.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Storytelling - Les Fondateurs */}
      <section className="fr-container fr-py-8w fr-background-alt--grey">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="fr-h2 fr-text--center">Notre histoire</h2>
            </motion.div>
          </div>
        </div>

        <div className="fr-grid-row fr-grid-row--gutters fr-mt-6w">
          {/* Sébastien IMBERT */}
          <div className="fr-col-12 fr-col-md-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="fr-text--center"
            >
              <div
                style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  margin: "0 auto 2rem",
                  overflow: "hidden",
                  border: "4px solid var(--blue-france-sun-113-625)",
                  position: "relative",
                }}
              >
                <Image
                  src="https://media.licdn.com/dms/image/v2/D4E03AQF6IwFwAPTw9Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1677280373166?e=1764201600&v=beta&t=dtoJgU4cSLIHX3lshfTr9ZBffKlw9IQ25Kv6cMaCgdw"
                  alt="Sébastien IMBERT - Fondateur"
                  width={200}
                  height={200}
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
              <h3
                className="fr-h3"
                style={{ textAlign: "center", margin: "0 auto" }}
              >
                Sébastien IMBERT
              </h3>
              <p
                className="fr-text--lg"
                style={{
                  color: "var(--blue-france-sun-113-625)",
                  textAlign: "center",
                  margin: "0.5rem auto 0",
                }}
              >
                Fondateur
              </p>
              <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
                <a
                  href="https://www.linkedin.com/in/sebastien-imbert/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "var(--blue-france-sun-113-625)",
                    textDecoration: "none",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </motion.div>
          </div>

          {/* Victor MAHE */}
          <div className="fr-col-12 fr-col-md-6">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="fr-text--center"
            >
              <div
                style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  margin: "0 auto 2rem",
                  overflow: "hidden",
                  border: "4px solid var(--blue-france-sun-113-625)",
                  position: "relative",
                }}
              >
                <Image
                  src="https://media.licdn.com/dms/image/v2/D4E03AQEIDt3s4Ci6Ig/profile-displayphoto-shrink_800_800/B4EZVtHwFFGgAo-/0/1741292504799?e=1764201600&v=beta&t=SU5Yb_-Ui_gtWHsbZGoflCNfR95OiAoX70uHQbT0ExI"
                  alt="Victor MAHE - COO"
                  width={200}
                  height={200}
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
              <h3
                className="fr-h3"
                style={{ textAlign: "center", margin: "0 auto" }}
              >
                Victor MAHE
              </h3>
              <p
                className="fr-text--lg"
                style={{
                  color: "var(--blue-france-sun-113-625)",
                  textAlign: "center",
                  margin: "0.5rem auto 0",
                }}
              >
                COO
              </p>
              <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
                <a
                  href="https://www.linkedin.com/in/victormahe/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "var(--blue-france-sun-113-625)",
                    textDecoration: "none",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ flexShrink: 0 }}
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="fr-grid-row fr-grid-row--center fr-mt-8w">
          <div className="fr-col-12 fr-col-md-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="fr-text--lg" style={{ lineHeight: "1.8" }}>
                Sébastien IMBERT et Victor MAHE, deux développeurs informatiques
                passionnés, ont un jour eu l'idée de vouloir redonner la parole
                aux citoyens afin d'aider les politiques locales à avoir une
                politique au plus proche de leurs concitoyens.
              </p>
              <p className="fr-text--lg fr-mt-4w" style={{ lineHeight: "1.8" }}>
                Forts de leur expérience technique et de leur engagement
                citoyen, ils ont constaté que les outils existants pour la
                participation citoyenne étaient souvent complexes, peu
                accessibles ou ne répondaient pas aux besoins réels des communes
                et de leurs habitants. C'est ainsi qu'est née l'idée de
                Contribcit : une solution simple, intuitive et efficace pour
                faciliter le dialogue entre les citoyens et leurs représentants
                locaux.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Mission */}
      <section className="fr-container fr-py-8w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="fr-h2 fr-text--center">Notre mission</h2>
              <div className="fr-mt-6w">
                <p className="fr-text--lg" style={{ lineHeight: "1.8" }}>
                  Offrir aux communes des outils pertinents pour faciliter et
                  améliorer le vivre ensemble. Contribcit permet aux citoyens de
                  s'exprimer facilement sur les sujets qui les concernent au
                  quotidien : propreté, voirie, sécurité, accessibilité,
                  environnement...
                </p>
                <p
                  className="fr-text--lg fr-mt-4w"
                  style={{ lineHeight: "1.8" }}
                >
                  L'envie de changer les choses et de faire le bien guide
                  chacune de nos décisions. Nous croyons fermement que la
                  technologie doit être au service de la démocratie et du bien
                  commun, et non l'inverse.
                </p>
                <div
                  className="fr-mt-6w fr-text--center"
                  style={{
                    padding: "2rem",
                    backgroundColor: "var(--background-alt-blue-france)",
                    borderRadius: "8px",
                    border: "2px solid var(--blue-france-sun-113-625)",
                  }}
                >
                  <p
                    className="fr-text--lg"
                    style={{ fontWeight: "bold", margin: 0 }}
                  >
                    En 2024, Contribcit naît de cette conviction :{" "}
                    <span style={{ color: "var(--blue-france-sun-113-625)" }}>
                      redonner la parole aux citoyens pour construire ensemble
                      des villes plus sûres, plus agréables et plus proches de
                      leurs habitants.
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Communes (fond bleu marine) */}
      <section
        style={{
          backgroundColor: "#000091",
          color: "white",
          position: "relative",
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
                  Vous êtes une commune ?
                </h2>
                <p
                  className="fr-text--lg fr-mt-4w"
                  style={{ color: "white", lineHeight: "1.8" }}
                >
                  Contactez-nous pour recevoir un devis personnalisé et
                  rejoindre le mouvement. Contribcit vous offre une solution clé
                  en main pour améliorer la participation citoyenne et la
                  qualité de vie dans votre territoire.
                </p>
                <div className="fr-mt-6w">
                  <Button
                    iconId="fr-icon-mail-line"
                    onClick={scrollToContact}
                    style={{
                      backgroundColor: "var(--background-default-grey)",
                      color: "#000091",
                    }}
                  >
                    Demander un devis
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Storytelling - Entre Communes et Organismes */}
      <section className="fr-container fr-py-8w">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div className="fr-col-12 fr-col-md-4 fr-text--center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ maxWidth: "100%", height: "auto" }}
              >
                {/* Personnes connectées - illustration simple */}
                <circle
                  cx="60"
                  cy="80"
                  r="25"
                  fill="var(--blue-france-sun-113-625)"
                  opacity="0.8"
                />
                <circle
                  cx="140"
                  cy="80"
                  r="25"
                  fill="var(--blue-france-sun-113-625)"
                  opacity="0.8"
                />
                <circle
                  cx="100"
                  cy="140"
                  r="25"
                  fill="var(--blue-france-sun-113-625)"
                  opacity="0.8"
                />
                {/* Lignes de connexion */}
                <line
                  x1="75"
                  y1="90"
                  x2="125"
                  y2="90"
                  stroke="var(--blue-france-sun-113-625)"
                  strokeWidth="3"
                />
                <line
                  x1="85"
                  y1="105"
                  x2="110"
                  y2="125"
                  stroke="var(--blue-france-sun-113-625)"
                  strokeWidth="3"
                />
                <line
                  x1="115"
                  y1="105"
                  x2="90"
                  y2="125"
                  stroke="var(--blue-france-sun-113-625)"
                  strokeWidth="3"
                />
                {/* Petits cœurs */}
                <path
                  d="M 50 50 Q 50 40 60 40 Q 70 40 70 50 Q 70 60 60 60 Q 50 60 50 50"
                  fill="var(--pink-tuile-sun-425-moon-750)"
                  opacity="0.6"
                />
                <path
                  d="M 130 50 Q 130 40 140 40 Q 150 40 150 50 Q 150 60 140 60 Q 130 60 130 50"
                  fill="var(--pink-tuile-sun-425-moon-750)"
                  opacity="0.6"
                />
              </svg>
            </motion.div>
          </div>
          <div className="fr-col-12 fr-col-md-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="fr-text--lg" style={{ lineHeight: "1.8" }}>
                Contribcit s'adresse à tous les acteurs qui souhaitent renforcer
                la démocratie participative et améliorer le vivre ensemble dans
                les territoires. Que vous soyez une commune cherchant à mieux
                comprendre les besoins de vos habitants, un organisme financier
                souhaitant soutenir une cause qui vous tient à cœur, ou un
                citoyen désireux de faire entendre votre voix, Contribcit vous
                offre les outils pour agir.
              </p>
              <p className="fr-text--lg fr-mt-4w" style={{ lineHeight: "1.8" }}>
                Notre approche repose sur la simplicité, l'efficacité et la
                transparence. Nous croyons que chaque voix compte et que la
                technologie doit faciliter, et non compliquer, le dialogue entre
                les citoyens et leurs représentants.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Organismes financiers (fond jaune) */}
      <section
        style={{
          backgroundColor: "#ffb600",
          color: "#000091",
          position: "relative",
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
                <h2 className="fr-h2" style={{ color: "#000091" }}>
                  Vous êtes un organisme financier ?
                </h2>
                <p
                  className="fr-text--lg fr-mt-4w"
                  style={{ color: "#000091", lineHeight: "1.8" }}
                >
                  Vous souhaitez soutenir le projet pour une cause qui vous
                  parle ? Contribcit œuvre pour renforcer la démocratie
                  participative et améliorer le vivre ensemble dans les
                  territoires. Contactez-nous pour discuter de partenariats et
                  de soutiens.
                </p>
                <div className="fr-mt-6w">
                  <Button
                    iconId="fr-icon-mail-line"
                    onClick={scrollToContact}
                    priority="secondary"
                    style={{
                      backgroundColor: "#000091",
                      color: "white",
                    }}
                  >
                    Nous contacter
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Storytelling - Entre Organismes et Citoyens */}
      <section className="fr-container fr-py-8w fr-background-alt--grey">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div className="fr-col-12 fr-col-md-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="fr-h2">Rejoignez le mouvement</h2>
              <p className="fr-text--lg fr-mt-4w" style={{ lineHeight: "1.8" }}>
                Contribcit n'est pas qu'une solution technique, c'est un
                mouvement citoyen qui rassemble tous ceux qui croient en une
                démocratie plus participative et plus proche des citoyens.
                Chaque commune qui rejoint Contribcit, chaque organisme qui nous
                soutient, chaque citoyen qui partage notre vision, contribue à
                construire des villes plus agréables à vivre.
              </p>
              <p className="fr-text--lg fr-mt-4w" style={{ lineHeight: "1.8" }}>
                Ensemble, nous pouvons transformer la façon dont les citoyens et
                leurs représentants communiquent, collaborer pour améliorer la
                qualité de vie dans nos territoires, et redonner du sens à
                l'engagement citoyen. Votre voix compte, votre action aussi.
              </p>
            </motion.div>
          </div>
          <div className="fr-col-12 fr-col-md-4 fr-text--center fr-mt-4w fr-mt-md-0">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ maxWidth: "100%", height: "auto" }}
              >
                {/* Mouvement/Communauté - illustration simple */}
                <circle
                  cx="100"
                  cy="100"
                  r="60"
                  fill="var(--blue-france-sun-113-625)"
                  opacity="0.1"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="40"
                  fill="var(--blue-france-sun-113-625)"
                  opacity="0.2"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="20"
                  fill="var(--blue-france-sun-113-625)"
                  opacity="0.4"
                />
                {/* Petites personnes autour */}
                <circle
                  cx="70"
                  cy="70"
                  r="12"
                  fill="var(--blue-france-sun-113-625)"
                  opacity="0.6"
                />
                <circle
                  cx="130"
                  cy="70"
                  r="12"
                  fill="var(--blue-france-sun-113-625)"
                  opacity="0.6"
                />
                <circle
                  cx="70"
                  cy="130"
                  r="12"
                  fill="var(--blue-france-sun-113-625)"
                  opacity="0.6"
                />
                <circle
                  cx="130"
                  cy="130"
                  r="12"
                  fill="var(--blue-france-sun-113-625)"
                  opacity="0.6"
                />
                {/* Flèches vers le centre */}
                <path
                  d="M 82 82 L 88 88 M 88 82 L 82 88"
                  stroke="var(--blue-france-sun-113-625)"
                  strokeWidth="2"
                  opacity="0.5"
                />
                <path
                  d="M 118 82 L 112 88 M 112 82 L 118 88"
                  stroke="var(--blue-france-sun-113-625)"
                  strokeWidth="2"
                  opacity="0.5"
                />
                <path
                  d="M 82 118 L 88 112 M 88 118 L 82 112"
                  stroke="var(--blue-france-sun-113-625)"
                  strokeWidth="2"
                  opacity="0.5"
                />
                <path
                  d="M 118 118 L 112 112 M 112 118 L 118 112"
                  stroke="var(--blue-france-sun-113-625)"
                  strokeWidth="2"
                  opacity="0.5"
                />
              </svg>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Citoyens (fond rose) */}
      <section
        style={{
          backgroundColor: "#ce614a",
          color: "white",
          position: "relative",
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
                  Vous êtes citoyen ?
                </h2>
                <p
                  className="fr-text--lg fr-mt-4w"
                  style={{ color: "white", lineHeight: "1.8" }}
                >
                  Vous voulez en parler autour de vous ou à votre commune ?
                  Partagez Contribcit et aidez-nous à faire connaître cette
                  solution qui redonne la parole aux citoyens.
                </p>
                {shareSuccess && (
                  <Alert
                    severity="success"
                    title="Partagé !"
                    description={
                      typeof navigator.share === "function"
                        ? "Le contenu a été partagé avec succès."
                        : "Le texte a été copié dans votre presse-papier."
                    }
                    className="fr-mt-4w"
                    small
                  />
                )}
                {shareError && (
                  <Alert
                    severity="error"
                    title="Erreur"
                    description="Une erreur est survenue lors du partage. Veuillez réessayer."
                    className="fr-mt-4w"
                    small
                  />
                )}
                <div className="fr-mt-6w">
                  <Button
                    iconId="fr-icon-share-line"
                    onClick={handleShare}
                    style={{
                      backgroundColor: "var(--background-default-grey)",
                      color: "#ce614a",
                    }}
                  >
                    Partager
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
