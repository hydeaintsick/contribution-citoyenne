/**
 * Utilitaires de sanitization HTML pour prévenir les attaques XSS
 * Utilise sanitize-html qui est une bibliothèque pure Node.js sans dépendance à jsdom
 */

import sanitizeHtmlLib from "sanitize-html";

/**
 * Configuration pour autoriser uniquement les balises HTML sûres
 * utilisées par le RTE (TipTap)
 */
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "a",
  "blockquote",
  "code",
  "pre",
];

/**
 * Options de sanitization pour l'affichage web
 */
const webSanitizeOptions: sanitizeHtmlLib.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
  },
  // Force les liens externes à avoir target="_blank" et rel="noopener noreferrer"
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href || "";
      const isExternal = href.startsWith("http://") || href.startsWith("https://");
      return {
        tagName: "a",
        attribs: {
          ...attribs,
          ...(isExternal && {
            target: "_blank",
            rel: "noopener noreferrer",
          }),
        },
      };
    },
  },
};

/**
 * Options de sanitization pour les emails (plus restrictif)
 */
const emailSanitizeOptions: sanitizeHtmlLib.IOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "h1", "h2", "h3"],
  allowedAttributes: {},
};

/**
 * Sanitize le HTML pour prévenir les attaques XSS
 * Autorise uniquement les balises de formatage de base utilisées par le RTE
 *
 * @param dirty HTML potentiellement dangereux
 * @returns HTML sanitizé et sûr
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) {
    return "";
  }

  return sanitizeHtmlLib(dirty, webSanitizeOptions);
}

/**
 * Sanitize le HTML pour les emails
 * Plus restrictif que pour l'affichage web (pas de liens par exemple)
 *
 * @param dirty HTML potentiellement dangereux
 * @returns HTML sanitizé et sûr pour les emails
 */
export function sanitizeHtmlForEmail(dirty: string | null | undefined): string {
  if (!dirty) {
    return "";
  }

  return sanitizeHtmlLib(dirty, emailSanitizeOptions);
}

