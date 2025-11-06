"use client";

import { useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { contactSchema, createMailtoLink, type ContactFormData } from "@/lib/contact";
import { motion } from "framer-motion";

export function ContactCta() {
  const [formData, setFormData] = useState<Partial<ContactFormData>>({
    name: "",
    email: "",
    function: "",
    commune: "",
    message: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.issues.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof ContactFormData] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const mailtoLink = createMailtoLink(result.data);
    window.location.href = mailtoLink;
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <section id="contact" className="fr-container fr-py-8w">
      <motion.div
        className="fr-grid-row fr-grid-row--center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
      >
        <div className="fr-col-12 fr-col-md-8">
          <h2 className="fr-h2 fr-text--center">Prêts à lancer Contribcit dans votre commune ?</h2>
          <p className="fr-text--lg fr-text--center fr-mt-2w">
            Écrivez-nous et planifions une démonstration.
          </p>

          {isSubmitted && (
            <Alert
              severity="success"
              title="Message envoyé"
              description="Votre client de messagerie s'ouvrira pour envoyer votre demande."
              className="fr-mt-4w"
            />
          )}

          <form onSubmit={handleSubmit} className="fr-mt-6w">
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-6">
                <Input
                  label="Nom"
                  nativeInputProps={{
                    type: "text",
                    value: formData.name || "",
                    onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                    required: true,
                  }}
                  state={errors.name ? "error" : "default"}
                  stateRelatedMessage={errors.name}
                />
              </div>
              <div className="fr-col-12 fr-col-md-6">
                <Input
                  label="Email professionnel"
                  nativeInputProps={{
                    type: "email",
                    value: formData.email || "",
                    onChange: (e) => setFormData({ ...formData, email: e.target.value }),
                    required: true,
                  }}
                  state={errors.email ? "error" : "default"}
                  stateRelatedMessage={errors.email}
                />
              </div>
              <div className="fr-col-12 fr-col-md-6">
                <Input
                  label="Fonction"
                  nativeInputProps={{
                    type: "text",
                    value: formData.function || "",
                    onChange: (e) => setFormData({ ...formData, function: e.target.value }),
                    required: true,
                  }}
                  state={errors.function ? "error" : "default"}
                  stateRelatedMessage={errors.function}
                />
              </div>
              <div className="fr-col-12 fr-col-md-6">
                <Input
                  label="Commune"
                  nativeInputProps={{
                    type: "text",
                    value: formData.commune || "",
                    onChange: (e) => setFormData({ ...formData, commune: e.target.value }),
                    required: true,
                  }}
                  state={errors.commune ? "error" : "default"}
                  stateRelatedMessage={errors.commune}
                />
              </div>
              <div className="fr-col-12">
                <div className={`fr-input-group ${errors.message ? "fr-input-group--error" : ""}`}>
                  <label className="fr-label" htmlFor="message">
                    Message <span className="fr-hint-text">(requis)</span>
                  </label>
                  <textarea
                    id="message"
                    className={`fr-input ${errors.message ? "fr-input--error" : ""}`}
                    value={formData.message || ""}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                  />
                  {errors.message && (
                    <p className="fr-message fr-message--error" id="message-error">
                      {errors.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="fr-col-12">
                <Checkbox
                  options={[
                    {
                      label: (
                        <>
                          J'accepte le traitement de mes données personnelles pour être contacté
                          par Contribcit.{" "}
                          <a href="/confidentialite" target="_blank" rel="noopener noreferrer">
                            En savoir plus
                          </a>
                        </>
                      ),
                      nativeInputProps: {
                        checked: formData.consent || false,
                        onChange: (e) =>
                          setFormData({ ...formData, consent: e.target.checked }),
                      },
                    },
                  ]}
                  state={errors.consent ? "error" : "default"}
                  stateRelatedMessage={errors.consent}
                />
              </div>
              <div className="fr-col-12 fr-text--center">
                <Button type="submit" iconId="fr-icon-mail-line">
                  Contacter Contribcit
                </Button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </section>
  );
}

