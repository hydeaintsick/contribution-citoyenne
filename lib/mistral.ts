import { z } from "zod";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL =
  process.env.MISTRAL_API_URL ?? "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL =
  process.env.MISTRAL_CLASSIFICATION_MODEL ?? "mistral-large-latest";

if (!MISTRAL_API_KEY) {
  console.warn(
    "Mistral integration disabled: missing MISTRAL_API_KEY environment variable."
  );
}

const categoryPredictionSchema = z.object({
  category: z.string().trim().min(1),
  confidence: z.number().optional(),
  rationale: z.string().optional(),
});

const categoryWithTitleSchema = categoryPredictionSchema.extend({
  title: z.string().trim().min(3).max(160),
});

type CategoryPrediction = z.infer<typeof categoryPredictionSchema>;
type CategoryWithTitlePrediction = z.infer<typeof categoryWithTitleSchema>;

type MistralChoice = {
  message?: {
    content?: string;
  };
};

type MistralResponse = {
  choices?: MistralChoice[];
};

function parseJsonWithSchema<T>(raw: string, schema: z.ZodSchema<T>): T | null {
  if (!raw) {
    return null;
  }

  const attempts = new Set<string>();
  attempts.add(raw.trim());

  const jsonLikeMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonLikeMatch?.[0]) {
    attempts.add(jsonLikeMatch[0]);
  }

  for (const candidate of attempts) {
    if (!candidate) {
      continue;
    }

    try {
      const parsed = JSON.parse(candidate);
      return schema.parse(parsed);
    } catch (error) {
      // Keep iterating: we might still find a valid JSON payload.
      if (attempts.size === 1) {
        console.warn("Failed to parse Mistral response as JSON", {
          raw: candidate.slice(0, 200),
          error,
        });
      }
    }
  }

  console.error("Unable to extract valid JSON from Mistral response", {
    raw: raw.slice(0, 500),
  });
  return null;
}

function buildPrompt({
  categories,
  title,
  details,
}: {
  categories: string[];
  title: string;
  details: string;
}): string {
  const available = categories.map((category) => `- ${category}`).join("\n");

  return [
    "Tu es un agent qui classe des signalements citoyens pour une mairie française.",
    "Analyse le titre et la description fournis et sélectionne exactement UNE catégorie parmi la liste autorisée.",
    'Réponds uniquement en JSON avec la forme {"category": "Nom"}.',
    'Si aucune catégorie ne correspond, choisis celle qui est la moins mauvaise et indique ton incertitude dans le champ optionnel "rationale".',
    "",
    "Liste des catégories autorisées :",
    available,
    "",
    `Titre : ${title}`,
    `Description : ${details}`,
  ].join("\n");
}

export const isMistralConfigured = Boolean(MISTRAL_API_KEY);

export async function predictCategory({
  categories,
  title,
  details,
  signal,
}: {
  categories: string[];
  title: string;
  details: string;
  signal?: AbortSignal;
}): Promise<CategoryPrediction | null> {
  if (!isMistralConfigured) {
    return null;
  }

  if (categories.length === 0) {
    throw new Error("No categories configured for this commune.");
  }

  const response = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature: 0,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant qui aide à qualifier des remontées citoyennes pour une collectivité française.",
        },
        {
          role: "user",
          content: buildPrompt({ categories, title, details }),
        },
      ],
    }),
    signal,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Mistral classification failed (${response.status}): ${message}`
    );
  }

  const payload = (await response
    .json()
    .catch(() => null)) as MistralResponse | null;

  const rawContent =
    payload?.choices?.[0]?.message?.content?.trim() ?? JSON.stringify({});

  const parsed = parseJsonWithSchema(rawContent, categoryPredictionSchema);

  if (!parsed) {
    return null;
  }

  const matchingCategory = categories.find(
    (category) =>
      category.localeCompare(parsed!.category, "fr", {
        sensitivity: "accent",
        usage: "search",
      }) === 0
  );

  if (!matchingCategory) {
    return null;
  }

  return {
    category: matchingCategory,
    confidence: parsed.confidence,
    rationale: parsed.rationale,
  };
}

function buildClassificationWithTitlePrompt({
  categories,
  existingTitle,
  existingCategory,
  details,
}: {
  categories: string[];
  existingTitle?: string | null;
  existingCategory?: string | null;
  details: string;
}): string {
  const available = categories.map((category) => `- ${category}`).join("\n");

  return [
    "Tu es un agent qui qualifie des signalements citoyens pour une collectivité française.",
    "Analyse les informations fournies et sélectionne exactement UNE catégorie parmi la liste autorisée.",
    "Génère également un titre court (max. 80 caractères) et explicite en français pour faciliter la lecture par les agents.",
    'Réponds uniquement en JSON avec la forme {"category": "...", "title": "..."} et optionnellement "confidence" (entre 0 et 1) et "rationale".',
    "",
    "Liste des catégories autorisées :",
    available,
    existingCategory
      ? `Catégorie actuelle (peut être incorrecte) : ${existingCategory}`
      : null,
    existingTitle ? `Titre actuel : ${existingTitle}` : null,
    "",
    `Description : ${details}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export async function classifyContributionWithTitle({
  categories,
  details,
  existingTitle,
  existingCategory,
  signal,
}: {
  categories: string[];
  details: string;
  existingTitle?: string | null;
  existingCategory?: string | null;
  signal?: AbortSignal;
}): Promise<CategoryWithTitlePrediction | null> {
  if (!isMistralConfigured) {
    return null;
  }

  if (categories.length === 0) {
    throw new Error("No categories configured for this commune.");
  }

  const response = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature: 0,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant qui aide à qualifier et résumer des remontées citoyennes pour une collectivité française.",
        },
        {
          role: "user",
          content: buildClassificationWithTitlePrompt({
            categories,
            existingTitle,
            existingCategory,
            details,
          }),
        },
      ],
    }),
    signal,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Mistral classification failed (${response.status}): ${message}`
    );
  }

  const payload = (await response
    .json()
    .catch(() => null)) as MistralResponse | null;

  const rawContent =
    payload?.choices?.[0]?.message?.content?.trim() ?? JSON.stringify({});

  return parseJsonWithSchema(rawContent, categoryWithTitleSchema);
}

const maliciousContentSchema = z.object({
  isMalicious: z.boolean(),
  confidence: z.number().min(0).max(1).optional(),
  rationale: z.string().optional(),
});

type MaliciousContentPrediction = z.infer<typeof maliciousContentSchema>;

function buildMaliciousDetectionPrompt({
  title,
  details,
}: {
  title: string;
  details: string;
}): string {
  return [
    "Tu es un agent qui analyse des signalements citoyens pour une mairie française.",
    "Ton rôle est de détecter si le contenu contient des propos insultants, inappropriés, malveillants ou offensants.",
    "Analyse le titre et la description fournis et détermine si le contenu est potentiellement malveillant.",
    'Réponds uniquement en JSON avec la forme {"isMalicious": true/false}.',
    'Tu peux optionnellement inclure "confidence" (entre 0 et 1) et "rationale" pour expliquer ta décision.',
    "",
    "Un contenu est considéré comme malveillant s'il contient :",
    "- Des insultes, des propos injurieux ou offensants",
    "- Des attaques personnelles contre des personnes ou des institutions",
    "- Du harcèlement ou des menaces",
    "- Des propos discriminatoires ou haineux",
    "- Du contenu inapproprié ou vulgaire",
    "",
    "Un contenu critique mais respectueux, même s'il exprime une frustration légitime, n'est PAS considéré comme malveillant.",
    "",
    `Titre : ${title}`,
    `Description : ${details}`,
  ].join("\n");
}

export async function detectMaliciousContent({
  title,
  details,
  signal,
}: {
  title: string;
  details: string;
  signal?: AbortSignal;
}): Promise<boolean> {
  if (!isMistralConfigured) {
    return false;
  }

  try {
    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        temperature: 0,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content:
              "Tu es un assistant qui aide à protéger les collectivités françaises en détectant les contenus malveillants dans les signalements citoyens.",
          },
          {
            role: "user",
            content: buildMaliciousDetectionPrompt({ title, details }),
          },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "Unknown error");
      console.error(
        `Mistral malicious content detection failed (${response.status}): ${message}`
      );
      return false;
    }

    const payload = (await response
      .json()
      .catch(() => null)) as MistralResponse | null;

    const rawContent =
      payload?.choices?.[0]?.message?.content?.trim() ?? JSON.stringify({});

    const parsed = parseJsonWithSchema(rawContent, maliciousContentSchema);

    if (!parsed) {
      return false;
    }

    return parsed.isMalicious;
  } catch (error) {
    console.error("Failed to detect malicious content", error);
    return false;
  }
}
