"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";

type TownEmployee = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};

type CreationState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function TownEmployeesManager({
  initialEmployees,
}: {
  initialEmployees: TownEmployee[];
}) {
  const router = useRouter();
  const [employees, setEmployees] = useState(initialEmployees);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [creationState, setCreationState] = useState<CreationState>({ status: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedEmployees = useMemo(
    () =>
      [...employees].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [employees],
  );

  const handleInputChange = useCallback(
    (field: "firstName" | "lastName" | "email" | "password") =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((previous) => ({
          ...previous,
          [field]: event.target.value,
        }));
      },
    [],
  );

  const resetForm = useCallback(() => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    });
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setCreationState({ status: "idle" });
      setIsSubmitting(true);

      try {
        const response = await fetch("/api/admin/town-employees", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            password: form.password,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Impossible de créer le compte.");
        }

        const payload = (await response.json()) as { employee: TownEmployee };
        setEmployees((previous) => [payload.employee, ...previous]);
        setCreationState({ status: "success" });
        resetForm();
        router.refresh();
      } catch (error) {
        setCreationState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Une erreur est survenue pendant la création.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [form.email, form.firstName, form.lastName, form.password, resetForm, router],
  );

  return (
    <div className="fr-flow">
      <section className="fr-flow">
        <h1 className="fr-h3 fr-mb-0">Accès salariés municipaux</h1>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
          Créez des accès dédiés aux agents municipaux pour suivre les retours citoyens.
        </p>
      </section>

      <section className="fr-flow">
        <div className="fr-card fr-card--no-arrow fr-card--shadow fr-card--horizontal">
          <div className="fr-card__body fr-px-4w fr-py-4w">
            <h2 className="fr-h5 fr-mb-2w">Créer un nouvel accès</h2>

            {creationState.status === "error" ? (
              <Alert severity="error" title="Création impossible" description={creationState.message} />
            ) : null}

            {creationState.status === "success" ? (
              <Alert
                severity="success"
                title="Compte créé"
                description="Le salarié municipal peut désormais se connecter à l’espace back-office."
              />
            ) : null}

            <form className="fr-flow" onSubmit={handleSubmit}>
              <div className="fr-grid-row fr-grid-row--gutters">
                <div className="fr-col-12 fr-col-md-6">
                  <Input
                    label="Prénom"
                    nativeInputProps={{
                      required: true,
                      value: form.firstName,
                      onChange: handleInputChange("firstName"),
                      placeholder: "Alexandre",
                    }}
                  />
                </div>
                <div className="fr-col-12 fr-col-md-6">
                  <Input
                    label="Nom"
                    nativeInputProps={{
                      required: true,
                      value: form.lastName,
                      onChange: handleInputChange("lastName"),
                      placeholder: "Dupont",
                    }}
                  />
                </div>
              </div>

              <Input
                label="Email professionnel"
                nativeInputProps={{
                  required: true,
                  type: "email",
                  value: form.email,
                  onChange: handleInputChange("email"),
                  placeholder: "prenom.nom@mairie.fr",
                }}
              />

              <Input
                label="Mot de passe temporaire"
                hintText="Minimum 8 caractères. L’agent pourra le modifier depuis son profil."
                nativeInputProps={{
                  required: true,
                  type: "password",
                  value: form.password,
                  onChange: handleInputChange("password"),
                }}
              />

              <div className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mt-3w">
                <Button
                  priority="secondary"
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  priority="primary"
                  type="submit"
                  iconId={isSubmitting ? "fr-icon-refresh-line" : "fr-icon-add-line"}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Création…" : "Créer l’accès"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="fr-flow">
        <h2 className="fr-h5 fr-mb-0">Salariés existants</h2>
        {sortedEmployees.length === 0 ? (
          <div className="fr-alert fr-alert--info">
            <p className="fr-alert__title fr-mb-1v">Aucun salarié enregistré</p>
            <p className="fr-text--sm fr-mb-0">
              Créez un premier accès pour permettre à vos équipes de suivre les retours citoyens.
            </p>
          </div>
        ) : (
          <div className="fr-table fr-table--no-caption">
            <div className="fr-table__wrapper">
              <div className="fr-table__container">
                <div className="fr-table__content">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Identité</th>
                        <th scope="col">Email</th>
                        <th scope="col">Dernière connexion</th>
                        <th scope="col">Créé le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEmployees.map((employee) => (
                        <tr key={employee.id}>
                          <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
                            <p className="fr-text--md fr-text--bold fr-mb-0">
                              {[employee.firstName, employee.lastName].filter(Boolean).join(" ") ||
                                "Inconnu"}
                            </p>
                            <Badge small severity="info">
                              Salarié municipal
                            </Badge>
                          </td>
                          <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
                            <p className="fr-text--sm fr-mb-0">{employee.email}</p>
                          </td>
                          <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
                            <p className="fr-text--sm fr-mb-0">
                              {employee.lastLoginAt
                                ? dateFormatter.format(new Date(employee.lastLoginAt))
                                : "Jamais connecté"}
                            </p>
                          </td>
                          <td className="fr-py-2w" style={{ verticalAlign: "top" }}>
                            <p className="fr-text--sm fr-mb-0">
                              {dateFormatter.format(new Date(employee.createdAt))}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

