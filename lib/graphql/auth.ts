import { prisma } from "@/lib/prisma";

export type GraphQLContext = {
  communeId: string;
  communeName: string;
};

/**
 * Extrait l'API key depuis les headers de la requête
 */
function extractApiKey(headers: Headers): string | null {
  // Essayer X-API-Key d'abord
  const apiKey = headers.get("X-API-Key");
  if (apiKey) {
    return apiKey;
  }

  // Essayer Authorization: Bearer <key>
  const authorization = headers.get("Authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.substring(7);
  }

  return null;
}

/**
 * Authentifie une requête GraphQL via API key
 * Vérifie que la commune a un accès premium et retourne le contexte
 */
export async function authenticateGraphQLRequest(
  headers: Headers,
): Promise<{ success: true; context: GraphQLContext } | { success: false; error: string }> {
  const apiKey = extractApiKey(headers);

  if (!apiKey) {
    return {
      success: false,
      error: "API key manquante. Fournissez une clé API via le header X-API-Key ou Authorization: Bearer <key>",
    };
  }

  // Chercher la commune avec ce webhookSecret
  const commune = await prisma.commune.findFirst({
    where: {
      webhookSecret: apiKey,
    },
    select: {
      id: true,
      name: true,
      hasPremiumAccess: true,
    },
  });

  if (!commune) {
    return {
      success: false,
      error: "API key invalide",
    };
  }

  if (!commune.hasPremiumAccess) {
    return {
      success: false,
      error: "L'accès à l'API GraphQL est réservé aux communes premium",
    };
  }

  return {
    success: true,
    context: {
      communeId: commune.id,
      communeName: commune.name,
    },
  };
}

