"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@codegouvfr/react-dsfr/Button";
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Legend,
} from "recharts";
import { CrmCommuneList } from "./CrmCommuneList";
import { CrmCommuneCreateForm } from "./CrmCommuneCreateForm";
import { FranceRegionsMap } from "./FranceRegionsMap";
import { DiscordBanner } from "./DiscordBanner";

type RegionStats = {
  regionCode: string;
  regionName: string;
  count: number;
};

type AccountManagerStats = {
  accountManagerId: string;
  accountManagerEmail: string;
  accountManagerName: string;
  communeCount: number;
};

type ProgressionPoint = {
  date: string;
  registered: number;
  active: number;
  premium: number;
};

type KpiStats = {
  communes: number;
  population: number;
  surfaceKm2: number;
};

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

type CrmCommune = {
  id: string;
  name: string;
  postalCode: string;
  slug: string | null;
  latitude: number;
  longitude: number;
  isVisible: boolean;
  hasPremiumAccess: boolean;
  isPartner: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  accountManager: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  _count: {
    comments: number;
  };
};

const COLORS = [
  "#000091",
  "#0063CB",
  "#6A6AF4",
  "#9C8EFF",
  "#B79DFF",
  "#D1C4FF",
  "#E3D9FF",
  "#F0E9FF",
];

export function AdminCrmDashboard() {
  const router = useRouter();
  const [communes, setCommunes] = useState<CrmCommune[]>([]);
  const [regions, setRegions] = useState<RegionStats[]>([]);
  const [accountManagers, setAccountManagers] = useState<AccountManagerStats[]>([]);
  const [progression, setProgression] = useState<ProgressionPoint[]>([]);
  const [kpiStats, setKpiStats] = useState<KpiStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<"ADMIN" | "ACCOUNT_MANAGER">("ADMIN");

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          headers: {
            "Cache-Control": "no-store",
          },
        });
        if (response.ok) {
          const data = (await response.json().catch(() => null)) as {
            user?: { role?: string | null };
          } | null;
          const role = data?.user?.role;
          if (role === "ADMIN" || role === "ACCOUNT_MANAGER") {
            setUserRole(role);
          }
        }
      } catch (error) {
        console.error("Failed to load session", error);
      }
    }
    loadSession();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [communesResponse, statsResponse, kpiResponse] = await Promise.all([
        fetch("/api/admin/communes"),
        fetch("/api/admin/crm/stats"),
        fetch("/api/admin/crm/kpi"),
      ]);

      if (communesResponse.ok) {
        const communesData = (await communesResponse.json()) as {
          communes: CrmCommune[];
        };
        setCommunes(communesData.communes);
      }

      if (statsResponse.ok) {
        const statsData = (await statsResponse.json()) as {
          regions: RegionStats[];
          accountManagers: AccountManagerStats[];
          progression: ProgressionPoint[];
        };
        setRegions(statsData.regions);
        setAccountManagers(statsData.accountManagers);
        setProgression(statsData.progression);
      }

      if (kpiResponse.ok) {
        const kpiData = (await kpiResponse.json()) as { kpi: KpiStats };
        setKpiStats(kpiData.kpi);
      }
    } catch (error) {
      console.error("Failed to load CRM data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCommuneCreated = useCallback(() => {
    loadData();
    setIsCreateModalOpen(false);
  }, [loadData]);

  const handleCommuneClick = useCallback(
    (communeId: string) => {
      router.push(`/admin/communes/${communeId}`);
    },
    [router],
  );

  const pieData = accountManagers.map((am) => ({
    name: am.accountManagerName,
    value: am.communeCount,
  }));

  return (
    <div className="fr-flow">
      <header className="fr-flow">
        <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-2w">
          <div className="fr-col">
            <h1 className="fr-h3 fr-mb-0">Tableau de bord Contribcit</h1>
            <p className="fr-text--sm fr-mb-0">
              Suivez en un coup d'œil l'adoption de la plateforme par les communes.
            </p>
          </div>
          <div className="fr-col-auto">
            <Button
              priority="primary"
              iconId="fr-icon-add-line"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Nouvelle commune
            </Button>
          </div>
        </div>
      </header>

      <DiscordBanner />

      {isLoading ? (
        <div className="fr-callout">
          <p className="fr-callout__text">Chargement...</p>
        </div>
      ) : (
        <>
          {kpiStats && (
            <section
              aria-label="Indicateurs clés"
              className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle kpi-grid fr-mb-4w"
            >
              <div className="fr-col-12 fr-col-md-4">
                <KpiCard
                  title="Communes accompagnées"
                  value={kpiStats.communes.toLocaleString("fr-FR")}
                  helper="Collectivités actives sur Contribcit"
                />
              </div>
              <div className="fr-col-12 fr-col-md-4">
                <KpiCard
                  title="Population couverte"
                  value={formatPopulation(kpiStats.population)}
                  helper="Habitants bénéficiaires potentiels"
                />
              </div>
              <div className="fr-col-12 fr-col-md-4">
                <KpiCard
                  title="Surface couverte"
                  value={`${formatSurface(kpiStats.surfaceKm2)} km²`}
                  helper="Territoires accompagnés"
                />
              </div>
            </section>
          )}

          <div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
            <div className="fr-col-12 fr-col-md-6">
              <FranceRegionsMap regions={regions} />
            </div>
            <div className="fr-col-12 fr-col-md-6">
              <div className="fr-flow">
                <div className="fr-card fr-card--no-arrow fr-card--shadow fr-mb-4w">
                  <div className="fr-card__body fr-px-4w fr-py-4w">
                    <h3 className="fr-h5 fr-mb-3w">
                      Répartition par commercial
                    </h3>
                    {accountManagers.length === 0 ? (
                      <p className="fr-text--sm fr-text-mention--grey">
                        Aucune donnée disponible
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="fr-card fr-card--no-arrow fr-card--shadow">
                  <div className="fr-card__body fr-px-4w fr-py-4w">
                    <h3 className="fr-h5 fr-mb-3w">Progression des communes</h3>
                    {progression.length === 0 ? (
                      <p className="fr-text--sm fr-text-mention--grey">
                        Aucune donnée disponible
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={progression}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="registered"
                            stroke="#000091"
                            strokeWidth={2}
                            name="Enregistrées"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="active"
                            stroke="#0063CB"
                            strokeWidth={2}
                            name="Actives"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="premium"
                            stroke="#6A6AF4"
                            strokeWidth={2}
                            name="Premium"
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section>
            <h2 className="fr-h5 fr-mb-3w">Liste des communes</h2>
            <CrmCommuneList communes={communes} userRole={userRole} />
          </section>
        </>
      )}

      {isCreateModalOpen && (
        <div
          className={`fr-modal${isCreateModalOpen ? " fr-modal--opened" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="crm-create-modal-title"
          id="crm-create-modal"
        >
          <div className="fr-container fr-container--fluid fr-container-md">
            <div className="fr-modal__body">
              <div className="fr-modal__header">
                <button
                  className="fr-btn--close fr-btn"
                  title="Fermer"
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Fermer
                </button>
              </div>
              <div className="fr-modal__content">
                <h1 className="fr-h4" id="crm-create-modal-title">
                  Créer une commune
                </h1>
                <CrmCommuneCreateForm onCommuneCreated={handleCommuneCreated} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

