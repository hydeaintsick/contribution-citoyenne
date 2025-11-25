"use client";

import { useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip as MapTooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { TooltipProps } from "recharts";
import type { TownDashboardData, TrendPoint } from "@/lib/contributionStats";
import { NewsCarousel } from "@/components/NewsCarousel";

type TimelineGranularity = "weekly" | "monthly" | "yearly";

type TownDashboardProps = {
  commune: {
    id: string;
    name: string;
    websiteUrl?: string | null;
  };
  data: TownDashboardData;
};

function formatCount(value: number) {
  return value.toLocaleString("fr-FR");
}

function TimelineTooltip({
  active,
  payload,
}: TooltipProps<ValueType, NameType> & {
  payload?: Array<{ payload: TrendPoint }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }

  const point = payload[0].payload as TrendPoint;

  return (
    <div className="fr-notice fr-notice--info fr-notice--sm">
      <div className="fr-notice__body">
        <p className="fr-notice__title">{point.label}</p>
        <p className="fr-text--sm fr-mb-0">
          Alertes : <strong>{point.alerts}</strong>
        </p>
        <p className="fr-text--sm fr-mb-0">
          Suggestions : <strong>{point.suggestions}</strong>
        </p>
      </div>
    </div>
  );
}

function Toggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`fr-btn fr-btn--sm ${active ? "" : "fr-btn--tertiary"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function TownDashboard({ commune, data }: TownDashboardProps) {
  const [granularity, setGranularity] = useState<TimelineGranularity>("weekly");

  const timeline = useMemo(() => {
    switch (granularity) {
      case "monthly":
        return data.timeline.monthly;
      case "yearly":
        return data.timeline.yearly;
      case "weekly":
      default:
        return data.timeline.weekly;
    }
  }, [
    data.timeline.monthly,
    data.timeline.weekly,
    data.timeline.yearly,
    granularity,
  ]);

  const mapCenter = useMemo<[number, number]>(() => {
    const [[south, west], [north, east]] = data.map.bounds;
    return [(south + north) / 2, (west + east) / 2];
  }, [data.map.bounds]);

  const hasMapPoints = data.map.points.length > 0;

  return (
    <div className="fr-flow">
      <header className="fr-flow">
        <h1 className="fr-h3">Tableau de bord municipal</h1>
        <p className="fr-text--lead fr-mb-2">
          La ville de{" "}
          {commune.websiteUrl ? (
            <a
              href={commune.websiteUrl}
              rel="noreferrer"
              target="_blank"
              className="fr-link fr-link--md"
            >
              {commune.name}
            </a>
          ) : (
            <strong>{commune.name}</strong>
          )}{" "}
          en bref.
        </p>
      </header>

      <NewsCarousel communeId={commune.id} />

      <section
        aria-label="Indicateurs clés"
        className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle"
      >
        <div className="fr-col-12 fr-col-md-4">
          <div className="fr-card fr-card--no-arrow fr-card--shadow fr-card--horizontal">
            <div className="fr-card__body fr-px-3w fr-py-3w">
              <p className="fr-text--xs fr-text--bold fr-text-mention--grey fr-mb-1w">
                RETOURS TOTAUX
              </p>
              <p className="fr-text--xl fr-text--bold fr-mb-0">
                {formatCount(data.totals.overall)}
              </p>
              <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
                Tous les retours enregistrés
              </p>
            </div>
          </div>
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <div className="fr-card fr-card--no-arrow fr-card--shadow fr-card--horizontal">
            <div className="fr-card__body fr-px-3w fr-py-3w">
              <p className="fr-text--xs fr-text--bold fr-text-mention--grey fr-mb-1w">
                30 DERNIERS JOURS
              </p>
              <p className="fr-text--xl fr-text--bold fr-mb-0">
                {formatCount(data.totals.last30Days)}
              </p>
              <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
                Activité récente des citoyens
              </p>
            </div>
          </div>
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <div className="fr-card fr-card--no-arrow fr-card--shadow fr-card--horizontal">
            <div className="fr-card__body fr-px-3w fr-py-3w">
              <p className="fr-text--xs fr-text--bold fr-text-mention--grey fr-mb-1w">
                AVS (Alertes vs Suggestions)
              </p>
              <p className="fr-text--lg fr-text--bold fr-mb-0">
                {data.totals.alerts.percentage}% alertes
              </p>
              <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
                {data.totals.suggestions.percentage}% suggestions
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="fr-mt-4w">
        <div className="fr-card fr-card--no-arrow fr-card--shadow fr-card--horizontal">
          <div className="fr-card__body fr-px-4w fr-py-4w">
            <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-2w">
              <div className="fr-col">
                <p className="fr-card__title fr-mb-0">
                  Évolution des retours citoyens
                </p>
                <p className="fr-text--sm fr-text-mention--grey fr-mt-1v fr-mb-0">
                  Comparez les alertes (rouge) et suggestions (bleu) selon la
                  période.
                </p>
              </div>
              <div className="fr-col-auto">
                <div className="fr-btns-group fr-btns-group--inline fr-btns-group--sm fr-mt-0">
                  <Toggle
                    label="Semaines"
                    active={granularity === "weekly"}
                    onClick={() => setGranularity("weekly")}
                  />
                  <Toggle
                    label="Mois"
                    active={granularity === "monthly"}
                    onClick={() => setGranularity("monthly")}
                  />
                  <Toggle
                    label="Années"
                    active={granularity === "yearly"}
                    onClick={() => setGranularity("yearly")}
                  />
                </div>
              </div>
            </div>
            <div style={{ height: 320 }}>
              {timeline.length === 0 ? (
                <div className="fr-alert fr-alert--info fr-mt-3w">
                  <p className="fr-alert__title">
                    Aucun retour citoyen pour le moment.
                  </p>
                  <p className="fr-text--sm fr-mb-0">
                    Les premiers signalements apparaîtront ici dès leur
                    enregistrement.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<TimelineTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="alerts"
                      stroke="#dc4d43"
                      strokeWidth={2}
                      dot={false}
                      name="Alertes"
                    />
                    <Line
                      type="monotone"
                      dataKey="suggestions"
                      stroke="#0053b3"
                      strokeWidth={2}
                      dot={false}
                      name="Suggestions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="fr-mt-4w">
        <div className="fr-card fr-card--no-arrow fr-card--shadow fr-card--horizontal">
          <div className="fr-card__body fr-px-4w fr-pb-4w fr-pt-0">
            <div className="fr-card__header fr-p-4w">
              <p className="fr-card__title fr-mb-0">
                Couverture géographique des retours
              </p>
              <p className="fr-mt-1w fr-text--sm fr-text-mention--grey fr-mb-0">
                Bleu&nbsp;: suggestion · Rouge&nbsp;: alerte
              </p>
            </div>
            <div style={{ height: 420 }}>
              <MapContainer
                bounds={data.map.bounds}
                center={mapCenter}
                scrollWheelZoom={false}
                className="fr-radius--md"
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {hasMapPoints ? (
                  data.map.points.map((point) => (
                    <CircleMarker
                      key={point.id}
                      center={[point.latitude, point.longitude]}
                      radius={8}
                      pathOptions={{
                        color: point.type === "ALERT" ? "#dc4d43" : "#0053b3",
                        fillColor:
                          point.type === "ALERT" ? "#dc4d43" : "#0053b3",
                        fillOpacity: 0.7,
                        weight: 2,
                      }}
                    >
                      <MapTooltip>
                        <div className="fr-text--sm">
                          <p className="fr-text--sm fr-mb-1v">
                            <strong>
                              {point.type === "ALERT" ? "Alerte" : "Suggestion"}
                            </strong>
                          </p>
                          <p className="fr-text--xs fr-mb-1v">
                            {new Intl.DateTimeFormat("fr-FR", {
                              dateStyle: "medium",
                            }).format(new Date(point.createdAt))}
                          </p>
                          {point.locationLabel ? (
                            <p className="fr-text--xs fr-mb-0">
                              {point.locationLabel}
                            </p>
                          ) : null}
                        </div>
                      </MapTooltip>
                    </CircleMarker>
                  ))
                ) : (
                  <></>
                )}
              </MapContainer>
            </div>
            {!hasMapPoints ? (
              <div className="fr-alert fr-alert--info fr-mt-3w">
                <p className="fr-alert__title fr-mb-1v">
                  Aucune localisation précise disponible
                </p>
                <p className="fr-text--sm fr-mb-0">
                  Encouragez les citoyens à partager leur position ou un lieu
                  pour enrichir la cartographie.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
