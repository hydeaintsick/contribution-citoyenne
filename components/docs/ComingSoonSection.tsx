"use client";

import { useEffect, useRef } from "react";
import { useDocsContext } from "../DocsLayout";

type ComingSoonSectionProps = {
  id: string;
  title: string;
  description: string;
};

export function ComingSoonSection({ id, title, description }: ComingSoonSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { registerSection } = useDocsContext();

  useEffect(() => {
    if (sectionRef.current) {
      registerSection(id, sectionRef.current);
    }
  }, [id, registerSection]);

  return (
    <section
      ref={sectionRef as any}
      id={id}
      className="fr-mb-8w"
      style={{ scrollMarginTop: "100px" }}
    >
      <h2 className="fr-h2 fr-mb-2w">{title}</h2>
      <div className="fr-alert fr-alert--info fr-mb-4w">
        <p className="fr-alert__title">Bientôt disponible</p>
        <p>{description}</p>
      </div>
    </section>
  );
}

