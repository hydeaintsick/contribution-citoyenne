"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

type AdminLoginFormProps = {
  redirectTo?: string | null;
};

export function AdminLoginForm({ redirectTo }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setIsSubmitting(true);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setError(data?.error ?? "Connexion impossible.");
          return;
        }

        router.push(redirectTo && redirectTo.startsWith("/admin") ? redirectTo : "/admin");
        router.refresh();
      } catch (err) {
        console.error(err);
        setError("Une erreur est survenue. Veuillez réessayer.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, redirectTo, router],
  );

  return (
    <form className="fr-flow" onSubmit={handleSubmit}>
      <h1 className="fr-h4 fr-mb-1w">Connexion</h1>
      <p className="fr-text--sm fr-mb-3w">
        Accédez à l’espace Contribcit réservé aux équipes internes.
      </p>

      {error && (
        <Alert severity="error" title="Erreur" description={error} small />
      )}

      <Input
        label="Email professionnel"
        state={error ? "error" : "default"}
        stateRelatedMessage={error ? "Vérifiez vos identifiants." : undefined}
        nativeInputProps={{
          type: "email",
          name: "email",
          value: email,
          onChange: (event) => setEmail(event.target.value),
          autoComplete: "email",
          required: true,
        }}
      />

      <Input
        label="Mot de passe"
        state={error ? "error" : "default"}
        stateRelatedMessage={error ? "Vérifiez vos identifiants." : undefined}
        nativeInputProps={{
          type: "password",
          name: "password",
          value: password,
          onChange: (event) => setPassword(event.target.value),
          autoComplete: "current-password",
          required: true,
        }}
      />

      <Button
        type="submit"
        priority="primary"
        disabled={isSubmitting}
        iconId={isSubmitting ? "fr-icon-refresh-line" : undefined}
      >
        {isSubmitting ? "Connexion en cours…" : "Se connecter"}
      </Button>
    </form>
  );
}

