"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import {
  AnimatePresence,
  motion,
  cubicBezier,
  type Transition,
} from "framer-motion";
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

type AddressSuggestion = {
  id: string;
  label: string;
  name: string;
  context: string | null;
  latitude: number;
  longitude: number;
  postcode: string | null;
  city: string | null;
};

const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;
const MAX_PHOTO_DIMENSION = 1600;
const PHOTO_COMPRESSION_QUALITIES = [0.82, 0.68, 0.56, 0.46, 0.36];

type LoadedImageSource = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

function toWebpFilename(name: string): string {
  const baseName = name.replace(/\.[^/.]+$/, "");
  return `${baseName || "photo"}.webp`;
}

async function loadImageSource(file: File): Promise<LoadedImageSource> {
  if (typeof window === "undefined") {
    throw new Error("Image compression is unavailable during SSR.");
  }

  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch (error) {
      console.warn("createImageBitmap failed, falling back to Image()", error);
    }
  }

  const objectUrl = URL.createObjectURL(file);

  return new Promise<LoadedImageSource>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        source: image,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
        cleanup: () => {
          // No additional cleanup required for HTMLImageElement.
        },
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de lire cette image."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
  });
}

async function compressPhotoFile(file: File): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  let loaded: LoadedImageSource | null = null;

  try {
    loaded = await loadImageSource(file);

    const maxDimension = Math.max(loaded.width, loaded.height);
    const scale =
      maxDimension > MAX_PHOTO_DIMENSION
        ? MAX_PHOTO_DIMENSION / maxDimension
        : 1;

    const targetWidth = Math.max(1, Math.round(loaded.width * scale));
    const targetHeight = Math.max(1, Math.round(loaded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(loaded.source, 0, 0, targetWidth, targetHeight);

    let selectedFile: File | null = null;

    for (const quality of PHOTO_COMPRESSION_QUALITIES) {
      // eslint-disable-next-line no-await-in-loop
      const blob = await canvasToBlob(canvas, quality);

      if (!blob || blob.size === 0) {
        continue;
      }

      const candidate = new File([blob], toWebpFilename(file.name), {
        type: "image/webp",
        lastModified: Date.now(),
      });

      selectedFile = candidate;

      if (candidate.size <= MAX_UPLOAD_FILE_SIZE) {
        break;
      }
    }

    if (
      selectedFile &&
      (selectedFile.size < file.size || file.size > MAX_UPLOAD_FILE_SIZE)
    ) {
      return selectedFile;
    }

    return file;
  } catch (error) {
    console.error("Photo compression failed", error);
    return file;
  } finally {
    loaded?.cleanup();
  }
}

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
    next: "Confirmation",
  },
  {
    title: "Confirmation",
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
const MIN_ADDRESS_QUERY_LENGTH = 4;

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
  const locationInputId = useId();
  const locationSuggestionsId = `${locationInputId}-suggestions`;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isLocationLocked, setIsLocationLocked] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AddressSuggestion | null>(null);
  const [photoUploadState, setPhotoUploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [photoUploadInfo, setPhotoUploadInfo] =
    useState<PhotoUploadInfo | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [autoAdvanceMessage, setAutoAdvanceMessage] = useState<string | null>(
    null
  );
  const [geolocationStatus, setGeolocationStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressAbortControllerRef = useRef<AbortController | null>(null);

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
    setAddressSuggestions([]);
    setAddressError(null);
    setIsLocationLocked(false);
    setSelectedSuggestion(null);
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
    [resetAutoAdvance]
  );

  const handleAlertContinue = useCallback(() => {
    setCurrentStep(2);
  }, []);

  const handleCategoryChange = useCallback(
    (value: string) => {
      setSelectedCategory(value);
      setSelectedSubcategory("");
      resetAutoAdvance();
      setAutoAdvanceMessage(null);
    },
    [resetAutoAdvance]
  );

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
    [resetAutoAdvance]
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
    () =>
      categories.find((category) => category.value === selectedCategory)
        ?.label ?? "",
    [selectedCategory]
  );

  const selectedSubcategoryOptions = useMemo(() => {
    const category = categories.find(({ value }) => value === selectedCategory);
    return category?.subcategories ?? [];
  }, [selectedCategory]);

  const trimmedDetails = details.trim();
  const trimmedLocation = location.trim();
  const hasCoordinates = !!coordinates;
  const isManualLocationSufficient =
    trimmedLocation.length >= MIN_ADDRESS_QUERY_LENGTH;
  const isLocationValid =
    trimmedLocation.length === 0 ||
    hasCoordinates ||
    isManualLocationSufficient;
  const isSubmitDisabled =
    submissionState === "loading" ||
    !reportType ||
    !selectedCategory ||
    !selectedSubcategory ||
    trimmedDetails.length < MIN_DETAILS_LENGTH ||
    !isLocationValid;
  const isFormLocked =
    submissionState === "loading" || submissionState === "success";

  const showAddressSuccess =
    Boolean(trimmedLocation) && isLocationValid && coordinates;

  const isSuggestionsPanelVisible =
    !isLocationLocked &&
    (isFetchingAddress || addressSuggestions.length > 0 || Boolean(addressError));

  useEffect(() => {
    if (isLocationLocked || isFormLocked) {
      return;
    }

    const query = trimmedLocation;

    if (selectedSuggestion && query === selectedSuggestion.label) {
      setAddressSuggestions([]);
      setIsFetchingAddress(false);
      return;
    }

    if (query.length < MIN_ADDRESS_QUERY_LENGTH) {
      setAddressSuggestions([]);
      setAddressError(
        query.length > 0
          ? "Ajoutez quelques caractères pour affiner la recherche (ex. “rue de …”)."
          : null
      );
      setIsFetchingAddress(false);
      if (addressAbortControllerRef.current) {
        addressAbortControllerRef.current.abort();
        addressAbortControllerRef.current = null;
      }
      if (addressDebounceRef.current) {
        clearTimeout(addressDebounceRef.current);
        addressDebounceRef.current = null;
      }
      if (query.length === 0) {
        setSelectedSuggestion(null);
        setCoordinates(null);
      }
      return;
    }

    setIsFetchingAddress(true);
    setAddressError(null);

    if (addressDebounceRef.current) {
      clearTimeout(addressDebounceRef.current);
    }

    const controller = new AbortController();
    addressAbortControllerRef.current = controller;

    addressDebounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/contrib/addresses/search?communeId=${encodeURIComponent(
            communeId
          )}&q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            payload?.error ?? "Recherche impossible pour le moment."
          );
        }

        const payload = (await response.json()) as {
          suggestions?: AddressSuggestion[];
        };
        setAddressSuggestions(payload.suggestions ?? []);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        setAddressSuggestions([]);
        setAddressError(
          error instanceof Error
            ? error.message
            : "Une erreur est survenue durant la recherche d’adresse."
        );
      } finally {
        setIsFetchingAddress(false);
      }
    }, 250);

    return () => {
      if (addressDebounceRef.current) {
        clearTimeout(addressDebounceRef.current);
        addressDebounceRef.current = null;
      }
      if (addressAbortControllerRef.current) {
        addressAbortControllerRef.current.abort();
        addressAbortControllerRef.current = null;
      }
      setIsFetchingAddress(false);
    };
  }, [
    communeId,
    isFormLocked,
    isLocationLocked,
    trimmedLocation,
    selectedSuggestion,
  ]);

  const handleSelectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      setSelectedSuggestion(suggestion);
      setLocation(suggestion.label);
      setCoordinates({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      });
      setAddressSuggestions([]);
      setAddressError(null);
    },
    []
  );

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

      setPhotoUploadState("uploading");
      setPhotoUploadError(null);
      setPhotoUploadInfo(null);

      let fileToUpload = file;

      try {
        fileToUpload = await compressPhotoFile(file);
      } catch (compressionError) {
        console.error("Photo compression error", compressionError);
      }

      if (fileToUpload.size > MAX_UPLOAD_FILE_SIZE) {
        setPhotoUploadError(
          "Impossible de compresser la photo en dessous de 5 Mo. Choisissez une image plus légère."
        );
        setPhotoUploadState("error");
        setPhotoUploadInfo(null);
        return;
      }

      const formData = new FormData();
      formData.append("file", fileToUpload, fileToUpload.name);

      try {
        const response = await fetch("/api/uploads/cloudinary", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
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
            : "Une erreur est survenue pendant le téléversement."
        );
        setPhotoUploadState("error");
        setPhotoUploadInfo(null);
      }
    },
    []
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

    if (isLocationLocked) {
      setIsLocationLocked(false);
      setGeolocationStatus("idle");
      setGeolocationError(null);
      return;
    }

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeolocationStatus("error");
      setGeolocationError(
        "La géolocalisation n’est pas disponible sur cet appareil."
      );
      return;
    }

    setGeolocationStatus("loading");
    setGeolocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch("/api/contrib/addresses/reverse", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              communeId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as {
              error?: string;
            } | null;
            throw new Error(
              payload?.error ??
                "Impossible de récupérer l’adresse exacte pour votre position."
            );
          }

          const payload = (await response.json()) as {
            address: AddressSuggestion;
          };

          setLocation(payload.address.label);
          setCoordinates({
            latitude: payload.address.latitude,
            longitude: payload.address.longitude,
          });
          setSelectedSuggestion(payload.address);
          setAddressSuggestions([]);
          setAddressError(null);
          setIsLocationLocked(true);
          setGeolocationStatus("success");
        } catch (error) {
          console.error("Reverse geocoding failed", error);
          setGeolocationStatus("error");
          setGeolocationError(
            error instanceof Error
              ? error.message
              : "Impossible de récupérer votre adresse. Renseignez le lieu manuellement."
          );
          setIsLocationLocked(false);
        }
      },
      (error) => {
        console.error("Geolocation error", error);
        setGeolocationStatus("error");
        setGeolocationError(
          "Impossible de récupérer votre position. Renseignez le lieu manuellement."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 20_000,
        timeout: 10_000,
      }
    );
  }, [communeId, submissionState]);

  const currentStepMeta = REPORT_STEPS[currentStep - 1];
  const trimmedCommuneWebsite = communeWebsite?.trim();

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!reportType || !selectedCategory || !selectedSubcategory) {
        setSubmissionState("error");
        setSubmissionError(
          "Merci de sélectionner un type de remontée ainsi qu’une catégorie et une sous-catégorie."
        );
        return;
      }

      const cleanedDetails = details.trim();

      if (cleanedDetails.length < MIN_DETAILS_LENGTH) {
        setSubmissionState("error");
        setSubmissionError(
          `Le descriptif doit comporter au moins ${MIN_DETAILS_LENGTH} caractères.`
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
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            payload?.error ?? "L’envoi a échoué. Merci de réessayer."
          );
        }

        setSubmissionState("success");
        resetAutoAdvance();
        setAutoAdvanceMessage(null);
        setCurrentStep(4);
      } catch (error) {
        console.error("Report submission failed", error);
        setSubmissionState("error");
        setSubmissionError(
          error instanceof Error
            ? error.message
            : "Une erreur inattendue est survenue."
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
      resetAutoAdvance,
    ]
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
              <h1
                id="citizen-report-step-1"
                className="fr-callout__title fr-h4"
              >
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
                Signalez un problème ou partagez une idée pour améliorer la vie
                locale. Vous pouvez à tout moment revenir en arrière avant
                l’envoi.
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
                        Attention, vous êtes témoin d’une situation d’urgence.
                        Composez le <strong>17</strong> pour la Police, le{" "}
                        <strong>18</strong> pour les Pompiers, ou le{" "}
                        <strong>15</strong> pour le SAMU. Si la situation n’est
                        pas immédiate, poursuivez pour alerter votre mairie.
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
                  <Alert
                    severity="success"
                    small
                    title="C’est noté"
                    description={autoAdvanceMessage}
                  />
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
                <h2
                  id="citizen-report-step-2"
                  className="fr-h4 fr-mt-0 fr-mb-0"
                >
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
                      onChange: (event) =>
                        handleSubcategoryChange(event.target.value),
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
                  <Alert
                    severity="success"
                    small
                    title="Merci"
                    description={autoAdvanceMessage}
                  />
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
                <h2
                  id="citizen-report-step-3"
                  className="fr-h4 fr-mt-0 fr-mb-0"
                >
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
                    <Tag small>
                      {reportType === "alert" ? "Alerte" : "Suggestion"}
                    </Tag>
                  )}
                  {selectedCategoryLabel && (
                    <Tag small>{selectedCategoryLabel}</Tag>
                  )}
                  {selectedSubcategory && (
                    <Tag small>{selectedSubcategory}</Tag>
                  )}
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
                  placeholder:
                    "Expliquez ce qui se passe ou l’amélioration proposée…",
                  minLength: MIN_DETAILS_LENGTH,
                  disabled: isFormLocked,
                }}
              />

              <div className="fr-flow">
                <Input
                  label="Lieu concerné"
                  hintText="Adresse, nom de rue ou repère à proximité."
                  disabled={isFormLocked}
                  state={
                    !isLocationValid
                      ? "error"
                      : showAddressSuccess
                      ? "success"
                      : "default"
                  }
                  classes={{
                    root: "contribcit-location-group",
                    wrap: "contribcit-location-control",
                    nativeInputOrTextArea: "contribcit-location-input",
                    message: "contribcit-location-message",
                  }}
                  id={locationInputId}
                  nativeLabelProps={{ htmlFor: locationInputId }}
                  stateRelatedMessage={
                    !isLocationValid
                      ? "Précisez davantage le lieu ou sélectionnez une adresse proposée."
                      : showAddressSuccess
                      ? "Adresse validée"
                      : undefined
                  }
                  nativeInputProps={{
                    id: locationInputId,
                    value: location,
                    onChange: (event) => {
                      const value = event.target.value;
                      setLocation(value);
                      setIsLocationLocked(false);
                      setSelectedSuggestion(null);
                      setCoordinates(null);
                      if (value.trim().length === 0) {
                        setAddressSuggestions([]);
                        setAddressError(null);
                      }
                    },
                    onFocus: () => {
                      if (addressSuggestions.length === 0) {
                        setAddressError(null);
                      }
                    },
                    placeholder:
                      "Ex. 12 rue de la République, entrée nord du parc…",
                    disabled: isFormLocked || isLocationLocked,
                    autoComplete: "street-address",
                    "aria-autocomplete": "list",
                    "aria-controls": isSuggestionsPanelVisible
                      ? locationSuggestionsId
                      : undefined,
                    "aria-expanded": isSuggestionsPanelVisible,
                    "aria-haspopup": "listbox",
                  }}
                  action={
                    <Button
                      type="button"
                      priority="tertiary no outline"
                      className="contribcit-location-locate-btn"
                      iconId={
                        geolocationStatus === "loading"
                          ? "fr-icon-refresh-line"
                          : isLocationLocked
                          ? "fr-icon-edit-line"
                          : "ri-navigation-line"
                      }
                      onClick={handleLocate}
                      disabled={geolocationStatus === "loading" || isFormLocked}
                    >
                      {geolocationStatus === "loading"
                        ? "Localisation…"
                        : isLocationLocked
                        ? "Modifier"
                        : "Me localiser"}
                    </Button>
                  }
                />

                {isSuggestionsPanelVisible ? (
                  <div
                    className="contribcit-location-suggestions"
                    role="region"
                    aria-live="polite"
                  >
                    {isFetchingAddress ? (
                      <p className="fr-text--sm fr-mb-0 contribcit-location-spinner">
                        Recherche d’adresses…
                      </p>
                    ) : addressError ? (
                      <p className="fr-text--sm fr-mb-0 fr-text-mention--grey">
                        {addressError}
                      </p>
                    ) : addressSuggestions.length > 0 ? (
                      <ul
                        id={locationSuggestionsId}
                        className="contribcit-location-suggestions__list"
                        role="listbox"
                        aria-label="Adresses suggérées"
                      >
                        {addressSuggestions.map((suggestion) => (
                          <li key={suggestion.id}>
                            <button
                              type="button"
                              className="contribcit-location-suggestions__item"
                              role="option"
                              onClick={() => handleSelectSuggestion(suggestion)}
                            >
                              <span
                                aria-hidden="true"
                                className="contribcit-location-suggestions__icon"
                              >
                                📍
                              </span>
                              <span className="contribcit-location-suggestions__label">
                                {suggestion.label}
                              </span>
                              <span
                                aria-hidden="true"
                                className="contribcit-location-suggestions__chevron"
                              >
                                →
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="fr-text--sm fr-mb-0 fr-text-mention--grey">
                        Aucune adresse correspondante. Affinez votre recherche.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>

              {geolocationStatus === "error" && geolocationError && (
                <Alert
                  severity="error"
                  small
                  className="contribcit-location-alert"
                  title="Géolocalisation indisponible"
                  description={geolocationError}
                />
              )}

              {geolocationStatus === "success" && (
                <Alert
                  severity="success"
                  small
                  className="contribcit-location-alert"
                  title="Localisation récupérée"
                  description={
                    isLocationLocked
                      ? "Adresse verrouillée. Cliquez sur Modifier pour saisir manuellement."
                      : "Vous pouvez ajuster l’adresse si besoin."
                  }
                />
              )}

              <div className="fr-flow">
                <Upload
                  label="Ajouter une photo (optionnel)"
                  hint="Formats JPEG, PNG ou WebP, taille maximale 5 Mo (compression automatique)."
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
                        {photoUploadInfo.format.toUpperCase()} —{" "}
                        {(photoUploadInfo.bytes / 1024).toFixed(0)} ko
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
                      {submissionState === "loading"
                        ? "Envoi en cours…"
                        : "Envoyer"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </motion.section>
        )}

        {currentStep === 4 && (
          <motion.section
            key="step-4"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={STEP_TRANSITION}
            className="fr-flow fr-pb-4w"
            aria-labelledby="citizen-report-step-4"
          >
            <div className="fr-callout">
              <h2
                id="citizen-report-step-4"
                className="fr-callout__title fr-h4"
              >
                Merci pour votre remontée
              </h2>
              <p className="fr-text--sm">
                Votre contribution a bien été transmise à la mairie de{" "}
                {communeName}. Elle sera analysée dans les meilleurs délais.
              </p>
              <p className="fr-text--sm fr-mb-0">
                Pour toute question complémentaire, n’hésitez pas à consulter le
                site de votre commune ou à vous rapprocher des services
                municipaux.
              </p>
            </div>

            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--right fr-mt-4w">
              {trimmedCommuneWebsite && (
                <div className="fr-col-12 fr-col-sm-auto">
                  <Button
                    priority="secondary"
                    size="medium"
                    iconId="fr-icon-external-link-line"
                    linkProps={{
                      href: trimmedCommuneWebsite,
                      target: "_blank",
                      rel: "noreferrer",
                    }}
                  >
                    Consulter le site de la commune
                  </Button>
                </div>
              )}
              <div className="fr-col-12 fr-col-sm-auto">
                <Button
                  priority="primary"
                  size="medium"
                  iconId="fr-icon-add-line"
                  onClick={resetWizard}
                >
                  Faire une nouvelle remontée
                </Button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
