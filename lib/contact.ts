import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  function: z.string().min(2, "La fonction doit contenir au moins 2 caractères"),
  commune: z.string().min(2, "La commune doit contenir au moins 2 caractères"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
  consent: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter le traitement de vos données",
  }),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export function createMailtoLink(data: ContactFormData): string {
  const subject = encodeURIComponent(`Demande de démonstration Contribcit - ${data.commune}`);
  const body = encodeURIComponent(
    `Bonjour,

Je souhaite obtenir une démonstration de Contribcit pour ma commune.

Nom : ${data.name}
Email : ${data.email}
Fonction : ${data.function}
Commune : ${data.commune}

Message :
${data.message}

Cordialement,
${data.name}`
  );
  return `mailto:contact@contribcit.fr?subject=${subject}&body=${body}`;
}

