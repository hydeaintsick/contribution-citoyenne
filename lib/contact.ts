import { z } from "zod";

export type ContactType = "commune" | "organisme_financier";

export const contactSchema = z
  .object({
    contactType: z.enum(["commune", "organisme_financier"], {
      errorMap: () => ({ message: "Veuillez sélectionner un type de contact" }),
    }),
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
      if (data.contactType === "organisme_financier") {
        return data.organisme && data.organisme.length >= 2;
      }
      return true;
    },
    {
      message: "Le nom de l'organisme doit contenir au moins 2 caractères",
      path: ["organisme"],
    }
  );

export type ContactFormData = z.infer<typeof contactSchema>;

export function createMailtoLink(data: ContactFormData): string {
  const isCommune = data.contactType === "commune";
  const entityName = isCommune ? data.commune : data.organisme;
  const entityLabel = isCommune ? "Commune" : "Organisme";
  const entityValue = isCommune ? data.commune : data.organisme;
  
  const subject = encodeURIComponent(`Demande de contact Contribcit - ${entityName}`);
  const body = encodeURIComponent(
    `Bonjour,

${isCommune 
  ? "Je souhaite obtenir une démonstration de Contribcit pour ma commune."
  : "Je suis un organisme financier et je souhaite financer le projet Contribcit."
}

Type de contact : ${isCommune ? "Commune" : "Organisme financier"}
Nom : ${data.name}
Email : ${data.email}
Fonction : ${data.function}
${entityLabel} : ${entityValue}

Message :
${data.message}

Cordialement,
${data.name}`
  );
  return `mailto:contact@contribcit.fr?subject=${subject}&body=${body}`;
}

