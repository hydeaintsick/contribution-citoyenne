import { NextRequest, NextResponse } from "next/server";
import { createHandler } from "graphql-http/lib/use/fetch";
import { createGraphQLSchema } from "@/lib/graphql/schema";
import { resolvers } from "@/lib/graphql/resolvers";
import { authenticateGraphQLRequest } from "@/lib/graphql/auth";
import type { GraphQLContext } from "@/lib/graphql/auth";
import { GraphQLError, parse } from "graphql";

const schema = createGraphQLSchema(resolvers);

// Créer le handler GraphQL
const graphqlHandler = createHandler({
  schema,
  context: async (req) => {
    // Le contexte sera défini dans onSubscribe après authentification
    return {} as GraphQLContext;
  },
  onSubscribe: async (req, params) => {
    // Extraire les headers pour l'authentification
    const headers = new Headers();
    let apiKeyHeader: string | null = null;
    let authHeader: string | null = null;
    
    // Extraire les headers nécessaires depuis req.headers
    if (req.headers && typeof req.headers.get === "function") {
      apiKeyHeader = req.headers.get("X-API-Key");
      authHeader = req.headers.get("Authorization");
      if (apiKeyHeader) {
        headers.set("X-API-Key", apiKeyHeader);
      }
      if (authHeader) {
        headers.set("Authorization", authHeader);
      }
    }

    // Logger pour debug (à retirer en production)
    if (process.env.NODE_ENV === "development") {
      console.log("GraphQL Request Headers:", {
        "X-API-Key": apiKeyHeader,
        Authorization: authHeader,
      });
      console.log("GraphQL Query:", params.query?.substring(0, 100));
    }

    // Authentifier la requête d'abord (même pour l'introspection, car elle nécessite une clé API)
    const authResult = await authenticateGraphQLRequest(headers);

    if (!authResult.success) {
      // Retourner une erreur GraphQL au lieu de lancer une exception
      return [
        new GraphQLError(authResult.error, {
          extensions: {
            code: "UNAUTHENTICATED",
          },
        }),
      ];
    }

    // Vérifier qu'une query est fournie
    if (!params.query) {
      return [
        new GraphQLError("Aucune requête GraphQL fournie", {
          extensions: {
            code: "BAD_REQUEST",
          },
        }),
      ];
    }

    // Parser la query
    let document: ReturnType<typeof parse>;
    try {
      document = parse(params.query);
      // Vérifier si c'est une requête d'introspection
      const isIntrospection = params.query.includes("__schema") || params.query.includes("__type");
      if (isIntrospection && process.env.NODE_ENV === "development") {
        console.log("Introspection query detected");
      }
    } catch (parseError) {
      return [
        new GraphQLError(
          parseError instanceof Error ? parseError.message : "Erreur de parsing GraphQL",
          {
            extensions: {
              code: "GRAPHQL_PARSE_FAILED",
            },
          },
        ),
      ];
    }

    // Retourner les arguments d'opération avec le contexte authentifié
    return {
      schema,
      operationName: params.operationName || undefined,
      document,
      variableValues: params.variables || undefined,
      contextValue: authResult.context,
    };
  },
  formatError: (error) => {
    // Ne pas exposer les détails internes en production
    if (process.env.NODE_ENV === "production") {
      return new GraphQLError(error.message);
    }
    return error;
  },
});

export async function POST(request: NextRequest) {
  try {
    // Convertir NextRequest en Request standard pour graphql-http
    const url = new URL(request.url);
    const body = await request.text().catch(() => "");

    const fetchRequest = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: body || null,
    });

    // Appeler le handler GraphQL
    const response = await graphqlHandler(fetchRequest);

    // Convertir la Response en NextResponse
    const responseBody = await response.text();
    const responseHeaders = new Headers(response.headers);

    // Ajouter les headers CORS pour la sandbox
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization");

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("GraphQL error:", error);
    
    // Si c'est une erreur d'authentification, retourner 401
    if (error instanceof Error && error.message.includes("API key")) {
      const errorResponse = NextResponse.json(
        {
          errors: [
            {
              message: error.message,
            },
          ],
        },
        { status: 401 },
      );
      errorResponse.headers.set("Access-Control-Allow-Origin", "*");
      return errorResponse;
    }

    const errorResponse = NextResponse.json(
      {
        errors: [
          {
            message: error instanceof Error ? error.message : "Erreur serveur",
          },
        ],
      },
      { status: 500 },
    );
    errorResponse.headers.set("Access-Control-Allow-Origin", "*");
    return errorResponse;
  }
}

// Support pour OPTIONS (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
    },
  });
}

// Support pour GET (pour la sandbox)
export async function GET(request: NextRequest) {
  return POST(request);
}

