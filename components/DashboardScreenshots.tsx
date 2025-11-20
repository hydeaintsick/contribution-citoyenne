"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface MacBookFrameProps {
  src: string;
  alt: string;
  title: string;
  description: string;
  priority?: boolean;
}

function MacBookFrame({ src, alt, title, description, priority = false }: MacBookFrameProps) {
  return (
    <div className="contribcit-macbook-frame">
      <div className="contribcit-macbook-frame__base">
        <div className="contribcit-macbook-frame__container">
          {/* Barre de menu macOS */}
          <div className="contribcit-macbook-frame__menu-bar">
            <div className="contribcit-macbook-frame__menu-buttons">
              <span className="contribcit-macbook-frame__menu-button contribcit-macbook-frame__menu-button--red" />
              <span className="contribcit-macbook-frame__menu-button contribcit-macbook-frame__menu-button--yellow" />
              <span className="contribcit-macbook-frame__menu-button contribcit-macbook-frame__menu-button--green" />
            </div>
          </div>
          {/* Contenu de l'écran */}
          <div className="contribcit-macbook-frame__screen">
            <div className="contribcit-macbook-frame__screen-inner">
              <Image
                src={src}
                alt={alt}
                fill
                priority={priority}
                className="contribcit-macbook-frame__image"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 45vw"
              />
            </div>
          </div>
        </div>
        {/* Base du MacBook */}
        <div className="contribcit-macbook-frame__bottom">
          <div className="contribcit-macbook-frame__hinge" />
        </div>
      </div>
      {/* Sous-titre explicatif */}
      <div className="contribcit-macbook-frame__caption">
        <h3 className="fr-h4 fr-mt-4w fr-mb-2w">{title}</h3>
        <p className="fr-text--md">{description}</p>
      </div>
    </div>
  );
}

export function DashboardScreenshots() {
  return (
    <section className="fr-container fr-py-8w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12">
          <h2 className="fr-h2 fr-text--center">Tableau de bord pour les communes</h2>
          <p className="fr-text--lg fr-text--center fr-mt-2w">
            Gérez facilement les retours citoyens avec une interface claire et intuitive
          </p>
        </div>
      </div>

      <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-mt-6w">
        {/* Screenshot du dashboard */}
        <motion.div
          className="fr-col-12 fr-col-md-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <MacBookFrame
            src="/screenshots/dashboard.webp"
            alt="Vue d'ensemble du tableau de bord Contribcit montrant les statistiques et la gestion des retours"
            title="Vue d'ensemble et statistiques"
            description="Visualisez en un coup d'œil l'activité de votre commune : nombre de retours, répartition par catégories, évolution dans le temps. Tous les indicateurs clés sont accessibles depuis cette vue centrale."
            priority={true}
          />
        </motion.div>

        {/* Screenshot de la contribution */}
        <motion.div
          className="fr-col-12 fr-col-md-6 fr-mt-4w fr-mt-md-0"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MacBookFrame
            src="/screenshots/contrib.webp"
            alt="Détail d'une contribution citoyenne dans le tableau de bord Contribcit"
            title="Gestion détaillée des contributions"
            description="Consultez chaque retour citoyen avec toutes ses informations : localisation précise sur la carte, photos, catégorie, description. Répondez directement aux citoyens et suivez le traitement de chaque demande."
          />
        </motion.div>
      </div>

      {/* Section gratuité et démarche citoyenne */}
      <motion.div
        className="fr-grid-row fr-grid-row--center fr-mt-8w"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="fr-col-12 fr-col-md-10 fr-col-lg-8">
          <div className="fr-callout fr-callout--blue-ecume fr-callout--bubble">
            <p className="fr-callout__text">
              <strong>Contribcit est entièrement gratuit</strong> pour les communes et les citoyens. 
              Nous croyons que la participation citoyenne ne doit pas être un frein financier. 
              Notre démarche est citoyenne : nous développons cet outil pour renforcer le lien 
              entre les collectivités et leurs habitants, sans barrière économique. 
              <br />
              <br />
              Que vous soyez une petite commune ou une grande métropole, bénéficiez de toutes 
              les fonctionnalités sans engagement financier. C'est notre contribution à une 
              démocratie plus participative et accessible à tous.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

