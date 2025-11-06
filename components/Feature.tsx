"use client";

import { motion } from "framer-motion";

export interface FeatureProps {
  title: string;
  description: string;
  iconId?: string;
}

export function Feature({ title, description, iconId }: FeatureProps) {
  return (
    <div className="fr-card fr-card--no-border fr-card--shadow fr-p-4w">
      {iconId && (
        <div className="fr-text--center fr-mb-3w">
          <span
            className={`${iconId} fr-icon--lg`}
            style={{
              color: "var(--blue-france-sun-113-625)",
            }}
            aria-hidden="true"
          />
        </div>
      )}
      <h3 className="fr-h4 fr-text--center fr-mb-2w">{title}</h3>
      <p className="fr-text--center fr-text--sm">{description}</p>
    </div>
  );
}

