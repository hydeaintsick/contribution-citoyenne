"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, cubicBezier, type Transition } from "framer-motion";
import { Stepper } from "@codegouvfr/react-dsfr/Stepper";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import { Tag } from "@codegouvfr/react-dsfr/Tag";

type ReportType = "alert" | "suggestion";

type Category = {
  value: string;
  label: string;
  subcategories: string[];
};

type PhotoUploadInfo = {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
  width: number;
  height: number;
};

const REPORT_STEPS = [
  {
    title: "Type de remontée",
    next: "Catégorisation",
  },
  {
    title: "Catégorisation",
    next: "Détails",
  },
  {
    title: "Détails",
    next: undefined,
  },
] as const;

const STEP_EASING = cubicBezier(0.16, 1, 0.3, 1);

const STEP_TRANSITION: Transition = {
  duration: 0.4,
  ease: STEP_EASING,
};

const categories: Category[] = [
  {
    value: "espaces-publics",
    label: "Espaces publics",
    subcategories: [
      "Éclairage défectueux",
      "Parcs et jardins",
      "Aires de jeux",
      "Équipements sportifs",
    ],
  },
  {
    value: "proprete",
    label: "Propreté",
    subcategories: [
      "Déchets et dépôts sauvages",
      "Graffitis",
      "Nuisances animales",
      "Poubelles débordantes",
    ],
  },
  {
    value: "securite",
    label: "Sécurité",
    subcategories: [
      "Incivilités",
      "Éclairage public",
      "Trafic suspect",
      "Signalisation dangereuse",
    ],
  },
  {
    value: "transports",
    label: "Transports",
    subcategories: [
      "Arrêts de bus",
      "Pistes cyclables",
      "Stationnement",
      "Horaires et fréquence",
    ],
  },
  {
    value: "voirie",
    label: "Voirie",
    subcategories: [
      "Nid-de-poule",
      "Trottoirs",
      "Signalisation routière",
      "Chantiers",
    ],
  },
].sort((a, b) => a.label.localeCompare(b.label, "fr"));

const MIN_DETAILS_LENGTH = 12;

export type CitizenReportTunnelProps = {
  communeId: string;
  communeName: string;
  communeWebsite?: string | null;
};

export function CitizenReportTunnel({
  communeId,
  communeName,
  communeWebsite,
}: CitizenReportTunnelProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photoUploadState, setPhotoUploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [photoUploadInfo, setPhotoUploadInfo] = useState<PhotoUploadInfo | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [autoAdvanceMessage, setAutoAdvanceMessage] = useState<string | null>(null);
  const [geolocationStatus, setGeolocationStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAutoAdvance = useCallback(() => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
  }, []);

  const resetWizard = useCallback(() => {
    resetAutoAdvance();
    setCurrentStep(1);
    setReportType(null);
    setSelectedCategory("");
    setSelectedSubcategory("");
    setDetails("");
    setLocation("");
    setCoordinates(null);
    setPhotoUploadInfo(null);
    setPhotoUploadState("idle");
    setPhotoUploadError(null);
    setAutoAdvanceMessage(null);
    setGeolocationStatus("idle");
    setGeolocationError(null);
    setSubmissionState("idle");
    setSubmissionError(null);
  }, [resetAutoAdvance]);

  const handleSelectType = useCallback(
    (type: ReportType) => {
      resetAutoAdvance();
      setReportType(type);

      if (type === "alert") {
        setAutoAdvanceMessage(null);
        setCurrentStep(1);
        return;
      }

      setAutoAdvanceMessage("Merci, votre suggestion est prise en compte.");
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        setAutoAdvanceMessage(null);
        setCurrentStep(2);
      }, 800);
    },
    [resetAutoAdvance],
  );

  const handleAlertContinue = useCallback(() => {
    setCurrentStep(2);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
    setSelectedSubcategory("");
    resetAutoAdvance();
    setAutoAdvanceMessage(null);
  }, [resetAutoAdvance]);

  const handleSubcategoryChange = useCallback(
    (value: string) => {
      setSelectedSubcategory(value);

      if (!value) {
        resetAutoAdvance();
        setAutoAdvanceMessage(null);
        return;
      }

      setAutoAdvanceMessage("Catégorisation enregistrée.");
      resetAutoAdvance();
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        setAutoAdvanceMessage(null);
        setCurrentStep(3);
      }, 800);
    },
    [resetAutoAdvance],
  );

  const handleBackToType = useCallback(() => {
    resetAutoAdvance();
    setAutoAdvanceMessage(null);
    setCurrentStep(1);
  }, [resetAutoAdvance]);

  const handleBackToCategory = useCallback(() => {
    resetAutoAdvance();
    setAutoAdvanceMessage(null);
    setCurrentStep(2);
  }, [resetAutoAdvance]);

  const selectedCategoryLabel = useMemo(
    () => categories.find((category) => category.value === selectedCategory)?.label ?? "",
    [selectedCategory],
  );

  const selectedSubcategoryOptions = useMemo(() => {
    const category = categories.find(({ value }) => value === selectedCategory);
    return category?.subcategories ?? [];
  }, [selectedCategory]);

  const trimmedDetails = details.trim();
  const isSubmitDisabled =
    submissionState === "loading" ||
    !reportType ||
    !selectedCategory ||
    !selectedSubcategory ||
    trimmedDetails.length < MIN_DETAILS_LENGTH;
  const isFormLocked = submissionState === "loading" || submissionState === "success";

  const handlePhotoChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const [file] = input.files ?? [];

      if (!file) {
        return;
      }

      input.value = "";

      if (!file.type.startsWith("image/")) {
        setPhotoUploadError("Le fichier sélectionné n’est pas une image.");
        setPhotoUploadState("error");
        setPhotoUploadInfo(null);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setPhotoUploadError("La taille maximale autorisée est de 5 Mo.");
        setPhotoUploadState("error");
        setPhotoUploadInfo(null);
        return;
      }

      setPhotoUploadState("uploading");
      setPhotoUploadError(null);
      setPhotoUploadInfo(null);

      const formData = new FormData();
      formData.append("file", file);

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

        const payload = (await response.json()) as PhotoUploadInfo;
        setPhotoUploadInfo(payload);
        setPhotoUploadState("success");
      } catch (error) {
        console.error("Photo upload error", error);
        setPhotoUploadError(
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant le téléversement.",
        );
        setPhotoUploadState("error");
        setPhotoUploadInfo(null);
      }
    },
    [],
  );

  const handleRemovePhoto = useCallback(async () => {
    if (!photoUploadInfo) {
      return;
    }

    try {
      await fetch("/api/uploads/cloudinary", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publicId: photoUploadInfo.publicId,
        }),
      });
    } catch (error) {
      console.error("Failed to delete Cloudinary asset", error);
    } finally {
      setPhotoUploadInfo(null);
      setPhotoUploadState("idle");
      setPhotoUploadError(null);
    }
  }, [photoUploadInfo]);

  const handleLocate = useCallback(() => {
    if (submissionState === "loading" || submissionState === "success") {
      return;
    }

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeolocationStatus("error");
      setGeolocationError("La géolocalisation n’est pas disponible sur cet appareil.");
      return;
    }

    setGeolocationStatus("loading");
    setGeolocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const label = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
        setLocation(label);
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeolocationStatus("success");
      },
      (error) => {
        console.error("Geolocation error", error);
        setGeolocationStatus("error");
        setGeolocationError("Impossible de récupérer votre position. Renseignez le lieu manuellement.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 20_000,
        timeout: 10_000,
      },
    );
  }, [submissionState]);

  const currentStepMeta = REPORT_STEPS[currentStep - 1];
  const trimmedCommuneWebsite = communeWebsite?.trim();

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!reportType || !selectedCategory || !selectedSubcategory) {
        setSubmissionState("error");
        setSubmissionError(
          "Merci de sélectionner un type de remontée ainsi qu’une catégorie et une sous-catégorie.",
        );
        return;
      }

      const cleanedDetails = details.trim();

      if (cleanedDetails.length < MIN_DETAILS_LENGTH) {
        setSubmissionState("error");
        setSubmissionError(
          `Le descriptif doit comporter au moins ${MIN_DETAILS_LENGTH} caractères.`,
        );
        return;
      }

      setSubmissionState("loading");
      setSubmissionError(null);

      try {
        const response = await fetch("/api/contrib/reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            communeId,
            type: reportType,
            category: {
              value: selectedCategory,
              label: selectedCategoryLabel,
            },
            subcategory: selectedSubcategory,
            details: cleanedDetails,
            location: location.trim() || null,
            coordinates: coordinates
              ? {
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                }
              : null,
            photo: photoUploadInfo
              ? {
                  url: photoUploadInfo.url,
                  publicId: photoUploadInfo.publicId,
                }
              : null,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error ?? "L’envoi a échoué. Merci de réessayer.");
        }

        setSubmissionState("success");
      } catch (error) {
        console.error("Report submission failed", error);
        setSubmissionState("error");
        setSubmissionError(
          error instanceof Error ? error.message : "Une erreur inattendue est survenue.",
        );
      }
    },
    [
      communeId,
      details,
      location,
      photoUploadInfo,
      coordinates,
      reportType,
      selectedCategory,
      selectedCategoryLabel,
      selectedSubcategory,
    ],
  );

  return (
    <div className="fr-container fr-container--fluid fr-px-2w fr-px-md-4w">
      <Stepper
        currentStep={currentStep}
        stepCount={REPORT_STEPS.length}
        title={currentStepMeta.title}
        nextTitle={currentStepMeta.next}
        className="fr-mb-4w"
      />

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.section
            key="step-1"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={STEP_TRANSITION}
            className="fr-flow fr-pb-4w"
            aria-labelledby="citizen-report-step-1"
          >
            <div className="fr-callout">
              <h1 id="citizen-report-step-1" className="fr-callout__title fr-h4">
                Bienvenue sur le portail citoyen de la ville de{" "}
                {trimmedCommuneWebsite ? (
                  <a
                    href={trimmedCommuneWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="fr-link fr-link--md"
                  >
                    {communeName}
                  </a>
                ) : (
                  communeName
                )}
              </h1>
              <p className="fr-text--sm fr-mb-0">
                Signalez un problème ou partagez une idée pour améliorer la vie locale. Vous
                pouvez à tout moment revenir en arrière avant l’envoi.
              </p>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-mt-4w">
              <div className="fr-col-12 fr-col-sm-8 fr-col-md-5 fr-col-lg-4">
                <Button
                  priority="primary"
                  size="large"
                  className="fr-width-full contribcit-alert-button"
                  onClick={() => handleSelectType("alert")}
                  iconId="fr-icon-flashlight-line"
                >
                  Alerter
                </Button>
              </div>
              <div className="fr-col-12 fr-col-sm-8 fr-col-md-5 fr-col-lg-4">
                <Button
                  priority="secondary"
                  size="large"
                  className="fr-width-full"
                  onClick={() => handleSelectType("suggestion")}
                  iconId="fr-icon-sparkling-2-line"
                >
                  Suggérer
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {reportType === "alert" && (
                <motion.div
                  key="alert-warning"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={STEP_TRANSITION}
                  className="fr-mt-4w"
                >
                  <Alert
                    severity="warning"
                    title="Alerte urgente"
                    description={
                      <>
                        Attention, vous êtes témoin d’une situation d’urgence. Composez le{" "}
                        <strong>17</strong> pour la Police, le <strong>18</strong> pour les Pompiers,
                        ou le <strong>15</strong> pour le SAMU. Si la situation n’est pas immédiate,
                        poursuivez pour alerter votre mairie.
                      </>
                    }
                  />
                  <div className="fr-mt-2w">
                    <Button
                      priority="primary"
                      size="medium"
                      onClick={handleAlertContinue}
                      iconId="fr-icon-arrow-right-line"
                    >
                      Continuer
                    </Button>
                  </div>
                </motion.div>
              )}

              {autoAdvanceMessage && reportType === "suggestion" && (
                <motion.div
                  key="suggestion-confirm"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={STEP_TRANSITION}
                  className="fr-mt-4w"
                >
                  <Alert severity="success" small title="C’est noté" description={autoAdvanceMessage} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {currentStep === 2 && (
          <motion.section
            key="step-2"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={STEP_TRANSITION}
            className="fr-flow fr-pb-4w"
            aria-labelledby="citizen-report-step-2"
          >
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-mb-3w">
              <div className="fr-col-auto">
                <Button
                  priority="tertiary"
                  iconId="fr-icon-arrow-left-line"
                  onClick={handleBackToType}
                >
                  Revenir à l’étape précédente
                </Button>
              </div>
              <div className="fr-col">
                <h2 id="citizen-report-step-2" className="fr-h4 fr-mt-0 fr-mb-0">
                  Précisez la catégorie concernée
                </h2>
              </div>
            </div>

            <Select
              label="Catégorie"
              nativeSelectProps={{
                value: selectedCategory,
                onChange: (event) => handleCategoryChange(event.target.value),
                required: true,
              }}
            >
              <option value="">Sélectionnez une catégorie</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Select>

            <AnimatePresence>
              {selectedCategory && (
                <motion.div
                  key="subcategory"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={STEP_TRANSITION}
                >
                  <Select
                    label="Sous-catégorie"
                    nativeSelectProps={{
                      value: selectedSubcategory,
                      onChange: (event) => handleSubcategoryChange(event.target.value),
                      required: true,
                    }}
                  >
                    <option value="">Choisissez une précision</option>
                    {selectedSubcategoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {autoAdvanceMessage && selectedSubcategory && (
                <motion.div
                  key="category-confirm"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={STEP_TRANSITION}
                >
                  <Alert severity="success" small title="Merci" description={autoAdvanceMessage} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {currentStep === 3 && (
          <motion.section
            key="step-3"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={STEP_TRANSITION}
            className="fr-flow fr-pb-4w"
            aria-labelledby="citizen-report-step-3"
          >
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-mb-3w">
              <div className="fr-col-auto">
                <Button
                  priority="tertiary"
                  iconId="fr-icon-arrow-left-line"
                  onClick={handleBackToCategory}
                  disabled={submissionState === "loading"}
                >
                  Modifier la catégorisation
                </Button>
              </div>
              <div className="fr-col">
                <h2 id="citizen-report-step-3" className="fr-h4 fr-mt-0 fr-mb-0">
                  Vous y êtes presque
                </h2>
              </div>
            </div>

            <form className="fr-flow" onSubmit={handleSubmit} noValidate>
              {submissionState === "success" && (
                <Alert
                  severity="success"
                  title="Merci pour votre signalement"
                  description="Votre remontée a été transmise à la mairie. Vous pouvez en soumettre une autre si nécessaire."
                />
              )}

              {submissionState === "error" && submissionError && (
                <Alert
                  severity="error"
                  title="Impossible d’envoyer"
                  description={submissionError}
                />
              )}

              <div className="fr-box fr-box--grey fr-p-3w">
                <p className="fr-text--sm fr-mb-2w">
                  <strong>Récapitulatif</strong>
                </p>
                <div className="fr-tags-group">
                  {reportType && (
                    <Tag small>{reportType === "alert" ? "Alerte" : "Suggestion"}</Tag>
                  )}
                  {selectedCategoryLabel && <Tag small>{selectedCategoryLabel}</Tag>}
                  {selectedSubcategory && <Tag small>{selectedSubcategory}</Tag>}
                </div>
              </div>

              <Input
                label="Décrivez la situation"
                hintText={`Quelques lignes suffisent pour comprendre le contexte (minimum ${MIN_DETAILS_LENGTH} caractères).`}
                textArea
                disabled={isFormLocked}
                nativeTextAreaProps={{
                  value: details,
                  onChange: (event) => setDetails(event.target.value),
                  rows: 6,
                  required: true,
                  placeholder: "Expliquez ce qui se passe ou l’amélioration proposée…",
                  minLength: MIN_DETAILS_LENGTH,
                  disabled: isFormLocked,
                }}
              />

              <Input
                label="Lieu concerné"
                hintText="Adresse, nom de rue ou repère à proximité."
                addon="Optionnel"
                disabled={isFormLocked}
                nativeInputProps={{
                  value: location,
                onChange: (event) => {
                  setLocation(event.target.value);
                  if (event.target.value.trim().length === 0) {
                    setCoordinates(null);
                  }
                },
                  placeholder: "Ex. 12 rue de la République, entrée nord du parc…",
                  disabled: isFormLocked,
                }}
                action={
                  <Button
                    type="button"
                    priority="tertiary no outline"
                    iconId={
                      geolocationStatus === "loading"
                        ? "fr-icon-refresh-line"
                        : "ri-navigation-line"
                    }
                    onClick={handleLocate}
                    disabled={geolocationStatus === "loading" || isFormLocked}
                  >
                    {geolocationStatus === "loading" ? "Localisation…" : "Me localiser"}
                  </Button>
                }
              />

              {geolocationStatus === "error" && geolocationError && (
                <Alert
                  severity="error"
                  small
                  title="Géolocalisation indisponible"
                  description={geolocationError}
                />
              )}

              {geolocationStatus === "success" && (
                <Alert
                  severity="success"
                  small
                  title="Localisation récupérée"
                  description="Vous pouvez ajuster l’adresse si besoin."
                />
              )}

              <div className="fr-flow">
                <Upload
                  label="Ajouter une photo (optionnel)"
                  hint="Formats JPEG ou PNG, taille maximale 5 Mo."
                  nativeInputProps={{
                    accept: "image/*",
                    onChange: handlePhotoChange,
                  }}
                  disabled={isFormLocked || photoUploadState === "uploading"}
                  state={
                    photoUploadState === "error"
                      ? "error"
                      : photoUploadState === "success"
                        ? "success"
                        : "default"
                  }
                  stateRelatedMessage={
                    photoUploadState === "error"
                      ? photoUploadError ?? "Le téléversement a échoué."
                      : photoUploadState === "success"
                        ? "Photo importée avec succès."
                        : undefined
                  }
                />

                {photoUploadInfo && (
                  <div className="fr-card fr-card--sm fr-card--horizontal fr-card--shadow fr-mt-2w">
                    <div className="fr-card__img">
                      <img
                        src={photoUploadInfo.url}
                        alt="Aperçu du fichier importé"
                        className="fr-responsive-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="fr-card__body">
                      <h3 className="fr-card__title fr-h6">Photo téléversée</h3>
                      <p className="fr-card__desc fr-text--sm fr-mb-2w">
                        {photoUploadInfo.format.toUpperCase()} — {(photoUploadInfo.bytes / 1024).toFixed(0)} ko
                      </p>
                      <div className="fr-tags-group fr-mb-2w">
                        <Tag small>{photoUploadInfo.width} px</Tag>
                        <Tag small>{photoUploadInfo.height} px</Tag>
                      </div>
                      <Button
                        type="button"
                        priority="secondary"
                        iconId="fr-icon-delete-line"
                        onClick={handleRemovePhoto}
                        disabled={isFormLocked}
                      >
                        Retirer la photo
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--right fr-mt-4w">
                <div className="fr-col-auto">
                  {submissionState === "success" ? (
                    <Button
                      type="button"
                      priority="primary"
                      iconId="fr-icon-add-line"
                      className="fr-width-full"
                      onClick={resetWizard}
                    >
                      Faire une nouvelle remontée
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      priority="primary"
                      iconId={
                        submissionState === "loading"
                          ? "fr-icon-refresh-line"
                          : "fr-icon-send-plane-fill"
                      }
                      className="fr-width-full"
                      disabled={isSubmitDisabled}
                    >
                      {submissionState === "loading" ? "Envoi en cours…" : "Envoyer"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}


