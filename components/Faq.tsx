"use client";

import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { ReactNode } from "react";

export interface FaqItem {
  question: string;
  answer: string | ReactNode;
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
            {items.map((item, index) => {
              // Préparer le contenu de la réponse
              const answerContent: ReactNode = typeof item.answer === "string" ? (
                <p>{item.answer}</p>
              ) : (
                item.answer
              );
              
              // Ne pas rendre l'accordion si la réponse est vide
              if (!answerContent) {
                return null;
              }
              
              return (
                <Accordion
                  key={`faq-${index}`}
                  label={item.question}
                  className="fr-mb-2w"
                >
                  {answerContent}
                </Accordion>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

