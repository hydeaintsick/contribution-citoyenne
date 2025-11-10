const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g;

function baseSlugify(value: string): string {
  return value
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .normalize("NFD")
    .replace(COMBINING_MARKS_REGEX, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function slugify(value: string): string {
  return baseSlugify(value);
}

export function generateCommuneSlug(name: string, postalCode: string): string {
  const combined = `${name} ${postalCode}`;
  const slug = baseSlugify(combined);

  if (slug) {
    return slug;
  }

  const fallback = baseSlugify(postalCode);

  if (fallback) {
    return fallback;
  }

  throw new Error("Unable to generate commune slug from commune data.");
}

