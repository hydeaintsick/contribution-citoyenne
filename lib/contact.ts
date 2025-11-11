import { z } from "zod";

const contactTypeValues = ["commune", "organisme_financier", "ministere_public"] as const;

export type ContactType = (typeof contactTypeValues)[number];

export const contactSchema = z
  .object({
    contactType: z
      .enum(contactTypeValues)
      .refine(
        (val) =>
          val === "commune" ||
          val === "organisme_financier" ||
          val === "ministere_public",
        {
          message: "Veuillez sélectionner un type de contact",
        }
      ),
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    function: z.string().min(2, "La fonction doit contenir au moins 2 caractères"),
    commune: z.string().optional(),
    organisme: z.string().optional(),
    message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
    consent: z.boolean().refine((val) => val === true, {
      message: "Vous devez accepter le traitement de vos données",
    }),
  })
  .refine(
    (data) => {
      if (data.contactType === "commune") {
        return data.commune && data.commune.length >= 2;
      }
      return true;
    },
    {
      message: "La commune doit contenir au moins 2 caractères",
      path: ["commune"],
    }
  )
  .refine(
    (data) => {
      if (
        data.contactType === "organisme_financier" ||
        data.contactType === "ministere_public"
      ) {
        return data.organisme && data.organisme.length >= 2;
      }
      return true;
    },
    {
      message:
        "Le nom de l'organisme ou du ministère doit contenir au moins 2 caractères",
      path: ["organisme"],
    }
  );

export type ContactFormData = z.infer<typeof contactSchema>;

export const contactSubmissionSchema = contactSchema.safeExtend({
  fingerprint: z
    .string()
    .min(10, "Empreinte du navigateur introuvable, veuillez réessayer.")
    .max(255, "Empreinte du navigateur invalide."),
});

export type ContactSubmissionData = z.infer<typeof contactSubmissionSchema>;

export const CONTACT_FORM_COOLDOWN_MS = 72 * 60 * 60 * 1000;

export const CONTACT_TICKET_STATUS_ORDER = ["PENDING", "RESOLVED"] as const;
export type ContactTicketStatusValue = (typeof CONTACT_TICKET_STATUS_ORDER)[number];

export const CONTACT_TICKET_STATUS_LABELS: Record<ContactTicketStatusValue, string> = {
  PENDING: "À traiter",
  RESOLVED: "Traité",
};

export const CONTACT_TICKET_STATUS_BADGES: Record<ContactTicketStatusValue, "warning" | "success"> = {
  PENDING: "warning",
  RESOLVED: "success",
};

export const CONTACT_TICKET_TYPE_ORDER = [
  "COMMUNE",
  "ORGANISME_FINANCIER",
  "MINISTERE_PUBLIC",
] as const;
export type ContactTicketTypeValue = (typeof CONTACT_TICKET_TYPE_ORDER)[number];

export const CONTACT_TICKET_TYPE_LABELS: Record<ContactTicketTypeValue, string> = {
  COMMUNE: "Commune",
  ORGANISME_FINANCIER: "Organisme financier",
  MINISTERE_PUBLIC: "Ministère public",
};
