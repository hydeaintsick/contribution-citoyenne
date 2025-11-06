import { Alert } from "@codegouvfr/react-dsfr/Alert";

export default function AdminHomePage() {
  return (
    <div className="fr-flow">
      <h1 className="fr-h3">Tableau de bord</h1>
      <p className="fr-text--lead">
        Bienvenue sur l&apos;espace d’administration Contribcit.
      </p>
      <Alert
        severity="info"
        title="Bientôt disponible"
        description="Le tableau de bord sera bientôt accessible. En attendant, vous pouvez compléter vos informations personnelles dans la section “Mon profil”."
      />
    </div>
  );
}

