"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";

export default function ConfidentialitePage() {
  return (
    <main className="fr-container fr-py-8w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-10">
          <h1 className="fr-h1">Politique de confidentialité</h1>
          <p className="fr-text--lg fr-mt-2w">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
          </p>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">1. Collecte des données</h2>
            <p className="fr-text">
              Contribcit collecte des données personnelles dans deux situations principales :
            </p>
            <ul className="fr-text">
              <li>
                <strong>Formulaire de contact</strong> : nom, adresse email professionnelle,
                fonction, commune et message transmis via notre site.
              </li>
              <li>
                <strong>Retours citoyens</strong> : contenu du message, type de retour (alerte ou
                suggestion), photo ou document transmis, géolocalisation, catégorie choisie, QR
                code ou lien utilisé (annuaire Contribcit, lien partagé par la commune ou QR code
                affiché sur le terrain) et, le cas échéant, coordonnées facultatives laissées par
                le citoyen.
              </li>
            </ul>
          </section>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">2. Finalité du traitement</h2>
            <ul className="fr-text">
              <li>
                Traiter votre demande d&apos;information ou de démonstration et vous recontacter.
              </li>
              <li>
                Permettre aux communes clientes de recueillir, traiter et suivre les retours de
                leurs citoyens. Chaque retour est analysé automatiquement afin de proposer une
                thématique et une priorité de traitement.
              </li>
            </ul>
          </section>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">3. Base légale</h2>
            <p className="fr-text">
              Le traitement des données issues du formulaire de contact repose sur votre
              consentement explicite (article 6.1.a du RGPD). Les retours citoyens sont traités
              pour l&apos;exécution des missions de service public confiées aux communes (article
              6.1.e du RGPD) et dans l&apos;intérêt légitime des collectivités à organiser leurs
              services.
            </p>
          </section>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">4. Sous-traitants et classification automatisée</h2>
            <p className="fr-text">
              Contribcit fait appel à plusieurs sous-traitants pour assurer le bon fonctionnement
              du service :
            </p>
            <ul className="fr-text">
              <li>
                <strong>Mistral AI</strong> (
                <Link href="https://mistral.ai" target="_blank" rel="noopener noreferrer">
                  mistral.ai
                </Link>
                ) : classification automatique des retours citoyens. Les informations partagées se
                limitent au contenu utile à l&apos;analyse (texte libre, pièces jointes et
                localisation). Aucune donnée n&apos;est utilisée par Mistral AI pour d&apos;autres
                finalités. Les communes conservent en permanence la main sur la catégorisation
                (validation, modification ou suppression des propositions).
              </li>
              <li>
                <strong>Cloudflare Turnstile</strong> (
                <Link
                  href="https://www.cloudflare.com/products/turnstile/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  cloudflare.com
                </Link>
                ) : protection anti-bot pour sécuriser les formulaires. Turnstile vérifie
                automatiquement que les soumissions proviennent d&apos;utilisateurs légitimes sans
                nécessiter d&apos;interaction (mode invisible). Aucune donnée personnelle n&apos;est
                collectée par Cloudflare dans le cadre de cette vérification.
              </li>
            </ul>
          </section>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">5. Conservation des données</h2>
            <p className="fr-text">
              Les données de contact sont conservées pendant 3 ans à compter de votre dernier
              échange, sauf obligation légale contraire. Les retours citoyens sont mis à
              disposition des communes pendant la durée du service, puis supprimés ou anonymisés
              selon leurs instructions dans un délai maximal de 24 mois.
            </p>
          </section>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">6. Vos droits</h2>
            <p className="fr-text">
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
              des droits suivants :
            </p>
            <ul className="fr-text">
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition</li>
            </ul>
            <p className="fr-text fr-mt-2w">
              Pour exercer ces droits, contactez-nous à :{" "}
              <a href="mailto:contact@contribcit.fr">contact@contribcit.fr</a>
            </p>
          </section>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">7. Cookies</h2>
            <p className="fr-text">
              Ce site utilise des cookies d'analyse (Matomo) uniquement après votre consentement.
              Vous pouvez modifier vos préférences à tout moment via la bannière de cookies.
            </p>
          </section>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">8. Contact</h2>
            <p className="fr-text">
              Pour toute question concernant cette politique de confidentialité, vous pouvez nous
              contacter à : <a href="mailto:contact@contribcit.fr">contact@contribcit.fr</a>
            </p>
          </section>

          <div className="fr-mt-8w fr-text--center">
            <Button
              priority="secondary"
              linkProps={{
                href: "/",
              }}
            >
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

