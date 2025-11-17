/**
 * Service d'envoi d'emails via Brevo (Sendinblue)
 */

import { sanitizeHtmlForEmail } from "./sanitize";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

type SendEmailParams = {
  to: string;
  subject: string;
  htmlContent: string;
  sender?: {
    name: string;
    email: string;
  };
};

/**
 * Envoie un email transactionnel via Brevo
 */
export async function sendEmail({
  to,
  subject,
  htmlContent,
  sender = {
    name: "Contribcit - La parole aux citoyens",
    email: "contact@contribcit.org",
  },
}: SendEmailParams): Promise<void> {
  if (!BREVO_API_KEY) {
    console.warn(
      "BREVO_API_KEY is not set, email sending is disabled. " +
        "Please set BREVO_API_KEY in your environment variables. " +
        "Get your API key from https://app.brevo.com/settings/keys/api"
    );
    return;
  }

  // Vérifier que la clé API n'est pas vide ou invalide
  if (BREVO_API_KEY.trim().length === 0) {
    console.error("BREVO_API_KEY is empty");
    throw new Error("BREVO_API_KEY is not configured correctly");
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY.trim(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Brevo API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${JSON.stringify(errorData)}`;

        // Messages d'erreur plus explicites
        if (response.status === 401) {
          errorMessage +=
            "\n\nLa clé API Brevo est invalide ou manquante. " +
            "Vérifiez que BREVO_API_KEY est correctement configurée dans vos variables d'environnement. " +
            "Obtenez votre clé API sur https://app.brevo.com/settings/keys/api";
        }
      } catch {
        const errorText = await response.text();
        errorMessage += ` - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json().catch(() => null);
    console.info("Email sent successfully via Brevo", {
      to,
      subject,
      messageId: result?.messageId,
    });
  } catch (error) {
    console.error("Failed to send email via Brevo", error);
    throw error;
  }
}

/**
 * Échappe les caractères HTML pour prévenir les injections
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Génère le template HTML d'email avec les couleurs DSFR
 */
export function generateEmailTemplate({
  title,
  content,
  ticketNumber,
  communeName,
}: {
  title: string;
  content: string;
  ticketNumber?: string;
  communeName: string;
}): string {
  // Échapper les variables pour prévenir les injections XSS
  const safeTitle = escapeHtml(title);
  const safeTicketNumber = ticketNumber ? escapeHtml(ticketNumber) : undefined;
  const safeCommuneName = escapeHtml(communeName);
  // Le content est déjà sanitizé par sanitizeHtmlForEmail avant l'appel

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Marianne', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
          <!-- Header avec couleur DSFR -->
          <tr>
            <td style="background-color: #000091; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                Contribcit
              </h1>
            </td>
          </tr>
          
          <!-- Contenu principal -->
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="color: #161616; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">
                ${safeTitle}
              </h2>
              
              ${
                safeTicketNumber
                  ? `
                <p style="color: #666666; margin: 0 0 16px 0; font-size: 14px;">
                  <strong>Numéro de ticket :</strong> ${safeTicketNumber}
                </p>
              `
                  : ""
              }
              
              <div style="color: #161616; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
                ${content}
              </div>
              
              <p style="color: #666666; margin: 24px 0 0 0; font-size: 14px; line-height: 1.5;">
                Cordialement,<br>
                L'équipe de ${safeCommuneName}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f5f5; padding: 24px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="color: #666666; margin: 0; font-size: 12px;">
                Cet email a été envoyé automatiquement par Contribcit.<br>
                Pour toute question, contactez votre mairie.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Envoie un email de notification de réponse à un ticket
 */
export async function sendTicketResponseEmail({
  to,
  ticketNumber,
  ticketTitle,
  communeName,
  responseContent,
}: {
  to: string;
  ticketNumber: string;
  ticketTitle: string;
  communeName: string;
  responseContent: string;
}): Promise<void> {
  const subject = `Réponse à votre retour - ${ticketNumber}`;

  // Sanitizer le contenu HTML pour prévenir les attaques XSS dans les emails
  const sanitizedResponseContent = sanitizeHtmlForEmail(responseContent);

  // Échapper le ticketTitle pour prévenir les injections XSS
  const safeTicketTitle = escapeHtml(ticketTitle);
  // Le ticketNumber est déjà sûr (alphanumérique uniquement), mais on l'échappe quand même par précaution
  const safeTicketNumber = escapeHtml(ticketNumber || "");
  const trackingUrl = `${
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  }/suivi/${encodeURIComponent(ticketNumber || "")}`;

  const htmlContent = generateEmailTemplate({
    title: "Votre mairie vous a répondu",
    content: `
      <p>Bonjour,</p>
      <p>Votre retour concernant "<strong>${safeTicketTitle}</strong>" a reçu une réponse de votre mairie.</p>
      <div style="background-color: #f5f5f5; padding: 16px; border-left: 4px solid #000091; margin: 16px 0;">
        ${sanitizedResponseContent}
      </div>
      <p>Vous pouvez consulter le détail de votre ticket et suivre son évolution en cliquant sur le lien ci-dessous :</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${trackingUrl}" 
           style="display: inline-block; background-color: #000091; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">
          Consulter mon ticket
        </a>
      </p>
    `,
    ticketNumber: safeTicketNumber,
    communeName,
  });

  await sendEmail({
    to,
    subject,
    htmlContent,
  });
}
