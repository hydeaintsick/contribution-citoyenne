import type { Metadata } from "next";
import Link from "next/link";

const painPoints = [
  {
    title: "Citoyens & touristes",
    description:
      "Ils ne savent pas où s'adresser, les retours se perdent entre les services et aucune expérience unifiée n'existe d'une commune à l'autre.",
    icon: "fr-icon-chat-3-line",
  },
  {
    title: "Collectivités",
    description:
      "Les canaux sont morcelés, les retours sont difficiles à prioriser et les équipes manquent d'indicateurs consolidés pour décider.",
    icon: "fr-icon-organization-line",
  },
  {
    title: "État",
    description:
      "Aucun baromètre qualitatif homogène des territoires pour anticiper les signaux faibles et piloter les politiques publiques.",
    icon: "fr-icon-government-line",
  },
];

const opportunityTimeline = [
  {
    period: "2025",
    title: "Loi Engagement & Proximité",
    detail:
      "Renforce l'obligation de participation citoyenne et de transparence locale.",
  },
  {
    period: "2026",
    title: "Plan France Nation Verte",
    detail: "Suivi d'indicateurs de transition écologique à l'échelle locale.",
  },
  {
    period: "2027",
    title: "Préparation Jeux Olympiques 2030",
    detail:
      "Besoin de capteurs temps réel sur la satisfaction usagers & touristes.",
  },
  {
    period: "2030",
    title: "Participation généralisée",
    detail:
      "Les collectivités doivent prouver leur impact auprès des citoyens.",
  },
];

const roadmap = [
  {
    phase: "M1 : Pré-cadrage",
    objectives: [
      "Pitch exécutif auprès du sponsor DGCL / ANCT",
      "Collecte des métriques MVP et formalisation fiche problème",
      "Préparation kit appel à intrapreneurs",
    ],
  },
  {
    phase: "M2 : Investigation",
    objectives: [
      "Immersions terrain dans 3 communes pilotes",
      "Prototypage tunnel nationalisable & tests utilisateurs",
      "Cadrage analytics macro pour l'État",
    ],
  },
  {
    phase: "M3 : Décision",
    objectives: [
      "Livraison rapport investigation & business case",
      "Plan de construction (20 communes, dashboards, API)",
      "Signature Memorandum of Understanding",
    ],
  },
];

const budgets = [
  {
    phase: "Investigation (0-6 mois)",
    amount: "~100 k€ TTC",
    resources:
      "Intrapreneur 60 %, coach beta.gouv, équipe Contribcit (produit/UX/data)",
    funding: "Budget sponsor ministériel",
  },
  {
    phase: "Construction (6-18 mois)",
    amount: "~200 k€ TTC",
    resources: "4-5 ETP (PO, dev front/back, designer, data, déploiement)",
    funding: "Sponsor + ANCT / Banque des Territoires",
  },
  {
    phase: "Accélération (18-36 mois)",
    amount: "~250-300 k€ TTC",
    resources: "Équipe support national, infra SecNumCloud, animation réseau",
    funding: "Cofinancements État + collectivités",
  },
];

const successFactors = [
  "Sponsor de rang Directeur d'administration centrale (DGCL/ANCT) et intrapreneur libéré à 60 %.",
  "Accès réseau collectivités (préfectures, DGS, réseaux touristiques).",
  "Infrastructure souveraine conforme SecNumCloud et trajectoire RGPD by design.",
  "Comité de revue à 3 et 6 mois, piloté sur indicateurs d'impact.",
];

const nextSteps = [
  "Réunion sponsor DGCL sous 10 jours et validation lettre d'intention.",
  "Sélection de trois communes pilotes (ville-centre, destination touristique, territoire rural).",
  "Lancement appel à intrapreneurs interne et préparation pitch day.",
  "Atelier de cadrage investigation : objectifs, métriques, risques partagés.",
];

export const metadata: Metadata = {
  title: "Pitch beta.gouv.fr - Contribcit",
  description:
    "Présentation du projet Contribcit pour le programme beta.gouv.fr : vision, impact, plan de déploiement et besoins.",
};

export default function PitchPage() {
  return (
    <main className="fr-py-9w fr-background-alt--grey">
      <section className="fr-container fr-pb-8w">
        <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-lg-8">
            <span className="fr-badge fr-badge--yellow-tournesol fr-text--md fr-mb-3w">
              Candidature Startup d'État – beta.gouv.fr
            </span>
            <h1 className="fr-display--lg fr-mb-3w">
              Contribcit, la voix des territoires
            </h1>
            <p className="fr-text--lead fr-mb-4w">
              Nous unifions les retours citoyens, touristiques et associatifs
              pour donner aux collectivités et à l'État un baromètre temps réel
              du terrain.
            </p>
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-6">
                <div className="fr-callout">
                  <h3 className="fr-callout__title">MVP validé</h3>
                  <p className="fr-callout__text">
                    1 200 contributions captées sur 6 territoires tests, 82 % de
                    taux de complétion, 4,6/5 de satisfaction.
                  </p>
                </div>
              </div>
              <div className="fr-col-12 fr-col-md-6">
                <div className="fr-callout">
                  <h3 className="fr-callout__title">Ambition nationale</h3>
                  <p className="fr-callout__text">
                    Centraliser les ressentis terrain de l'ensemble des
                    collectivités françaises pour éclairer l'action publique.
                  </p>
                </div>
              </div>
            </div>
            <div className="fr-btns-group fr-btns-group--inline-reverse fr-mt-5w">
              <Link className="fr-btn" href="mailto:contact@contribcit.fr">
                Planifier une présentation
              </Link>
              <Link className="fr-btn fr-btn--secondary" href="#vision">
                Explorer la vision
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="vision" className="fr-py-8w fr-background-default--grey">
        <div className="fr-container">
          <h2 className="fr-display--sm fr-mb-3w">Pourquoi maintenant ?</h2>
          <p className="fr-text--lg fr-mb-6w">
            Contribcit répond à une triple urgence : rendre simple la prise de
            parole citoyenne, outiller les collectivités dans leur priorisation
            et offrir à l'État un observatoire qualitatif consolidé du
            territoire.
          </p>
          <div className="fr-grid-row fr-grid-row--gutters">
            {painPoints.map((item) => (
              <div key={item.title} className="fr-col-12 fr-col-lg-4">
                <div className="fr-tile fr-enlarge-link">
                  <div className="fr-tile__body">
                    <span
                      className="fr-icon"
                      aria-hidden="true"
                      data-fr-icon={item.icon}
                    />
                    <h3 className="fr-tile__title">{item.title}</h3>
                    <p className="fr-tile__desc">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fr-py-8w">
        <div className="fr-container">
          <div className="fr-grid-row fr-grid-row--middle">
            <div className="fr-col-12 fr-col-lg-4 fr-mb-4w-sm fr-mb-0">
              <h2 className="fr-h2 fr-mb-3w">Une fenêtre d'opportunité</h2>
              <p>
                Les politiques publiques exigent désormais des preuves d'impact
                tangibles. Contribcit propose un capteur terrain fiable et
                actionnable pour accompagner cette transformation.
              </p>
            </div>
            <div className="fr-col-12 fr-col-lg-8">
              <div className="fr-timeline">
                <div className="fr-timeline__container">
                  {opportunityTimeline.map((step) => (
                    <div key={step.period} className="fr-timeline__item">
                      <div className="fr-timeline__item-title">
                        {step.period}
                      </div>
                      <div className="fr-timeline__item-description">
                        <h3 className="fr-h4 fr-mb-1w">{step.title}</h3>
                        <p className="fr-text--sm">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fr-py-8w fr-background-alt--grey">
        <div className="fr-container">
          <h2 className="fr-display--sm fr-mb-4w">La solution Contribcit</h2>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-lg-4">
              <div className="fr-card fr-card--horizontal fr-card--icon-left">
                <div className="fr-card__body">
                  <div className="fr-card__content">
                    <h3 className="fr-card__title">Tunnel citoyen simplifié</h3>
                    <p className="fr-card__desc">
                      Recherche de la commune, formulaire conversationnel, suivi
                      des retours et anonymat respecté.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="fr-col-12 fr-col-lg-4">
              <div className="fr-card fr-card--horizontal fr-card--icon-left">
                <div className="fr-card__body">
                  <div className="fr-card__content">
                    <h3 className="fr-card__title">
                      Tableau de bord collectivités
                    </h3>
                    <p className="fr-card__desc">
                      Cartographie dynamique, priorisation automatique,
                      intégration avec les outils métiers existants.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="fr-col-12 fr-col-lg-4">
              <div className="fr-card fr-card--horizontal fr-card--icon-left">
                <div className="fr-card__body">
                  <div className="fr-card__content">
                    <h3 className="fr-card__title">Vue macro État</h3>
                    <p className="fr-card__desc">
                      Agrégation nationale anonymisée, détection de signaux
                      faibles, open data pour éclairer l'action publique.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="fr-grid-row fr-grid-row--gutters fr-mt-6w">
            <div className="fr-col-12 fr-col-lg-6">
              <div className="fr-content-media">
                <div className="fr-content-media__img fr-ratio-16x9 fr-background-alt--blue-france">
                  <div className="fr-content-media__img-placeholder">
                    <p className="fr-text--lg fr-text--bold">
                      Storyboard utilisateur
                    </p>
                    <p>Scanner • Signaler • Suivre</p>
                  </div>
                </div>
                <div className="fr-content-media__body">
                  <h3 className="fr-h4">Expérience QR code</h3>
                  <p>
                    QR codes déployés dans l'espace public (abribus, mairie,
                    commerces). Tunnel responsive en moins de 2 minutes.
                  </p>
                </div>
              </div>
            </div>
            <div className="fr-col-12 fr-col-lg-6">
              <div className="fr-content-media">
                <div className="fr-content-media__img fr-ratio-16x9 fr-background-alt--pink-tuile">
                  <div className="fr-content-media__img-placeholder">
                    <p className="fr-text--lg fr-text--bold">
                      Dashboard collectivité
                    </p>
                    <p>Carte • Volume • Tendances</p>
                  </div>
                </div>
                <div className="fr-content-media__body">
                  <h3 className="fr-h4">Pilotage intelligent</h3>
                  <p>
                    Visualisation par quartier et thématique, SLA de traitement,
                    exports et API pour alimenter les outils métiers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fr-py-8w">
        <div className="fr-container">
          <h2 className="fr-display--sm fr-mb-5w">Impact mesuré</h2>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-md-4">
              <div className="fr-card fr-card--no-border fr-card--shadow">
                <div className="fr-card__body">
                  <p className="fr-badge fr-badge--success fr-mb-3w">82 %</p>
                  <h3 className="fr-card__title">Taux de complétion</h3>
                  <p className="fr-card__desc">
                    contre 45 % pour un formulaire classique.
                  </p>
                </div>
              </div>
            </div>
            <div className="fr-col-12 fr-col-md-4">
              <div className="fr-card fr-card--no-border fr-card--shadow">
                <div className="fr-card__body">
                  <p className="fr-badge fr-badge--info fr-mb-3w">1 200</p>
                  <h3 className="fr-card__title">Retours terrain</h3>
                  <p className="fr-card__desc">
                    collectés sur 6 territoires pilotes en 3 mois.
                  </p>
                </div>
              </div>
            </div>
            <div className="fr-col-12 fr-col-md-4">
              <div className="fr-card fr-card--no-border fr-card--shadow">
                <div className="fr-card__body">
                  <p className="fr-badge fr-badge--new fr-mb-3w">+34</p>
                  <h3 className="fr-card__title">NPS utilisateurs</h3>
                  <p className="fr-card__desc">Satisfaction moyenne 4,6 / 5.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="fr-alert fr-alert--success fr-mt-6w">
            <h3 className="fr-alert__title">
              Décisions prises grâce à Contribcit
            </h3>
            <ul className="fr-pl-3w fr-mb-0">
              <li>Réaménagement de zones piétonnes et apaisement trafic.</li>
              <li>Programme propreté renforcé sur quartiers identifiés.</li>
              <li>
                Optimisation parcours visiteur pour une station touristique.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="fr-py-8w fr-background-alt--grey">
        <div className="fr-container">
          <h2 className="fr-display--sm fr-mb-4w">Programme beta.gouv.fr</h2>
          <div className="fr-grid-row fr-grid-row--gutters">
            {roadmap.map((step) => (
              <div key={step.phase} className="fr-col-12 fr-col-lg-4">
                <div className="fr-card fr-card--shadow">
                  <div className="fr-card__body">
                    <h3 className="fr-card__title">{step.phase}</h3>
                    <ul className="fr-pl-3w">
                      {step.objectives.map((objective) => (
                        <li key={objective}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fr-py-8w">
        <div className="fr-container">
          <h2 className="fr-display--sm fr-mb-5w">Budget & ressources</h2>
          <div className="fr-table fr-table--layout-fixed">
            <table>
              <thead>
                <tr>
                  <th scope="col">Phase</th>
                  <th scope="col">Budget estimé</th>
                  <th scope="col">Ressources clés</th>
                  <th scope="col">Financement</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => (
                  <tr key={budget.phase}>
                    <th scope="row">{budget.phase}</th>
                    <td>{budget.amount}</td>
                    <td>{budget.resources}</td>
                    <td>{budget.funding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="fr-py-8w fr-background-alt--grey">
        <div className="fr-container">
          <h2 className="fr-display--sm fr-mb-4w">Conditions de succès</h2>
          <div className="fr-grid-row fr-grid-row--gutters">
            {successFactors.map((factor) => (
              <div key={factor} className="fr-col-12 fr-col-lg-6">
                <div className="fr-alert fr-alert--info fr-alert--sm">
                  <p className="fr-alert__text">{factor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fr-py-8w">
        <div className="fr-container">
          <h2 className="fr-display--sm fr-mb-4w">Prochaines étapes</h2>
          <div className="fr-grid-row fr-grid-row--gutters">
            {nextSteps.map((step, index) => (
              <div key={step} className="fr-col-12 fr-col-md-6 fr-col-lg-3">
                <div className="fr-card fr-card--shadow">
                  <div className="fr-card__body">
                    <p className="fr-badge fr-badge--info fr-mb-3w">
                      Étape {index + 1}
                    </p>
                    <p className="fr-card__desc">{step}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fr-py-8w fr-background-alt--blue-france">
        <div className="fr-container">
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-12 fr-col-lg-8 fr-text--center fr-text-invert">
              <h2 className="fr-display--sm fr-mb-3w">Une équipe engagée</h2>
              <p className="fr-text--lg fr-mb-4w">
                Contribcit est portée par un duo fondateur expérimenté
                accompagné d'un cercle d'experts territoriaux.
              </p>
              <div className="fr-grid-row fr-grid-row--gutters fr-mb-5w">
                <div className="fr-col-12 fr-col-md-6">
                  <div className="fr-card fr-card--horizontal fr-card--no-border fr-card--shadow fr-card--inverted">
                    <div className="fr-card__body">
                      <h3 className="fr-card__title">Sébastien Imbert</h3>
                      <p className="fr-card__desc">
                        Fondateur & CTO - 10 ans d'innovation publique
                      </p>
                    </div>
                  </div>
                </div>
                <div className="fr-col-12 fr-col-md-6">
                  <div className="fr-card fr-card--horizontal fr-card--no-border fr-card--shadow fr-card--inverted">
                    <div className="fr-card__body">
                      <h3 className="fr-card__title">Victor Mahé</h3>
                      <p className="fr-card__desc">
                        Partenariats collectivités & ministères
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="fr-text--sm fr-mb-4w">
                Advisory board en constitution : DGS de villes moyennes, experts
                tourisme durable, représentants associatifs.
              </p>
              <div className="fr-btns-group fr-btns-group--inline fr-btns-group--center">
                <Link
                  className="fr-btn fr-btn--inverted"
                  href="mailto:contact@contribcit.fr"
                >
                  Échanger avec l'équipe
                </Link>
                <Link
                  className="fr-btn fr-btn--secondary"
                  href="/docs/business/beta-gouv-pitch-deck.md"
                >
                  Consulter la note détaillée
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
