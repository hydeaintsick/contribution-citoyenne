"use client";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqProps {
  items: FaqItem[];
}

export function Faq({ items }: FaqProps) {
  return (
    <section className="fr-container fr-py-8w fr-background-alt--grey">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-10">
          <h2 className="fr-h2 fr-text--center">Questions fréquentes</h2>
          <div className="fr-mt-6w">
            {items.map((item, index) => (
              <Accordion
                key={index}
                label={item.question}
                className="fr-mb-2w"
              >
                <p>{item.answer}</p>
              </Accordion>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

