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

type CategoryPrediction = z.infer<typeof categoryPredictionSchema>;

type MistralChoice = {
  message?: {
    content?: string;
  };
};

type MistralResponse = {
  choices?: MistralChoice[];
};

function parseCategoryPrediction(raw: string): CategoryPrediction | null {
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
      return categoryPredictionSchema.parse(parsed);
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

  const parsed = parseCategoryPrediction(rawContent);

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
