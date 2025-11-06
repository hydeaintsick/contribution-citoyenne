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

const features = [
  {
    title: "QR codes partout, retours immédiats",
    description:
      "Déployez des QR codes sur l'espace public : abribus, médiathèques, mairies annexes…",
    iconId: "fr-icon-qr-code-line",
  },
  {
    title: "Tunnel clair : alerter ou suggérer",
    description:
      "Un parcours court, une photo optionnelle et la géolocalisation.",
    iconId: "fr-icon-route-line",
  },
  {
    title: "Tableau de bord pour la mairie",
    description:
      "Suivi des retours, cartographie, statistiques, réponses email.",
    iconId: "fr-icon-dashboard-line",
  },
  {
    title: "Catégories configurables",
    description:
      "Adaptez transports, voirie, espaces publics… à votre contexte.",
    iconId: "fr-icon-settings-line",
  },
  {
    title: "Sécurité & RGPD",
    description:
      "Consentement explicite, rétention limitée, audit basique.",
    iconId: "fr-icon-shield-check-line",
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

const faqItems = [
  {
    question: "Comment déployez-vous les QR codes ?",
    answer:
      "Nous fournissons un pack de QR codes prêts à imprimer (formats A4 et A6) que vous pouvez déployer sur l'espace public : abribus, médiathèques, mairies annexes, panneaux d'affichage, etc. Chaque QR code est unique et lié à votre commune.",
  },
  {
    question: "Le citoyen doit-il s'identifier ?",
    answer:
      "Non, le citoyen n'a pas besoin de créer de compte. Il scanne simplement le QR code, choisit d'alerter ou de suggérer, remplit un formulaire court et peut ajouter une photo et sa géolocalisation. Le processus est anonyme par défaut.",
  },
  {
    question: "Comment se fait la cartographie ?",
    answer:
      "La géolocalisation est automatique si le citoyen l'autorise. Les retours apparaissent sur une carte interactive dans votre tableau de bord, avec des points rouges pour les alertes et bleus pour les suggestions.",
  },
  {
    question: "Et la conformité RGPD ?",
    answer:
      "Contribcit est conforme RGPD. Nous demandons un consentement explicite pour le traitement des données, limitons la rétention des données et effectuons des audits réguliers. Les données sont hébergées en France.",
  },
  {
    question: "Quel est le coût ?",
    answer:
      "Contactez-nous pour obtenir un devis personnalisé selon la taille de votre commune et vos besoins. Nous proposons des tarifs adaptés aux collectivités.",
  },
  {
    question: "Peut-on personnaliser les catégories ?",
    answer:
      "Oui, vous pouvez configurer les catégories selon votre contexte : transports, voirie, espaces publics, sécurité, environnement, etc. Nous vous accompagnons dans la configuration initiale.",
  },
  {
    question: "Combien de temps pour le déploiement ?",
    answer:
      "Le déploiement est rapide : configuration de votre compte en quelques jours, impression des QR codes, et déploiement sur le terrain. Vous pouvez être opérationnel en moins de 2 semaines.",
  },
  {
    question: "Y a-t-il une formation pour les équipes ?",
    answer:
      "Oui, nous proposons une formation pour vos équipes sur l'utilisation du tableau de bord, la gestion des retours et la cartographie. Un support est également disponible.",
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
              Tout ce dont vous avez besoin pour faciliter la contribution citoyenne
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
      <Testimonials testimonials={testimonials} />
      <Faq items={faqItems} />
      <ContactCta />
    </main>
  );
}
