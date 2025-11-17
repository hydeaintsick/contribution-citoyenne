/**
 * Utilitaires de sanitization HTML pour prévenir les attaques XSS
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Configuration DOMPurify pour autoriser uniquement les balises HTML sûres
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

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "title", "target", "rel"],
    // Force les liens externes à avoir target="_blank" et rel="noopener noreferrer"
    ADD_ATTR: ["target", "rel"],
  });
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

  // Pour les emails, on autorise uniquement le formatage de base, pas de liens
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "h1", "h2", "h3"],
    ALLOWED_ATTR: [],
  });
}

