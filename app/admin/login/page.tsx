import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { AdminLoginForm } from "@/components/AdminLoginForm";

type AdminLoginPageProps = {
  searchParams?: {
    redirectTo?: string;
  };
};

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const redirectTo = searchParams?.redirectTo;

  return (
    <div className="fr-flow">
      {redirectTo && (
        <Alert
          severity="info"
          small
          title="Connexion requise"
          description="Veuillez vous authentifier pour accéder à la page demandée."
        />
      )}
      <AdminLoginForm redirectTo={redirectTo} />
    </div>
  );
}

