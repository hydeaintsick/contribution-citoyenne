"use client";

import { useMemo, useState, useTransition } from "react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

type ContributionDetail = {
  id: string;
  type: "ALERT" | "SUGGESTION";
  status: "OPEN" | "CLOSED";
  title: string;
  categoryLabel: string;
  categoryColor?: string | null;
  categoryTextColor?: string | null;
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

const DEFAULT_CATEGORY_BADGE_COLOR = "#E5E5F4";
const DEFAULT_CATEGORY_BADGE_TEXT_COLOR = "#161616";

function formatUserName(user?: ContributionDetail["closedBy"]) {
  if (!user) {
    return "Inconnu";
  }
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.email;
}

export function TownContributionDetail({
  contribution,
}: {
  contribution: ContributionDetail;
}) {
  const [closureMessage, setClosureMessage] = useState("");
  const [closureState, setClosureState] = useState<ClosureState>({
    status: "idle",
  });
  const [currentContribution, setCurrentContribution] = useState(contribution);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const {
    buttonProps: attachmentButtonProps,
    Component: AttachmentModal,
    open: openAttachmentModal,
  } = createModal({
    id: `contribution-photo-modal-${contribution.id}`,
    isOpenedByDefault: false,
  });

  const typeTag = useMemo(
    () => (
      <Badge
        small
        severity={currentContribution.type === "ALERT" ? "error" : "info"}
      >
        {currentContribution.type === "ALERT" ? "Alerte" : "Suggestion"}
      </Badge>
    ),
    [currentContribution.type]
  );

  const statusTag = useMemo(
    () => (
      <Badge
        small
        severity={currentContribution.status === "OPEN" ? "warning" : "success"}
      >
        {currentContribution.status === "OPEN" ? "À traiter" : "Clôturé"}
      </Badge>
    ),
    [currentContribution.status]
  );

  const categoryTag = useMemo(() => {
    const label = (currentContribution.categoryLabel ?? "").trim();
    const hasCategory = label.length > 0;
    const backgroundColor = hasCategory
      ? currentContribution.categoryColor ?? DEFAULT_CATEGORY_BADGE_COLOR
      : "#f5f5f5";
    const textColor = hasCategory
      ? currentContribution.categoryTextColor ?? DEFAULT_CATEGORY_BADGE_TEXT_COLOR
      : "#161616";

    return (
      <Badge
        small
        style={{
          backgroundColor,
          color: textColor,
        }}
      >
        {hasCategory ? label : "Non catégorisé"}
      </Badge>
    );
  }, [
    currentContribution.categoryColor,
    currentContribution.categoryLabel,
    currentContribution.categoryTextColor,
  ]);

  const handleClosure = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentContribution.status === "CLOSED") {
      return;
    }
    setClosureState({ status: "idle" });

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/contributions/${currentContribution.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "close",
              closureNote: closureMessage.trim() || null,
            }),
          }
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            payload?.error ?? "Clôture impossible pour le moment."
          );
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

  const renderBackToListButton = (
    priority: "primary" | "secondary" = "secondary",
    additionalClassName?: string
  ) => (
    <Button
      priority={priority}
      iconId="fr-icon-arrow-left-line"
      linkProps={{ href: "/admin/retours" }}
      className={additionalClassName}
    >
      Retour aux retours
    </Button>
  );

  const locationCoordinates = useMemo(() => {
    if (
      typeof currentContribution.latitude === "number" &&
      typeof currentContribution.longitude === "number"
    ) {
      return [currentContribution.latitude, currentContribution.longitude] as [
        number,
        number
      ];
    }
    return null;
  }, [currentContribution.latitude, currentContribution.longitude]);

  return (
    <div className="contribution-detail fr-flow">
      <header className="contribution-detail__header">
        <div className="contribution-detail__header-content">
          <div className="contribution-detail__header-return">
            {renderBackToListButton(
              "secondary",
              "contribution-detail__return-button"
            )}
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
            <div className="fr-col-auto">{typeTag}</div>
            <div className="fr-col-auto">{statusTag}</div>
            <div className="fr-col-auto">{categoryTag}</div>
          </div>
          <h1 className="fr-h3 fr-mb-0">
            {currentContribution.title || "Sans titre"}
          </h1>
          <p className="fr-text--sm fr-text-mention--grey fr-mb-1w">
            Créé le {dateFormatter.format(new Date(currentContribution.createdAt))}
          </p>
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
            Dernière mise à jour le {dateFormatter.format(new Date(currentContribution.updatedAt))}
          </p>
        </div>
      </header>

      <section className="contribution-detail__section fr-flow">
        <h2 className="fr-h5 fr-mb-0">Description</h2>
        <p className="fr-text--md">{currentContribution.details}</p>
      </section>

      <section className="contribution-detail__section fr-flow">
        <h2 className="fr-h5 fr-mb-0">Localisation</h2>
        <ul
          className="fr-text--sm fr-mb-0 fr-pl-0 fr-ml-0"
          style={{ listStyle: "none" }}
        >
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
              ? `${currentContribution.latitude.toFixed(
                  5
                )}, ${currentContribution.longitude.toFixed(5)}${
                  currentContribution.locationLabel
                    ? ` (${currentContribution.locationLabel})`
                    : ""
                }`
              : "Non renseignées"}
          </li>
        </ul>
      </section>

      {locationCoordinates ? (
        <section className="contribution-detail__section fr-flow">
          <h2 className="fr-h5 fr-mb-0">Aperçu cartographique</h2>
          <div className="contribution-detail__map">
            <MapContainer
              center={locationCoordinates}
              zoom={18}
              scrollWheelZoom={false}
              dragging={false}
              doubleClickZoom={false}
              keyboard={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CircleMarker
                center={locationCoordinates}
                radius={14}
                pathOptions={{
                  color:
                    currentContribution.type === "ALERT"
                      ? "#dc4d43"
                      : "#0053b3",
                  fillColor:
                    currentContribution.type === "ALERT"
                      ? "#dc4d43"
                      : "#0053b3",
                  fillOpacity: 0.7,
                  weight: 3,
                }}
              />
            </MapContainer>
          </div>
          <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
            Plan rapproché pour repérer l&apos;emplacement signalé.
          </p>
        </section>
      ) : null}

      {currentContribution.photoUrl ? (
        <section className="contribution-detail__section fr-flow">
          <h2 className="fr-h5 fr-mb-0">Photo transmise</h2>
          <Button
            priority="secondary"
            iconId="fr-icon-eye-line"
            nativeButtonProps={{
              ...attachmentButtonProps,
              type: "button",
              onClick: (event) => {
                event.preventDefault();
                openAttachmentModal();
              },
            }}
          >
            Voir la pièce jointe
          </Button>
          <AttachmentModal
            title="Photo transmise"
            concealingBackdrop={true}
            buttons={[
              {
                children: "Fermer",
                priority: "secondary",
                doClosesModal: true,
              },
            ]}
          >
            <figure className="fr-my-0">
              <img
                src={currentContribution.photoUrl}
                alt="Illustration transmise par le citoyen"
                className="fr-responsive-img fr-radius--md"
                style={{
                  maxHeight: "32rem",
                  objectFit: "contain",
                  width: "100%",
                }}
              />
            </figure>
          </AttachmentModal>
        </section>
      ) : null}

      {currentContribution.status === "CLOSED" ? (
        <section className="contribution-detail__section fr-flow">
          <Alert
            severity="success"
            title="Contribution clôturée"
            description={
              <div className="fr-flow">
                <p className="fr-text--sm fr-mb-0">
                  Clôturé le{" "}
                  {currentContribution.closedAt
                    ? dateFormatter.format(
                        new Date(currentContribution.closedAt)
                      )
                    : "date inconnue"}{" "}
                  par {formatUserName(currentContribution.closedBy)}.
                </p>
                {currentContribution.closureNote ? (
                  <blockquote className="fr-quote fr-mb-0">
                    <p className="fr-quote__text">
                      {currentContribution.closureNote}
                    </p>
                  </blockquote>
                ) : null}
              </div>
            }
          />
          {renderBackToListButton("primary", "fr-mt-3w")}
        </section>
      ) : (
        <section className="contribution-detail__section fr-flow">
          <h2 className="fr-h5 fr-mb-0">Clôturer la contribution</h2>
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
            Ajoutez un message (optionnel) pour documenter la résolution. Il
            reste interne à votre équipe municipale.
          </p>

          {closureState.status === "error" ? (
            <Alert
              severity="error"
              title="Clôture impossible"
              description={closureState.message}
            />
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
                onChange: (event) =>
                  setClosureMessage(event.target.value.slice(0, 500)),
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
