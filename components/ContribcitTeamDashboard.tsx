"use client";

import { useMemo, useState } from "react";
import { MapContainer, Rectangle, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  CartesianGrid,
  Line,
  LineChart,
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
import type { CommuneStats, TimelinePoint } from "@/lib/communeStats";

type ContribcitTeamDashboardProps = {
  stats: CommuneStats;
};

type TimelineGranularity = "weekly" | "monthly";

function formatPopulation(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} M`;
  }

  if (value >= 10_000) {
    return `${Math.round(value / 1_000)} k`;
  }

  return value.toLocaleString("fr-FR");
}

function formatSurface(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: value < 10 ? 2 : 1,
  }).format(value);
}

function useGlobalBounds(
  communes: CommuneStats["communes"]
): [[number, number], [number, number]] {
  return useMemo(() => {
    if (communes.length === 0) {
      return [
        [41, -5],
        [51, 9],
      ];
    }

    const south = Math.min(...communes.map((commune) => commune.bbox[0]));
    const north = Math.max(...communes.map((commune) => commune.bbox[1]));
    const west = Math.min(...communes.map((commune) => commune.bbox[2]));
    const east = Math.max(...communes.map((commune) => commune.bbox[3]));

    return [
      [south, west],
      [north, east],
    ];
  }, [communes]);
}

function ToggleButton({
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

function TimelineTooltip({
  active,
  payload,
}: TooltipProps<ValueType, NameType> & {
  payload?: Array<{ payload: TimelinePoint }>;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }

  const point = payload[0].payload as TimelinePoint;

  return (
    <div className="fr-notice fr-notice--info fr-notice--sm">
      <div className="fr-notice__body">
        <p className="fr-notice__title">{point.label}</p>
        <p className="fr-text--sm">
          Communes cumulées : <strong>{point.value}</strong>
        </p>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="fr-card fr-card--no-arrow fr-card--shadow fr-card--horizontal kpi-card">
      <div className="fr-card__body fr-px-3w fr-py-3w fr-text--center">
        <p className="fr-text--xs fr-text--bold fr-mb-1w fr-text-mention--grey">
          {title.toUpperCase()}
        </p>
        <p className="fr-text--xl fr-text--bold fr-mb-0">{value}</p>
        {helper ? (
          <p className="fr-text--sm fr-mt-1w fr-text-mention--grey">{helper}</p>
        ) : null}
      </div>
    </div>
  );
}

export function ContribcitTeamDashboard({
  stats,
}: ContribcitTeamDashboardProps) {
  const [granularity, setGranularity] = useState<TimelineGranularity>("weekly");
  const bounds = useGlobalBounds(stats.communes);

  const timeline =
    granularity === "weekly" ? stats.timeline.weekly : stats.timeline.monthly;

  return (
    <div className="fr-flow">
      <header className="fr-flow">
        <h1 className="fr-h3">Tableau de bord Contribcit</h1>
        <p className="fr-text--lead">
          Suivez en un coup d&apos;œil l&apos;adoption de la plateforme par les
          communes.
        </p>
      </header>

      <section
        aria-label="Indicateurs clés"
        className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle kpi-grid"
      >
        <div className="fr-col-12 fr-col-md-4">
          <KpiCard
            title="Communes accompagnées"
            value={stats.totals.communes.toLocaleString("fr-FR")}
            helper="Collectivités actives sur Contribcit"
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <KpiCard
            title="Population couverte"
            value={formatPopulation(stats.totals.population)}
            helper="Habitants bénéficiaires potentiels"
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <KpiCard
            title="Surface couverte"
            value={`${formatSurface(stats.totals.surfaceKm2)} km²`}
            helper="Territoires accompagnés"
          />
        </div>
      </section>

      <section className="fr-mt-4w">
        <div className="fr-card fr-card--no-arrow fr-card--shadow fr-card--horizontal">
          <div className="fr-card__body fr-px-4w fr-py-4w">
            <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-2w">
              <div className="fr-col">
                <p className="fr-card__title fr-mb-0">
                  Progression des communes
                </p>
                <p className="fr-text--sm fr-text-mention--grey fr-mt-1v fr-mb-0">
                  Nombre cumulé de communes inscrites sur la période
                  sélectionnée.
                </p>
              </div>
              <div className="fr-col-auto">
                <div className="fr-btns-group fr-btns-group--inline fr-btns-group--sm fr-mt-0">
                  <ToggleButton
                    label="Semaines"
                    active={granularity === "weekly"}
                    onClick={() => setGranularity("weekly")}
                  />
                  <ToggleButton
                    label="Mois"
                    active={granularity === "monthly"}
                    onClick={() => setGranularity("monthly")}
                  />
                </div>
              </div>
            </div>
            <div style={{ height: 320 }}>
              {timeline.length === 0 ? (
                <div className="fr-alert fr-alert--info fr-mt-3w">
                  <p className="fr-alert__title">
                    Ajoutez des communes pour voir la progression dans le temps.
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
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#000091"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
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
              <p className="fr-card__title fr-mb-0">Couverture géographique</p>
              <p className="fr-mt-1w fr-text--sm">
                Les rectangles bleus représentent les communes accompagnées.
              </p>
            </div>
            <div style={{ height: 420 }}>
              <MapContainer
                bounds={bounds}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributeurs'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {stats.communes.map((commune) => (
                  <Rectangle
                    key={commune.id}
                    bounds={[
                      [commune.bbox[0], commune.bbox[2]],
                      [commune.bbox[1], commune.bbox[3]],
                    ]}
                    pathOptions={{
                      color: "#000091",
                      weight: 1,
                      fillOpacity: 0.3,
                      fillColor: "#000091",
                    }}
                  />
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </section>

      <section
        className="fr-my-6w"
        style={{
          backgroundColor: "var(--pink-tuile-975-75)",
          borderRadius: "0.5rem",
        }}
      >
        <div className="fr-px-4w fr-py-3w fr-text--center">
          <p className="fr-text--md fr-text--bold fr-m-0">
            Made with love by S & V for a safer France 🇫🇷
          </p>
        </div>
      </section>
    </div>
  );
}
