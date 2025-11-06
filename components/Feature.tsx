import { Card } from "@codegouvfr/react-dsfr/Card";

export interface FeatureProps {
  title: string;
  description: string;
  iconId?: string;
}

export function Feature({ title, description, iconId }: FeatureProps) {
  return (
    <Card
      title={title}
      desc={description}
      {...(iconId ? { iconId: iconId as any } : {})}
      classes={{
        root: "fr-card--no-border",
      }}
    />
  );
}

