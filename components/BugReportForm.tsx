"use client";

import { useCallback, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  cubicBezier,
  type Transition,
} from "framer-motion";
import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { TurnstileWidget } from "./TurnstileWidget";

type BugReportTypeOption = "BUG" | "FONCTIONNALITE";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const typeOptions: Array<{ value: BugReportTypeOption; label: string }> = [
  { value: "BUG", label: "Bug" },
  { value: "FONCTIONNALITE", label: "Feature" },
];

type ScreenshotInfo = {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
  width: number;
  height: number;
};

type UploadState = "idle" | "uploading" | "error" | "success";
const MAX_SCREENSHOT_FILE_SIZE = 5 * 1024 * 1024;

const STEP_EASING = cubicBezier(0.16, 1, 0.3, 1);

const STEP_TRANSITION: Transition = {
  duration: 0.4,
  ease: STEP_EASING,
};

const FORM_STEPS = [
  {
    title: "Formulaire",
    next: "Confirmation",
  },
  {
    title: "Confirmation",
    next: undefined,
  },
] as const;

export function BugReportForm() {
  const [selectedType, setSelectedType] = useState<BugReportTypeOption>("BUG");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formState, setFormState] = useState<FormState>({ status: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<ScreenshotInfo | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState<string>("");

  const resetForm = useCallback(() => {
    setSelectedType("BUG");
    setTitle("");
    setDescription("");
    setScreenshot(null);
    setUploadState("idle");
    setUploadError(null);
    setTurnstileToken(null);
    setHoneypot("");
  }, []);

  const handleScreenshotButtonClick = () => {
    const isBusy = formState.status === "loading" || isSubmitting;

    if (isBusy || uploadState === "uploading") {
      return;
    }

    screenshotInputRef.current?.click();
  };

  const handleScreenshotChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const [file] = input.files ?? [];

    if (!file) {
      return;
    }

    input.value = "";

    if (!file.type.startsWith("image/")) {
      setUploadError("Veuillez sélectionner un fichier image.");
      setUploadState("error");
      setScreenshot(null);
      return;
    }

    if (file.size > MAX_SCREENSHOT_FILE_SIZE) {
      setUploadError("La taille maximale autorisée est de 5 Mo.");
      setUploadState("error");
      setScreenshot(null);
      return;
    }

    setUploadState("uploading");
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file, file.name);

    try {
      const response = await fetch("/api/uploads/cloudinary", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Le téléversement a échoué.");
      }

      const payload = (await response.json()) as ScreenshotInfo;
      setScreenshot(payload);
      setUploadState("success");
    } catch (error) {
      console.error("Screenshot upload failed", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Impossible de téléverser ce fichier.",
      );
      setUploadState("error");
      setScreenshot(null);
    }
  };

  const handleRemoveScreenshot = async () => {
    if (!screenshot) {
      return;
    }

    try {
      await fetch("/api/uploads/cloudinary", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId: screenshot.publicId }),
      });
    } catch (error) {
      console.error("Screenshot delete failed", error);
    } finally {
      setScreenshot(null);
      setUploadState("idle");
      setUploadError(null);
      if (screenshotInputRef.current) {
        screenshotInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validation Turnstile si requis
    const isTurnstileRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (isTurnstileRequired && !turnstileToken) {
      setFormState({
        status: "error",
        message:
          "Vérification de sécurité en cours. Veuillez patienter quelques instants avant de réessayer.",
      });
      return;
    }

    setIsSubmitting(true);
    setFormState({ status: "loading" });

    try {
      const response = await fetch("/api/bug-reports", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedType,
          title,
          description,
          screenshot: screenshot
            ? {
                url: screenshot.url,
                publicId: screenshot.publicId,
                width: screenshot.width,
                height: screenshot.height,
                bytes: screenshot.bytes,
              }
            : undefined,
          turnstileToken: turnstileToken || null,
          honeypot: honeypot || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const errorMessage =
          payload?.error ??
          "Impossible d’enregistrer votre signalement pour le moment.";

        throw new Error(errorMessage);
      }

      const payload = await response.json().catch(() => null);
      const successMessage =
        payload?.message ?? "Merci pour votre participation.";

      setFormState({ status: "success", message: successMessage });
      resetForm();
    } catch (error) {
      console.error("Bug report submission failed", error);
      setFormState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible d’enregistrer votre signalement.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = formState.status === "error";
  const isLoading = formState.status === "loading" || isSubmitting;
  const isSuccess = formState.status === "success";
  const currentStep = isSuccess ? 2 : 1;
  const currentStepMeta = FORM_STEPS[currentStep - 1];
  
  // Check if Turnstile is required (configured) but token is missing
  const isTurnstileRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isTurnstileValid = !isTurnstileRequired || !!turnstileToken;
  const isSubmitDisabled = isLoading || !isTurnstileValid;

  const handleNewReport = useCallback(() => {
    resetForm();
    setFormState({ status: "idle" });
  }, [resetForm]);

  return (
    <div className="fr-container--fluid">
      <Stepper
        currentStep={currentStep}
        stepCount={FORM_STEPS.length}
        title={currentStepMeta.title}
        nextTitle={currentStepMeta.next}
        className="fr-mb-4w"
      />

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={STEP_TRANSITION}
            className="fr-p-4w fr-background-default--grey fr-radius--md"
            onSubmit={handleSubmit}
          >
      <fieldset className="fr-fieldset" aria-labelledby="bug-report-fieldset-title">
        <legend className="fr-fieldset__legend" id="bug-report-fieldset-title">
          Type de retour
        </legend>
        <div className="fr-fieldset__content fr-grid-row fr-grid-row--gutters">
          {typeOptions.map((option) => (
            <div key={option.value} className="fr-col-12 fr-col-md-6">
              <div className="fr-radio-group fr-radio-rich">
                <input
                  id={`bug-type-${option.value}`}
                  type="radio"
                  name="bug-type"
                  value={option.value}
                  checked={selectedType === option.value}
                  onChange={() => setSelectedType(option.value)}
                  disabled={isLoading}
                />
                <label className="fr-label" htmlFor={`bug-type-${option.value}`}>
                  {option.label}
                </label>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="fr-input-group fr-mt-4w">
        <label className="fr-label" htmlFor="bug-title">
          Objet
          <span className="fr-hint-text">
            Par exemple : « Impossible de contacter le support ».
          </span>
        </label>
        <input
          id="bug-title"
          className="fr-input"
          required
          minLength={4}
          maxLength={160}
          type="text"
          value={title}
          disabled={isLoading}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="fr-input-group fr-mt-4w">
        <label className="fr-label" htmlFor="bug-description">
          Description
          <span className="fr-hint-text">
            Détaillez le problème rencontré ou l’évolution souhaitée.
          </span>
        </label>
        <textarea
          id="bug-description"
          className="fr-input"
          required
          minLength={12}
          maxLength={2000}
          rows={8}
          value={description}
          disabled={isLoading}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="fr-mt-4w fr-flow contribcit-upload">
        <div className="contribcit-upload__header">
          <p className="fr-text--md fr-mb-0 contribcit-upload__title">
            Capture d’écran (optionnel)
          </p>
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0 contribcit-upload__hint">
            Formats acceptés : JPG, PNG, WebP. Taille maximale 5 Mo (compression
            automatique).
          </p>
        </div>

        <input
          ref={screenshotInputRef}
          className="contribcit-upload__input"
          type="file"
          id="bug-screenshot"
          name="bug-screenshot"
          accept="image/*"
          onChange={handleScreenshotChange}
          disabled={isLoading || uploadState === "uploading"}
          hidden
        />

        <Button
          type="button"
          priority="secondary"
          iconId={
            uploadState === "uploading"
              ? "fr-icon-refresh-line"
              : "fr-icon-upload-line"
          }
          onClick={handleScreenshotButtonClick}
          disabled={isLoading || uploadState === "uploading"}
          className="fr-width-full contribcit-upload__button"
        >
          {uploadState === "uploading"
            ? "Téléversement en cours…"
            : screenshot
              ? "Remplacer l’image"
              : "Choisir une image"}
        </Button>

        {uploadState === "error" && uploadError ? (
          <p className="fr-text--sm fr-text-mention--error contribcit-upload__message">
            {uploadError}
          </p>
        ) : null}
        {uploadState === "success" && screenshot ? (
          <p className="fr-text--sm fr-text-mention--success contribcit-upload__message">
            Image importée avec succès.
          </p>
        ) : null}

        {screenshot ? (
          <div className="fr-card fr-card--sm fr-card--horizontal fr-card--shadow fr-mt-2w">
            <div className="fr-card__img">
              <img
                src={screenshot.url}
                alt="Aperçu de la capture importée"
                className="fr-responsive-img"
                loading="lazy"
              />
            </div>
            <div className="fr-card__body">
              <h3 className="fr-card__title fr-h6">Capture enregistrée</h3>
              <p className="fr-card__desc fr-text--sm fr-mb-2w">
                {screenshot.format.toUpperCase()} —{" "}
                {(screenshot.bytes / 1024).toFixed(0)} ko
              </p>
              <div className="fr-tags-group fr-mb-2w">
                <Tag small>{screenshot.width} px</Tag>
                <Tag small>{screenshot.height} px</Tag>
              </div>
              <div className="fr-btns-group fr-btns-group--inline-sm">
                <a
                  className="fr-link"
                  href={screenshot.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ouvrir dans un nouvel onglet
                </a>
                <Button
                  type="button"
                  priority="secondary"
                  iconId="fr-icon-delete-line"
                  onClick={handleRemoveScreenshot}
                  disabled={isLoading}
                >
                  Supprimer la capture
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {hasErrors && formState.status === "error" ? (
        <div className="fr-alert fr-alert--error fr-mt-4w" role="alert">
          <p className="fr-alert__title">Une erreur est survenue</p>
          <p className="fr-alert__desc">{formState.message}</p>
        </div>
      ) : null}

      {/* Honeypot field - invisible to humans, visible to bots */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: "0",
          pointerEvents: "none",
        }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Turnstile widget - invisible, executes automatically */}
      <div className="fr-mt-2w">
        <TurnstileWidget
          onSuccess={(token) => {
            setTurnstileToken(token);
          }}
          onError={(error) => {
            console.warn("Turnstile error", error);
            // Don't block submission if Turnstile fails
            // The server will handle the validation
          }}
          onExpired={() => {
            setTurnstileToken(null);
          }}
          theme="auto"
        />
      </div>

      <div className="fr-btns-group fr-btns-group--inline-md fr-mt-4w">
        <button className="fr-btn" type="submit" disabled={isSubmitDisabled}>
          {isLoading ? "Envoi en cours…" : "Soumettre"}
        </button>
        <button
          className="fr-btn fr-btn--tertiary"
          type="button"
          onClick={async () => {
            if (screenshot) {
              await handleRemoveScreenshot();
            }
            resetForm();
            setFormState({ status: "idle" });
          }}
          disabled={isLoading}
        >
          Effacer le formulaire
        </button>
      </div>
    </motion.form>
        ) : (
          <motion.section
            key="confirmation"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={STEP_TRANSITION}
            className="fr-flow fr-pb-4w"
            aria-labelledby="bug-report-confirmation"
          >
            <div className="fr-callout">
              <h2
                id="bug-report-confirmation"
                className="fr-callout__title fr-h4"
              >
                Merci pour votre signalement
              </h2>
              <p className="fr-text--sm">
                {formState.status === "success" && formState.message
                  ? formState.message
                  : "Votre signalement a bien été enregistré. Il sera étudié par l'équipe produit dans les meilleurs délais."}
              </p>
              <p className="fr-text--sm fr-mb-0">
                Vous pouvez consulter l'avancement des retours sur notre{" "}
                <a
                  href="/suivi-des-bugs"
                  className="fr-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  suivi des bugs publics
                </a>
                .
              </p>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--right fr-mt-4w">
              <div className="fr-col-12 fr-col-sm-auto">
                <Button
                  priority="primary"
                  size="medium"
                  iconId="fr-icon-add-line"
                  onClick={handleNewReport}
                >
                  Faire un nouveau signalement
                </Button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}


