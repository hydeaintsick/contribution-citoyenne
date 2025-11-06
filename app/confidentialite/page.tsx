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
              Contribcit collecte les données personnelles suivantes lorsque vous utilisez notre
              formulaire de contact :
            </p>
            <ul className="fr-text">
              <li>Nom</li>
              <li>Adresse email professionnelle</li>
              <li>Fonction</li>
              <li>Commune</li>
              <li>Message</li>
            </ul>
          </section>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">2. Finalité du traitement</h2>
            <p className="fr-text">
              Les données collectées sont utilisées uniquement pour répondre à votre demande de
              contact et vous proposer une démonstration de Contribcit.
            </p>
          </section>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">3. Base légale</h2>
            <p className="fr-text">
              Le traitement de vos données personnelles est basé sur votre consentement explicite,
              donné lors de la soumission du formulaire de contact.
            </p>
          </section>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">4. Conservation des données</h2>
            <p className="fr-text">
              Vos données sont conservées pendant une durée maximale de 3 ans à compter de votre
              dernier contact, sauf obligation légale contraire.
            </p>
          </section>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">5. Vos droits</h2>
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
            <h2 className="fr-h2">6. Cookies</h2>
            <p className="fr-text">
              Ce site utilise des cookies d'analyse (Matomo) uniquement après votre consentement.
              Vous pouvez modifier vos préférences à tout moment via la bannière de cookies.
            </p>
          </section>

          <section className="fr-mt-6w">
            <h2 className="fr-h2">7. Contact</h2>
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

