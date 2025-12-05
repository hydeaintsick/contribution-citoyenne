"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { CrmCommuneList } from "./CrmCommuneList";
import { CrmCommuneCreateForm } from "./CrmCommuneCreateForm";
import { DiscordBanner } from "./DiscordBanner";

type AccountManagerKpiStats = {
  communesEnGestion: number;
  caCeMois: number | null;
  mrrHt: number;
};

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

export function AccountManagerCrmView() {
  const router = useRouter();
  const [communes, setCommunes] = useState<CrmCommune[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [kpiStats, setKpiStats] = useState<AccountManagerKpiStats | null>(null);

  const loadCommunes = useCallback(async () => {
    setIsLoading(true);
    try {
      const [communesResponse, kpiResponse] = await Promise.all([
        fetch("/api/admin/communes"),
        fetch("/api/admin/crm/kpi"),
      ]);

      if (communesResponse.ok) {
        const communesData = (await communesResponse.json()) as {
          communes: CrmCommune[];
        };
        setCommunes(communesData.communes);
      }

      if (kpiResponse.ok) {
        const kpiData = (await kpiResponse.json()) as {
          kpi: AccountManagerKpiStats;
        };
        setKpiStats(kpiData.kpi);
      }
    } catch (error) {
      console.error("Failed to load CRM communes", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommunes();
  }, [loadCommunes]);

  const handleCommuneCreated = useCallback(() => {
    loadCommunes();
    setIsCreateModalOpen(false);
  }, [loadCommunes]);

  const handleCommuneClick = useCallback(
    (communeId: string) => {
      router.push(`/admin/communes/${communeId}`);
    },
    [router],
  );

  return (
    <div className="fr-flow">
      <header className="fr-flow">
        <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-2w">
          <div className="fr-col">
            <h1 className="fr-h3 fr-mb-0">Vue d'ensemble</h1>
            <p className="fr-text--sm fr-mb-0">
              Gérez vos comptes et assurez le suivi.
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

      {kpiStats && (
        <section
          aria-label="Indicateurs clés"
          className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle kpi-grid fr-mb-4w"
        >
          <div className="fr-col-12 fr-col-md-4">
            <KpiCard
              title="Communes en gestion"
              value={kpiStats.communesEnGestion.toLocaleString("fr-FR")}
              helper="Communes assignées"
            />
          </div>
          <div className="fr-col-12 fr-col-md-4">
            <KpiCard
              title="CA ce mois-ci"
              value={`${(kpiStats.caCeMois ?? 0).toLocaleString("fr-FR")} €`}
              helper="Chiffre d'affaires du mois"
            />
          </div>
          <div className="fr-col-12 fr-col-md-4">
            <KpiCard
              title="MRR HT"
              value={`${kpiStats.mrrHt.toLocaleString("fr-FR")} €`}
              helper="Revenus récurrents mensuels"
            />
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="fr-callout">
          <p className="fr-callout__text">Chargement...</p>
        </div>
      ) : (
        <CrmCommuneList communes={communes} userRole="ACCOUNT_MANAGER" />
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

