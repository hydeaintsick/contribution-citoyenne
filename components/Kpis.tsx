"use client";

import { motion } from "framer-motion";

export interface KpiProps {
  value: string;
  label: string;
  description?: string;
}

export interface KpisProps {
  kpis: KpiProps[];
}

export function Kpis({ kpis }: KpisProps) {
  return (
    <section className="fr-container fr-py-8w fr-background-alt--grey">
      <div className="fr-grid-row fr-grid-row--gutters">
        {kpis.map((kpi, index) => (
          <motion.div
            key={index}
            className="fr-col-12 fr-col-md-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="fr-card fr-card--no-border fr-card--shadow fr-p-4w fr-text--center">
              <p className="fr-h1 fr-text--bold fr-text--blue-france">{kpi.value}</p>
              <p className="fr-h4 fr-mt-2w">{kpi.label}</p>
              {kpi.description && (
                <p className="fr-text--sm fr-mt-2w fr-text--grey">{kpi.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

