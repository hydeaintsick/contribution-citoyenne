"use client";

import { Hero } from "@/components/Hero";
import { CitizenStats } from "@/components/CitizenStats";
import { Feature } from "@/components/Feature";
import { Motto } from "@/components/Motto";
import { HowItWorks } from "@/components/HowItWorks";
import { Kpis } from "@/components/Kpis";
import { MapTeaser } from "@/components/MapTeaser";
import { QrDemo } from "@/components/QrDemo";
import { Testimonials } from "@/components/Testimonials";
import { Faq } from "@/components/Faq";
import { ContactCta } from "@/components/ContactCta";
import { Button } from "@codegouvfr/react-dsfr/Button";

const features = [
  {
    title: "QR codes partout, retours immédiats",
    description:
      "Déployez des QR codes sur l'espace public : abribus, médiathèques, mairies annexes…",
    iconId: "fr-icon-code-s-slash-line",
  },
  {
    title: "Tunnel clair : alerter ou suggérer",
    description:
      "Un parcours court, une photo optionnelle et la géolocalisation.",
    iconId: "fr-icon-feedback-line",
  },
  {
    title: "Tableau de bord pour la mairie",
    description:
      "Suivi des retours, cartographie, statistiques, réponses email.",
    iconId: "fr-icon-line-chart-line",
  },
  {
    title: "Catégories configurables",
    description:
      "Adaptez transports, voirie, espaces publics… à votre contexte.",
    iconId: "fr-icon-settings-5-line",
  },
  {
    title: "Sécurité & RGPD",
    description: "Consentement explicite, rétention limitée, audit basique.",
    iconId: "fr-icon-shield-line",
  },
  {
    title: "Déploiement rapide",
    description: "Pack de QR codes (A4/A6) prêt à imprimer.",
    iconId: "fr-icon-printer-line",
  },
];

const kpis = [
  {
    value: "80%",
    label: "des retours géolocalisés",
    description: "Précision maximale pour le traitement",
  },
  {
    value: "< 2 min",
    label: "pour soumettre un retour",
    description: "Tunnel optimisé pour l'utilisateur",
  },
  {
    value: "30%",
    label: "de temps gagné",
    description: "sur l'orientation des équipes",
  },
];

const testimonials = [
  {
    name: "Marie Dupont",
    function: "Maire",
    commune: "Ville de 15 000 habitants",
    text: "Contribcit nous a permis de mieux comprendre les besoins de nos habitants. Les retours sont clairs, géolocalisés et faciles à traiter.",
  },
  {
    name: "Jean Martin",
    function: "Directeur Général des Services",
    commune: "Communauté de communes",
    text: "L'outil est simple à déployer et les équipes l'ont adopté rapidement. La cartographie nous aide à prioriser les interventions.",
  },
  {
    name: "Sophie Bernard",
    function: "Responsable tranquillité publique",
    commune: "Métropole",
    text: "Les alertes remontent en temps réel et nous permettent d'agir rapidement. Un vrai plus pour la sécurité de nos concitoyens.",
  },
];

const scrollToContact = () => {
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
};

const faqItems = [
  {
    question: "Comment déployez-vous les QR codes ?",
    answer: (
      <>
        <p>
          Le déploiement de nos QR codes est conçu pour être d'une simplicité et
          d'une flexibilité maximales, s'adaptant parfaitement à vos besoins
          spécifiques. Une fois votre compte configuré et vos points d'intérêt
          définis sur notre plateforme intuitive, vous pouvez générer
          instantanément les QR codes correspondants.
        </p>
        <p>
          Ces codes peuvent être imprimés sur divers supports physiques
          (panneaux, affiches, autocollants) pour être apposés dans l'espace
          public, ou intégrés numériquement sur vos sites web, applications
          mobiles ou communications électroniques. Notre système vous permet de
          gérer et de suivre l'efficacité de chaque QR code en temps réel,
          assurant une mise en place rapide et une gestion sans effort.
        </p>
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-default-grey)",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>
            <strong>
              Vous souhaitez en savoir plus sur la mise en œuvre concrète dans
              votre collectivité ?
            </strong>{" "}
            Nos experts sont à votre disposition pour vous guider pas à pas et
            vous accompagner dans le déploiement optimal de notre solution.
          </p>
          <Button iconId="fr-icon-mail-line" onClick={scrollToContact}>
            Se faire contacter
          </Button>
        </div>
      </>
    ),
  },
  {
    question: "Le citoyen doit-il s'identifier ?",
    answer: (
      <>
        <p>
          Non, l'anonymat est une pierre angulaire de notre approche pour
          encourager une participation maximale et sans entrave. Les citoyens
          peuvent soumettre leurs retours (suggestions ou alertes) de manière
          entièrement anonyme, sans avoir à créer de compte ni à fournir
          d'informations personnelles.
        </p>
        <p>
          Cette liberté garantit que chacun se sente à l'aise de s'exprimer
          librement. Si un citoyen souhaite être recontacté pour un suivi ou
          pour apporter des précisions, il a la possibilité, mais non
          l'obligation, de laisser ses coordonnées. Dans ce cas, toutes les
          données sont traitées avec la plus grande confidentialité et en
          stricte conformité avec les réglementations en vigueur.
        </p>
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-default-grey)",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>
            <strong>La confiance de vos citoyens est notre priorité.</strong>{" "}
            Découvrez comment nous protégeons leurs données et encourageons leur
            engagement dans un cadre sécurisé et respectueux de leur vie privée.
          </p>
          <Button iconId="fr-icon-mail-line" onClick={scrollToContact}>
            Se faire contacter
          </Button>
        </div>
      </>
    ),
  },
  {
    question: "Comment se fait la cartographie ?",
    answer: (
      <>
        <p>
          La cartographie des retours est un outil puissant pour visualiser et
          comprendre les dynamiques territoriales de votre commune. Chaque
          retour citoyen est automatiquement géolocalisé grâce au QR code scanné
          ou via une saisie manuelle précise par l'utilisateur.
        </p>
        <p>
          Ces données sont ensuite agrégées et présentées sur une carte
          interactive de votre territoire, où vous pouvez identifier en un coup
          d'œil les zones à forte concentration de suggestions ou d'alertes.
          Cette visualisation claire vous permet de repérer les tendances
          émergentes, de prioriser les interventions et d'allouer vos ressources
          de manière plus stratégique et efficace.
        </p>
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-default-grey)",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>
            <strong>
              Visualisez l'impact de chaque retour citoyen sur votre territoire.
            </strong>{" "}
            Laissez-nous vous montrer comment notre cartographie peut
            transformer votre prise de décision et améliorer la réactivité de
            vos services.
          </p>
          <Button iconId="fr-icon-mail-line" onClick={scrollToContact}>
            Se faire contacter
          </Button>
        </div>
      </>
    ),
  },
  {
    question: "Et la conformité RGPD ?",
    answer: (
      <>
        <p>
          La conformité au Règlement Général sur la Protection des Données
          (RGPD) est au cœur de notre solution. Nous nous engageons à respecter
          scrupuleusement les principes de protection des données dès la
          conception. Par défaut, les retours sont anonymes, minimisant ainsi la
          collecte de données personnelles.
        </p>
        <p>
          Lorsque des données sont collectées (par exemple, si un citoyen
          choisit de laisser ses coordonnées), elles sont chiffrées, stockées
          sur des serveurs sécurisés en France, et traitées avec le consentement
          explicite de l'utilisateur. Nous mettons en œuvre des mesures
          techniques et organisationnelles robustes pour garantir la
          confidentialité, l'intégrité et la disponibilité des données, et nous
          vous fournissons tous les outils nécessaires pour assurer votre propre
          conformité.
        </p>
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-default-grey)",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>
            <strong>
              La sécurité et la confidentialité des données sont non
              négociables.
            </strong>{" "}
            Contactez-nous pour une présentation détaillée de nos engagements
            RGPD et de nos certifications de sécurité.
          </p>
          <Button iconId="fr-icon-mail-line" onClick={scrollToContact}>
            Se faire contacter
          </Button>
        </div>
      </>
    ),
  },
  {
    question: "Quel est le coût ?",
    answer: (
      <>
        <p>
          Nous proposons une approche tarifaire flexible et transparente, conçue
          pour s'adapter à la taille et aux besoins spécifiques de chaque
          collectivité. Le coût de notre solution dépend de plusieurs facteurs,
          tels que l'étendue du déploiement (nombre de QR codes, zones
          couvertes), les fonctionnalités additionnelles souhaitées
          (intégrations spécifiques, modules personnalisés) et le niveau de
          support.
        </p>
        <p>
          Nous croyons en une solution juste et accessible, offrant un excellent
          rapport qualité-prix pour un investissement qui génère un retour
          significatif en termes d'amélioration de la qualité de vie et de
          l'engagement citoyen. Nos tarifs sont adaptés aux budgets des
          collectivités, quelle que soit leur taille.
        </p>
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-default-grey)",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>
            <strong>Chaque collectivité est unique.</strong> Obtenez une
            estimation personnalisée et découvrez la valeur ajoutée de notre
            solution pour votre budget. Nous vous proposerons un devis sur
            mesure adapté à vos besoins réels.
          </p>
          <Button iconId="fr-icon-mail-line" onClick={scrollToContact}>
            Se faire contacter
          </Button>
        </div>
      </>
    ),
  },
  {
    question: "Peut-on personnaliser les catégories ?",
    answer: (
      <>
        <p>
          Absolument ! La personnalisation des catégories est une fonctionnalité
          clé de notre plateforme, vous permettant d'adapter l'outil précisément
          aux enjeux et aux spécificités de votre territoire. Vous pouvez
          définir vos propres catégories de suggestions et d'alertes (ex:
          propreté, voirie, éclairage public, accessibilité, sécurité,
          environnement, etc.), ainsi que les sous-catégories associées.
        </p>
        <p>
          Cette flexibilité garantit que les retours citoyens sont classifiés de
          manière pertinente pour vos services, facilitant ainsi l'analyse, le
          traitement et la remontée d'informations aux équipes concernées. Vous
          pouvez modifier ces catégories à tout moment selon l'évolution de vos
          besoins et des priorités de votre collectivité.
        </p>
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-default-grey)",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>
            <strong>Adaptez notre solution à votre réalité locale.</strong>{" "}
            Discutons de vos besoins spécifiques en matière de catégorisation
            des retours et découvrez comment personnaliser l'outil pour qu'il
            réponde parfaitement à vos enjeux.
          </p>
          <Button iconId="fr-icon-mail-line" onClick={scrollToContact}>
            Se faire contacter
          </Button>
        </div>
      </>
    ),
  },
  {
    question: "Combien de temps pour le déploiement ?",
    answer: (
      <>
        <p>
          Le déploiement initial de notre solution est remarquablement rapide.
          En quelques jours seulement, vous pouvez avoir votre plateforme
          configurée, vos premiers QR codes générés et prêts à être mis en
          place. Le temps total de déploiement dépendra ensuite de l'ampleur de
          votre projet et de la stratégie de communication que vous souhaitez
          adopter pour informer vos citoyens.
        </p>
        <p>
          Nous vous accompagnons à chaque étape, de la configuration technique à
          la stratégie de lancement, pour assurer une mise en œuvre fluide et
          efficace, minimisant les délais et maximisant l'impact. La plupart de
          nos clients sont opérationnels en moins de deux semaines après la
          signature du contrat.
        </p>
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-default-grey)",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>
            <strong>Prêt à lancer votre projet rapidement ?</strong>{" "}
            Contactez-nous pour planifier un déploiement sur mesure et sans
            délai. Nous vous proposerons un calendrier adapté à vos contraintes.
          </p>
          <Button iconId="fr-icon-mail-line" onClick={scrollToContact}>
            Se faire contacter
          </Button>
        </div>
      </>
    ),
  },
  {
    question: "Y a-t-il une formation pour les équipes ?",
    answer: (
      <>
        <p>
          Oui, une formation complète et personnalisée est systématiquement
          proposée à vos équipes pour garantir une prise en main optimale de la
          plateforme. Nos sessions de formation couvrent tous les aspects de
          l'utilisation de l'outil : de la gestion des QR codes à l'analyse des
          données cartographiques, en passant par le traitement des retours et
          la communication avec les citoyens.
        </p>
        <p>
          L'objectif est de rendre vos équipes autonomes et efficaces, leur
          permettant de tirer pleinement parti de toutes les fonctionnalités de
          la solution pour améliorer la gestion de votre collectivité. Nous
          proposons également un support continu et des sessions de formation
          complémentaires si nécessaire, pour s'assurer que vos équipes restent
          à jour avec les évolutions de la plateforme.
        </p>
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border-default-grey)",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>
            <strong>Donnez à vos équipes les moyens de réussir.</strong>{" "}
            Découvrez nos programmes de formation adaptés à leurs besoins et à
            leur niveau, pour une adoption rapide et efficace de notre solution.
          </p>
          <Button iconId="fr-icon-mail-line" onClick={scrollToContact}>
            Se faire contacter
          </Button>
        </div>
      </>
    ),
  },
];

export default function Home() {
  return (
    <main>
      <Hero />
      <CitizenStats />
      <section className="fr-container fr-py-8w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12">
            <h2 className="fr-h2 fr-text--center">Fonctionnalités</h2>
            <p className="fr-text--lg fr-text--center fr-mt-2w">
              Tout ce dont vous avez besoin pour faciliter la contribution
              citoyenne
            </p>
          </div>
        </div>
        <div className="fr-grid-row fr-grid-row--gutters fr-mt-6w">
          {features.map((feature, index) => (
            <div key={index} className="fr-col-12 fr-col-md-6 fr-col-lg-4">
              <Feature
                title={feature.title}
                description={feature.description}
                iconId={feature.iconId}
              />
            </div>
          ))}
        </div>
      </section>
      <Motto />
      <HowItWorks />
      <Kpis kpis={kpis} />
      <MapTeaser />
      <QrDemo />
      {/* Section commentée - Ils nous font confiance */}
      {/* <Testimonials testimonials={testimonials} /> */}
      <Faq items={faqItems} />
      <ContactCta />
    </main>
  );
}
