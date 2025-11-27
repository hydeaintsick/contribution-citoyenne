"use client";

import { useEffect, useState, useRef } from "react";
import { useDocsContext } from "../DocsLayout";

let SyntaxHighlighter: any = null;
let vscDarkPlus: any = null;

export function GraphQLSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { registerSection } = useDocsContext();
  const [isSyntaxHighlighterLoaded, setIsSyntaxHighlighterLoaded] =
    useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<
    "graphql" | "curl" | "node" | "python" | "php"
  >("graphql");

  useEffect(() => {
    if (typeof window !== "undefined" && !isSyntaxHighlighterLoaded) {
      Promise.all([
        import("react-syntax-highlighter").then((mod) => mod.Prism),
        import("react-syntax-highlighter/dist/cjs/styles/prism").then(
          (mod) => mod.vscDarkPlus
        ),
      ]).then(([SyntaxHighlighterModule, vscDarkPlusModule]) => {
        SyntaxHighlighter = SyntaxHighlighterModule;
        vscDarkPlus = vscDarkPlusModule;
        setIsSyntaxHighlighterLoaded(true);
      });
    }
  }, [isSyntaxHighlighterLoaded]);

  useEffect(() => {
    if (sectionRef.current) {
      registerSection("graphql", sectionRef.current);
    }
  }, [registerSection]);

  const exampleQuery = `query {
  commune {
    id
    name
    postalCode
    latitude
    longitude
  }
  
  contributions(pagination: { first: 10 }) {
    totalCount
    edges {
      node {
        id
        ticketNumber
        type
        status
        categoryLabel
        title
        details
        createdAt
        location {
          label
          latitude
          longitude
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
  
  stats {
    totals {
      overall
      last30Days
      alerts {
        count
        percentage
      }
      suggestions {
        count
        percentage
      }
    }
    timeline {
      weekly {
        label
        date
        alerts
        suggestions
      }
      monthly {
        label
        date
        alerts
        suggestions
      }
    }
  }
  
  categories {
    id
    name
    description
    badgeColor
    badgeTextColor
  }
}`;

  const curlExample = `curl -X POST https://contribcit.org/api/graphql \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: votre-webhook-secret" \\
  -d '{
    "query": "query { commune { id name postalCode } contributions(pagination: { first: 10 }) { totalCount edges { node { id ticketNumber type status } } } }"
  }'`;

  const nodeExample = `const response = await fetch('https://contribcit.org/api/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'votre-webhook-secret'
  },
  body: JSON.stringify({
    query: \`query {
      commune {
        id
        name
        postalCode
      }
      contributions(pagination: { first: 10 }) {
        totalCount
        edges {
          node {
            id
            ticketNumber
            type
            status
          }
        }
      }
    }\`
  })
});

const data = await response.json();
console.log(data);`;

  const pythonExample = `import requests

url = 'https://contribcit.org/api/graphql'
headers = {
    'Content-Type': 'application/json',
    'X-API-Key': 'votre-webhook-secret'
}
query = '''
query {
  commune {
    id
    name
    postalCode
  }
  contributions(pagination: { first: 10 }) {
    totalCount
    edges {
      node {
        id
        ticketNumber
        type
        status
      }
    }
  }
}
'''
response = requests.post(url, json={'query': query}, headers=headers)
data = response.json()
print(data)`;

  const phpExample = `<?php
$url = 'https://contribcit.org/api/graphql';
$headers = [
    'Content-Type: application/json',
    'X-API-Key: votre-webhook-secret'
];
$query = '
query {
  commune {
    id
    name
    postalCode
  }
  contributions(pagination: { first: 10 }) {
    totalCount
    edges {
      node {
        id
        ticketNumber
        type
        status
      }
    }
  }
}
';
$data = ['query' => $query];
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
$result = json_decode($response, true);
print_r($result);
?>`;

  return (
    <section
      ref={sectionRef as any}
      id="graphql"
      className="fr-mb-8w"
      style={{ scrollMarginTop: "100px" }}
    >
      <h2 className="fr-h2 fr-mb-2w">API GraphQL</h2>
      <p className="fr-text--lead fr-mb-4w">
        Accédez à toutes les données de votre commune via une API GraphQL
        moderne et flexible.
        <strong className="fr-text--bold">
          {" "}
          Cette fonctionnalité est réservée aux communes premium.
        </strong>
      </p>

      <div className="fr-flow">
        <h3 className="fr-h4">Introduction</h3>
        <p>
          L'API GraphQL de Contribcit vous permet d'interroger vos données de
          manière flexible et efficace. Contrairement aux API REST
          traditionnelles, GraphQL vous permet de récupérer exactement les
          données dont vous avez besoin en une seule requête.
        </p>

        <div className="fr-alert fr-alert--info fr-mt-4w">
          <p className="fr-alert__title">Accès premium requis</p>
          <p>
            L'API GraphQL est uniquement disponible pour les communes ayant un
            accès premium. Contactez-nous pour activer cette fonctionnalité.
          </p>
        </div>

        <h3 className="fr-h4 fr-mt-4w">Authentification</h3>
        <p>
          Pour vous authentifier, vous devez inclure votre clé API dans les
          headers de chaque requête. Cette clé est la même que celle utilisée
          pour les webhooks (webhookSecret).
        </p>
        <p>Vous pouvez l'envoyer de deux manières :</p>
        <ul>
          <li>
            <strong>Header X-API-Key</strong> :{" "}
            <code>X-API-Key: votre-webhook-secret</code>
          </li>
          <li>
            <strong>Authorization Bearer</strong> :{" "}
            <code>Authorization: Bearer votre-webhook-secret</code>
          </li>
        </ul>

        <h3 className="fr-h4 fr-mt-4w">Endpoint</h3>
        <p>L'endpoint GraphQL est disponible à l'adresse suivante :</p>
        <div
          style={{
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid var(--border-default-grey)",
          }}
        >
          {!isSyntaxHighlighterLoaded ? (
            <pre
              className="fr-code"
              style={{
                margin: 0,
                padding: "1rem",
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
              }}
            >
              <code>Chargement...</code>
            </pre>
          ) : (
            <SyntaxHighlighter
              language="http"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: "0.875rem",
              }}
            >
              {`POST https://contribcit.org/api/graphql`}
            </SyntaxHighlighter>
          )}
        </div>

        <h3 className="fr-h4 fr-mt-4w">Sandbox de test</h3>
        <p>
          Vous pouvez tester l'API GraphQL directement dans votre navigateur
          grâce à notre sandbox Apollo intégrée :
        </p>
        <div className="fr-mt-2w">
          <a
            href="/api/graphql/sandbox"
            target="_blank"
            rel="noopener noreferrer"
            className="fr-btn fr-btn--primary"
          >
            Ouvrir la sandbox GraphQL
          </a>
        </div>

        <h3 className="fr-h4 fr-mt-4w">Exemples de requêtes</h3>
        <p>Sélectionnez un langage pour voir un exemple d'implémentation :</p>

        <div className="fr-mt-2w fr-mb-2w">
          <div className="fr-btns-group fr-btns-group--inline">
            <button
              className={`fr-btn fr-btn--secondary ${
                selectedLanguage === "graphql" ? "fr-btn--active" : ""
              }`}
              onClick={() => setSelectedLanguage("graphql")}
            >
              GraphQL
            </button>
            <button
              className={`fr-btn fr-btn--secondary ${
                selectedLanguage === "curl" ? "fr-btn--active" : ""
              }`}
              onClick={() => setSelectedLanguage("curl")}
            >
              cURL
            </button>
            <button
              className={`fr-btn fr-btn--secondary ${
                selectedLanguage === "node" ? "fr-btn--active" : ""
              }`}
              onClick={() => setSelectedLanguage("node")}
            >
              Node.js
            </button>
            <button
              className={`fr-btn fr-btn--secondary ${
                selectedLanguage === "python" ? "fr-btn--active" : ""
              }`}
              onClick={() => setSelectedLanguage("python")}
            >
              Python
            </button>
            <button
              className={`fr-btn fr-btn--secondary ${
                selectedLanguage === "php" ? "fr-btn--active" : ""
              }`}
              onClick={() => setSelectedLanguage("php")}
            >
              PHP
            </button>
          </div>
        </div>

        <div
          style={{
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid var(--border-default-grey)",
          }}
        >
          {!isSyntaxHighlighterLoaded ? (
            <pre
              className="fr-code"
              style={{
                margin: 0,
                padding: "1rem",
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
              }}
            >
              <code>Chargement...</code>
            </pre>
          ) : (
            <>
              {selectedLanguage === "graphql" && (
                <SyntaxHighlighter
                  language="graphql"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: "0.875rem",
                  }}
                >
                  {exampleQuery}
                </SyntaxHighlighter>
              )}
              {selectedLanguage === "curl" && (
                <SyntaxHighlighter
                  language="bash"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: "0.875rem",
                  }}
                >
                  {curlExample}
                </SyntaxHighlighter>
              )}
              {selectedLanguage === "node" && (
                <SyntaxHighlighter
                  language="javascript"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: "0.875rem",
                  }}
                >
                  {nodeExample}
                </SyntaxHighlighter>
              )}
              {selectedLanguage === "python" && (
                <SyntaxHighlighter
                  language="python"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: "0.875rem",
                  }}
                >
                  {pythonExample}
                </SyntaxHighlighter>
              )}
              {selectedLanguage === "php" && (
                <SyntaxHighlighter
                  language="php"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: "0.875rem",
                  }}
                >
                  {phpExample}
                </SyntaxHighlighter>
              )}
            </>
          )}
        </div>

        <h3 className="fr-h4 fr-mt-4w">Queries disponibles</h3>
        <ul>
          <li>
            <strong>commune</strong> : Récupère les informations de votre
            commune
          </li>
          <li>
            <strong>contribution(id)</strong> : Récupère une contribution
            spécifique par son ID
          </li>
          <li>
            <strong>contributions(filter, pagination)</strong> : Liste paginée
            des contributions avec filtres optionnels
          </li>
          <li>
            <strong>stats(startDate, endDate)</strong> : Statistiques agrégées
            sur les contributions
          </li>
          <li>
            <strong>categories</strong> : Liste des catégories actives
          </li>
        </ul>

        <h3 className="fr-h4 fr-mt-4w">Filtres et pagination</h3>
        <p>
          La query <code>contributions</code> accepte des filtres et une
          pagination :
        </p>
        <ul>
          <li>
            <strong>Filtres</strong> : status (OPEN/CLOSED), type
            (ALERT/SUGGESTION), categoryId, startDate, endDate
          </li>
          <li>
            <strong>Pagination</strong> : Utilisez <code>first</code> et{" "}
            <code>after</code> pour paginer vers l'avant, ou <code>last</code>{" "}
            et <code>before</code> pour paginer vers l'arrière
          </li>
        </ul>

        <h3 className="fr-h4 fr-mt-4w">Exemple avec filtres</h3>
        <div
          style={{
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid var(--border-default-grey)",
          }}
        >
          {!isSyntaxHighlighterLoaded ? (
            <pre
              className="fr-code"
              style={{
                margin: 0,
                padding: "1rem",
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
              }}
            >
              <code>Chargement...</code>
            </pre>
          ) : (
            <SyntaxHighlighter
              language="graphql"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: "0.875rem",
              }}
            >
              {`query {
  contributions(
    filter: {
      status: OPEN
      type: ALERT
      startDate: "2024-01-01T00:00:00Z"
    }
    pagination: {
      first: 20
    }
  ) {
    totalCount
    edges {
      node {
        id
        ticketNumber
        type
        status
        categoryLabel
        createdAt
      }
    }
  }
}`}
            </SyntaxHighlighter>
          )}
        </div>

        <h3 className="fr-h4 fr-mt-4w">Sécurité</h3>
        <p>
          L'API GraphQL est en lecture seule. Vous ne pouvez accéder qu'aux
          données de votre propre commune. Toutes les requêtes sont
          automatiquement filtrées par votre communeId pour garantir l'isolation
          des données.
        </p>

        <h3 className="fr-h4 fr-mt-4w">Limites</h3>
        <ul>
          <li>La pagination est limitée à 100 éléments par page</li>
          <li>
            Par défaut, 20 éléments sont retournés si aucune limite n'est
            spécifiée
          </li>
          <li>L'API est en lecture seule (pas de mutations)</li>
        </ul>
      </div>
    </section>
  );
}
