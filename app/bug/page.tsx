import type { Metadata } from "next";
import Link from "next/link";
import { BugReportForm } from "@/components/BugReportForm";

export const metadata: Metadata = {
  title: "Signaler un bug - Contribcit",
  description:
    "Partagez un bug ou une idée d’amélioration rencontrée sur Contribcit. Chaque retour est qualifié par l’équipe produit.",
};

export default function BugReportPage() {
  return (
    <main className="fr-py-9w fr-background-alt--grey">
      <section className="fr-container fr-pb-8w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-xl-8">
            <span className="fr-badge fr-badge--info fr-mb-3w">Bêta continue</span>
            <h1 className="fr-display--sm fr-mb-2w">Signaler un bug</h1>
            <p className="fr-text--lg fr-mb-4w">
              Aidez-nous à améliorer Contribcit en décrivant un bug rencontré ou une
              fonctionnalité manquante. Chaque signalement est étudié par l’équipe
              produit. Ajoutez une capture d’écran si besoin pour illustrer votre
              retour.
            </p>
            <BugReportForm />
            <p className="fr-mt-6w fr-text--sm">
              Besoin de voir l’avancement des retours ? Consultez notre{" "}
              <Link className="fr-link" href="/suivi-des-bugs">
                suivi des bugs publics
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}


