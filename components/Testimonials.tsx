"use client";

import { motion } from "framer-motion";
import { Card } from "@codegouvfr/react-dsfr/Card";

export interface Testimonial {
  name: string;
  function: string;
  text: string;
  commune?: string;
}

export interface TestimonialsProps {
  testimonials: Testimonial[];
}

export function Testimonials({ testimonials }: TestimonialsProps) {
  return (
    <section className="fr-container fr-py-8w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12">
          <h2 className="fr-h2 fr-text--center">Ils nous font confiance</h2>
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters fr-mt-6w">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            className="fr-col-12 fr-col-md-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              title={testimonial.name}
              desc={
                <>
                  <p className="fr-text--sm fr-text--bold fr-mb-1w">{testimonial.function}</p>
                  {testimonial.commune && (
                    <p className="fr-text--xs fr-text--grey fr-mb-2w">{testimonial.commune}</p>
                  )}
                  <p className="fr-text--sm fr-mt-2w">&ldquo;{testimonial.text}&rdquo;</p>
                </>
              }
              classes={{
                root: "fr-card--no-border fr-card--shadow",
              }}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

