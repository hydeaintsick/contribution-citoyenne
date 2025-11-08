"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";

type ContributionDetail = {
  id: string;
  type: "ALERT" | "SUGGESTION";
  status: "OPEN" | "CLOSED";
  categoryLabel: string;
  subcategory: string;
  details: string;
  locationLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  closureNote?: string | null;
  closedBy?: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  } | null;
};

type ClosureState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatUserName(user?: ContributionDetail["closedBy"]) {
  if (!user) {
    return "Inconnu";
  }
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.email;
}

export function TownContributionDetail({ contribution }: { contribution: ContributionDetail }) {
  const [closureMessage, setClosureMessage] = useState("");
  const [closureState, setClosureState] = useState<ClosureState>({ status: "idle" });
  const [currentContribution, setCurrentContribution] = useState(contribution);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const typeTag = useMemo(
    () => (
      <Badge small severity={currentContribution.type === "ALERT" ? "error" : "info"}>
        {currentContribution.type === "ALERT" ? "Alerte" : "Suggestion"}
      </Badge>
    ),
    [currentContribution.type],
  );

  const statusTag = useMemo(
    () => (
      <Badge small severity={currentContribution.status === "OPEN" ? "warning" : "success"}>
        {currentContribution.status === "OPEN" ? "À traiter" : "Clôturé"}
      </Badge>
    ),
    [currentContribution.status],
  );

  const handleClosure = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentContribution.status === "CLOSED") {
      return;
    }
    setClosureState({ status: "idle" });

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/contributions/${currentContribution.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "close",
            closureNote: closureMessage.trim() || null,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Clôture impossible pour le moment.");
        }

        const payload = (await response.json()) as {
          contribution: ContributionDetail;
        };

        setCurrentContribution(payload.contribution);
        setClosureState({ status: "success" });
        setClosureMessage("");
        router.refresh();
      } catch (error) {
        setClosureState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Une erreur est survenue pendant la clôture.",
        });
      }
    });
  };

  return (
    <div className="fr-flow">
      <header className="fr-flow">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div className="fr-col-auto">{typeTag}</div>
          <div className="fr-col-auto">{statusTag}</div>
        </div>
        <h1 className="fr-h3 fr-mb-0">{currentContribution.categoryLabel}</h1>
        <p className="fr-text--lead fr-mb-0">{currentContribution.subcategory}</p>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
          Créé le {dateFormatter.format(new Date(currentContribution.createdAt))}
        </p>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
          Dernière mise à jour le {dateFormatter.format(new Date(currentContribution.updatedAt))}
        </p>
      </header>

      <section className="fr-flow">
        <h2 className="fr-h5 fr-mb-0">Description</h2>
        <p className="fr-text--md">{currentContribution.details}</p>
      </section>

      <section className="fr-flow">
        <h2 className="fr-h5 fr-mb-0">Localisation</h2>
        <ul className="fr-text--sm fr-mb-0 fr-pl-0 fr-ml-0" style={{ listStyle: "none" }}>
          <li>
            <strong>Lieu :</strong>{" "}
            {currentContribution.locationLabel ?? (
              <span className="fr-text-mention--grey">Non précisé</span>
            )}
          </li>
          <li>
            <strong>Coordonnées :</strong>{" "}
            {typeof currentContribution.latitude === "number" &&
            typeof currentContribution.longitude === "number"
              ? `${currentContribution.latitude.toFixed(5)}, ${currentContribution.longitude.toFixed(5)}`
              : "Non renseignées"}
          </li>
        </ul>
      </section>

      {currentContribution.photoUrl ? (
        <section className="fr-flow">
          <h2 className="fr-h5 fr-mb-0">Photo transmise</h2>
          <img
            src={currentContribution.photoUrl}
            alt="Illustration transmise par le citoyen"
            className="fr-responsive-img fr-radius--md"
          />
        </section>
      ) : null}

      {currentContribution.status === "CLOSED" ? (
        <section className="fr-flow">
          <Alert
            severity="success"
            title="Contribution clôturée"
            description={
              <div className="fr-flow">
                <p className="fr-text--sm fr-mb-0">
                  Clôturé le{" "}
                  {currentContribution.closedAt
                    ? dateFormatter.format(new Date(currentContribution.closedAt))
                    : "date inconnue"}{" "}
                  par {formatUserName(currentContribution.closedBy)}.
                </p>
                {currentContribution.closureNote ? (
                  <blockquote className="fr-quote fr-mb-0">
                    <p className="fr-quote__text">{currentContribution.closureNote}</p>
                  </blockquote>
                ) : null}
              </div>
            }
          />
        </section>
      ) : (
        <section className="fr-flow fr-mt-4w">
          <h2 className="fr-h5 fr-mb-0">Clôturer la contribution</h2>
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
            Ajoutez un message (optionnel) pour documenter la résolution. Il reste interne à votre
            équipe municipale.
          </p>

          {closureState.status === "error" ? (
            <Alert severity="error" title="Clôture impossible" description={closureState.message} />
          ) : null}
          {closureState.status === "success" ? (
            <Alert
              severity="success"
              title="Contribution clôturée"
              description="Le statut a été mis à jour. Merci pour le suivi de ce retour."
            />
          ) : null}

          <form className="fr-flow" onSubmit={handleClosure}>
            <Input
              label="Message de clôture"
              textArea
              hintText="500 caractères maximum. Ex: Intervention planifiée, travaux réalisés, etc."
              nativeTextAreaProps={{
                value: closureMessage,
                onChange: (event) => setClosureMessage(event.target.value.slice(0, 500)),
                rows: 4,
              }}
            />
            <Button
              type="submit"
              priority="primary"
              iconId={isPending ? "fr-icon-refresh-line" : "fr-icon-check-line"}
              disabled={isPending}
            >
              {isPending ? "Clôture en cours…" : "Clôturer"}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}

