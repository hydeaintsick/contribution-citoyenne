"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import {
  CONTACT_FORM_COOLDOWN_MS,
  contactSchema,
  type ContactFormData,
  type ContactType,
} from "@/lib/contact";
import { motion } from "framer-motion";

const COOLDOWN_STORAGE_KEY_PREFIX = "contribcit-contact-cooldown";

const cooldownDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function getCooldownStorageKey(fingerprint: string) {
  return `${COOLDOWN_STORAGE_KEY_PREFIX}:${fingerprint}`;
}

function parseCooldownDate(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatRemainingHours(targetDate: Date) {
  const diffMs = targetDate.getTime() - Date.now();
  if (diffMs <= 0) {
    return "0 heure";
  }
  const hours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (hours >= 24) {
    const days = Math.ceil(hours / 24);
    return `${days} jour${days > 1 ? "s" : ""}`;
  }
  return `${hours} heure${hours > 1 ? "s" : ""}`;
}

export function ContactCta() {
  const [formData, setFormData] = useState<Partial<ContactFormData>>({
    contactType: "commune",
    name: "",
    email: "",
    function: "",
    commune: "",
    organisme: "",
    message: "",
    consent: false,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [isFingerprintLoading, setIsFingerprintLoading] = useState(true);
  const [fingerprintError, setFingerprintError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);

  const isCooldownActive = useMemo(
    () => (cooldownUntil ? cooldownUntil.getTime() > Date.now() : false),
    [cooldownUntil]
  );
  const isFormLocked =
    isSubmitting ||
    isCooldownActive ||
    isFingerprintLoading ||
    Boolean(fingerprintError);
  const cooldownDescription = useMemo(() => {
    if (!cooldownUntil || !isCooldownActive) {
      return null;
    }
    return `Prochaine demande possible dans ${formatRemainingHours(
      cooldownUntil
    )} (à partir du ${cooldownDateFormatter.format(cooldownUntil)}).`;
  }, [cooldownUntil, isCooldownActive]);

  useEffect(() => {
    let isMounted = true;

    FingerprintJS.load()
      .then((fp) => fp.get())
      .then((result) => {
        if (!isMounted) {
          return;
        }
        const visitorId = result.visitorId;
        setFingerprint(visitorId);

        try {
          const storedValue = window.localStorage.getItem(
            getCooldownStorageKey(visitorId)
          );
          const storedDate = parseCooldownDate(storedValue);

          if (storedDate && storedDate.getTime() > Date.now()) {
            setCooldownUntil(storedDate);
          } else if (storedValue) {
            window.localStorage.removeItem(getCooldownStorageKey(visitorId));
          }
        } catch (error) {
          console.warn("Failed to read stored contact cooldown", error);
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        console.error("Failed to initialize FingerprintJS", error);
        setFingerprintError(
          "Impossible d'initialiser la protection anti-spam. Veuillez rafraîchir la page ou réessayer plus tard."
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsFingerprintLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!cooldownUntil || !fingerprint) {
      return;
    }

    const remainingMs = cooldownUntil.getTime() - Date.now();

    if (remainingMs <= 0) {
      try {
        window.localStorage.removeItem(getCooldownStorageKey(fingerprint));
      } catch (error) {
        console.warn("Failed to clear expired contact cooldown", error);
      }
      setCooldownUntil(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCooldownUntil(null);
      try {
        window.localStorage.removeItem(getCooldownStorageKey(fingerprint));
      } catch (error) {
        console.warn("Failed to clear contact cooldown after timeout", error);
      }
    }, remainingMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [cooldownUntil, fingerprint]);

  const resetForm = () => {
    setFormData({
      contactType: "commune",
      name: "",
      email: "",
      function: "",
      commune: "",
      organisme: "",
      message: "",
      consent: false,
    });
  };

  const applyCooldown = (date: Date) => {
    if (Number.isNaN(date.getTime())) {
      return;
    }
    setCooldownUntil(date);
    if (!fingerprint) {
      return;
    }
    try {
      window.localStorage.setItem(
        getCooldownStorageKey(fingerprint),
        date.toISOString()
      );
    } catch (error) {
      console.warn("Failed to persist contact cooldown", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmissionError(null);
    setIsSubmitted(false);

    if (isFingerprintLoading) {
      setSubmissionError(
        "Initialisation en cours. Merci de patienter quelques instants."
      );
      return;
    }

    if (isCooldownActive) {
      setSubmissionError(
        cooldownDescription ??
          "Vous avez déjà envoyé une demande récemment. Merci de patienter avant de réessayer."
      );
      return;
    }

    if (fingerprintError) {
      setSubmissionError(fingerprintError);
      return;
    }

    if (!fingerprint) {
      setSubmissionError(
        fingerprintError ??
          "Initialisation en cours. Merci de patienter quelques instants avant de réessayer."
      );
      return;
    }

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

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact-tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...result.data,
          fingerprint,
        }),
      });

      type ContactSubmissionResponse =
        | { error: string; retryAfter?: string }
        | { id: string; retryAfter?: string };

      const payload = (await response
        .json()
        .catch(() => null)) as ContactSubmissionResponse | null;

      if (!response.ok) {
        if (payload && "retryAfter" in payload && payload.retryAfter) {
          const retryDate = parseCooldownDate(payload.retryAfter);
          if (retryDate) {
            applyCooldown(retryDate);
          }
        }
        let message =
          "Une erreur est survenue lors de l'envoi de votre message. Merci de réessayer.";
        if (payload && "error" in payload) {
          message = payload.error;
        }
        throw new Error(message);
      }

      if (payload && "retryAfter" in payload && payload.retryAfter) {
        const retryDate = parseCooldownDate(payload.retryAfter);
        if (retryDate) {
          applyCooldown(retryDate);
        }
      } else {
        applyCooldown(new Date(Date.now() + CONTACT_FORM_COOLDOWN_MS));
      }

      resetForm();
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'envoi de votre message. Merci de réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
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
          <h2 className="fr-h2 fr-text--center">Intéressé par Contribcit ?</h2>
          <p className="fr-text--lg fr-text--center fr-mt-2w">
            Écrivez-nous et planifions une démonstration.
          </p>

          <form onSubmit={handleSubmit} className="fr-mt-6w">
            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12">
                <fieldset className="fr-fieldset">
                  <legend className="fr-fieldset__legend fr-text--regular">
                    Vous êtes <span className="fr-hint-text">(requis)</span>
                  </legend>
                  <div className="fr-fieldset__content">
                    <div className="fr-radio-group">
                      <input
                        type="radio"
                        id="contact-type-commune"
                        name="contactType"
                        value="commune"
                        disabled={isFormLocked}
                        checked={formData.contactType === "commune"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactType: e.target.value as ContactType,
                            organisme: "",
                          })
                        }
                      />
                      <label
                        className="fr-label"
                        htmlFor="contact-type-commune"
                      >
                        Une commune
                      </label>
                    </div>
                    <div className="fr-radio-group">
                      <input
                        type="radio"
                        id="contact-type-organisme"
                        name="contactType"
                        value="organisme_financier"
                        disabled={isFormLocked}
                        checked={formData.contactType === "organisme_financier"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactType: e.target.value as ContactType,
                            commune: "",
                          })
                        }
                      />
                      <label
                        className="fr-label"
                        htmlFor="contact-type-organisme"
                      >
                        Un organisme financier qui souhaite financer le projet
                      </label>
                    </div>
                  </div>
                  {errors.contactType && (
                    <p
                      className="fr-message fr-message--error"
                      id="contact-type-error"
                    >
                      {errors.contactType}
                    </p>
                  )}
                </fieldset>
              </div>
              <div className="fr-col-12 fr-col-md-6">
                <Input
                  label="Nom"
                  nativeInputProps={{
                    type: "text",
                    value: formData.name || "",
                    onChange: (e) =>
                      setFormData({ ...formData, name: e.target.value }),
                    required: true,
                    disabled: isFormLocked,
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
                    onChange: (e) =>
                      setFormData({ ...formData, email: e.target.value }),
                    required: true,
                    disabled: isFormLocked,
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
                    onChange: (e) =>
                      setFormData({ ...formData, function: e.target.value }),
                    required: true,
                    disabled: isFormLocked,
                  }}
                  state={errors.function ? "error" : "default"}
                  stateRelatedMessage={errors.function}
                />
              </div>
              <div className="fr-col-12 fr-col-md-6">
                {formData.contactType === "commune" ? (
                  <Input
                    label="Commune"
                    nativeInputProps={{
                      type: "text",
                      value: formData.commune || "",
                      onChange: (e) =>
                        setFormData({ ...formData, commune: e.target.value }),
                      required: true,
                      disabled: isFormLocked,
                    }}
                    state={errors.commune ? "error" : "default"}
                    stateRelatedMessage={errors.commune}
                  />
                ) : (
                  <Input
                    label="Nom de l'organisme"
                    nativeInputProps={{
                      type: "text",
                      value: formData.organisme || "",
                      onChange: (e) =>
                        setFormData({ ...formData, organisme: e.target.value }),
                      required: true,
                      disabled: isFormLocked,
                    }}
                    state={errors.organisme ? "error" : "default"}
                    stateRelatedMessage={errors.organisme}
                  />
                )}
              </div>
              <div className="fr-col-12">
                <div
                  className={`fr-input-group ${
                    errors.message ? "fr-input-group--error" : ""
                  }`}
                >
                  <label className="fr-label" htmlFor="message">
                    Message <span className="fr-hint-text">(requis)</span>
                  </label>
                  <textarea
                    id="message"
                    className={`fr-input ${
                      errors.message ? "fr-input--error" : ""
                    }`}
                    value={formData.message || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                    rows={5}
                    disabled={isFormLocked}
                  />
                  {errors.message && (
                    <p
                      className="fr-message fr-message--error"
                      id="message-error"
                    >
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
                          J'accepte le traitement de mes données personnelles
                          pour être contacté par Contribcit.{" "}
                          <a
                            href="/confidentialite"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            En savoir plus
                          </a>
                        </>
                      ),
                      nativeInputProps: {
                        checked: formData.consent || false,
                        onChange: (e) =>
                          setFormData({
                            ...formData,
                            consent: e.target.checked,
                          }),
                        disabled: isFormLocked,
                      },
                    },
                  ]}
                  state={errors.consent ? "error" : "default"}
                  stateRelatedMessage={errors.consent}
                />
              </div>
              <div className="fr-col-12 fr-text--center">
                <Button
                  type="submit"
                  iconId="fr-icon-mail-line"
                  disabled={
                    isFormLocked || !fingerprint || Boolean(fingerprintError)
                  }
                >
                  Contacter Contribcit
                </Button>
              </div>
            </div>
          </form>
          {(fingerprintError || isFingerprintLoading) && (
            <Alert
              severity="info"
              title="Initialisation en cours"
              description={
                fingerprintError ??
                "Nous préparons le formulaire. Merci de patienter quelques instants."
              }
              className="fr-mt-4w"
            />
          )}
          {submissionError && (
            <Alert
              severity="error"
              title="Impossible d'envoyer votre message"
              description={submissionError}
              className="fr-mt-4w"
              onClose={() => setSubmissionError(null)}
            />
          )}
          {/* {isSubmitted && (
            <Alert
              severity="success"
              title="Message envoyé"
              description="Merci ! Votre demande a bien été envoyée. Nous reviendrons vers vous rapidement."
              className="fr-mt-4w"
            />
          )} */}
          {isCooldownActive && cooldownDescription && (
            <Alert
              severity="info"
              title="Demande envoyée"
              description={cooldownDescription}
              className="fr-mt-4w"
            />
          )}
        </div>
      </motion.div>
    </section>
  );
}
