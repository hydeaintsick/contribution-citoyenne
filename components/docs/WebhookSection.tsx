"use client";

import { useEffect, useState, useRef } from "react";
import { useDocsContext } from "../DocsLayout";

let SyntaxHighlighter: any = null;
let vscDarkPlus: any = null;

export function WebhookSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { registerSection } = useDocsContext();
  const [isSyntaxHighlighterLoaded, setIsSyntaxHighlighterLoaded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<
    "json" | "curl" | "node" | "python" | "php" | "java" | "ruby" | "csharp"
  >("json");

  useEffect(() => {
    if (typeof window !== "undefined" && !isSyntaxHighlighterLoaded) {
      Promise.all([
        import("react-syntax-highlighter").then((mod) => mod.Prism),
        import("react-syntax-highlighter/dist/cjs/styles/prism").then((mod) => mod.vscDarkPlus),
      ]).then(([SyntaxHighlighterModule, vscDarkPlusModule]) => {
        SyntaxHighlighter = SyntaxHighlighterModule;
        vscDarkPlus = vscDarkPlusModule;
        setIsSyntaxHighlighterLoaded(true);
      });
    }
  }, [isSyntaxHighlighterLoaded]);

  useEffect(() => {
    if (sectionRef.current) {
      registerSection("webhook", sectionRef.current);
    }
  }, [registerSection]);

  const jsonPayload = JSON.stringify(
    {
      event: "contribution.created",
      timestamp: "2024-01-15T10:30:00Z",
      contribution: {
        id: "string",
        ticketNumber: "CT-2024-001234",
        type: "ALERT",
        status: "OPEN",
        category: {
          id: "string",
          name: "Voirie",
        },
        title: "Titre du signalement",
        details: "Description détaillée",
        email: "email@example.com",
        location: {
          label: "Adresse",
          latitude: 48.8566,
          longitude: 2.3522,
        },
        photo: {
          url: "https://example.com/photo.jpg",
          publicId: "string",
        },
        createdAt: "2024-01-15T10:30:00Z",
        isPotentiallyMalicious: false,
      },
      commune: {
        id: "string",
        name: "Paris",
        postalCode: "75001",
      },
    },
    null,
    2
  );

  return (
    <section
      ref={sectionRef as any}
      id="webhook"
      className="fr-mb-8w"
      style={{ scrollMarginTop: "100px" }}
    >
      <h2 className="fr-h2 fr-mb-2w">Webhook</h2>
      <p className="fr-text--lead fr-mb-4w">
        Recevez automatiquement les données de chaque nouveau ticket créé dans votre commune via un webhook.
      </p>

      <div className="fr-flow">
        <h3 className="fr-h4">Introduction</h3>
        <p>
          Les webhooks permettent à Contribcit d'envoyer des notifications en temps réel à votre serveur
          lorsqu'un nouveau ticket est créé. Cela vous permet d'intégrer les contributions citoyennes
          directement dans vos systèmes existants.
        </p>

        <h3 className="fr-h4 fr-mt-4w">Configuration</h3>
        <p>
          Pour configurer un webhook, vous devez :
        </p>
        <ol>
          <li>Accéder à la page de configuration API dans votre tableau de bord</li>
          <li>Entrer l'URL HTTPS de votre endpoint qui recevra les notifications</li>
          <li>Copier le secret généré automatiquement</li>
          <li>Configurer votre endpoint pour vérifier le secret dans les headers</li>
        </ol>

        <h3 className="fr-h4 fr-mt-4w">Format JSON envoyé</h3>
        <p>
          Chaque fois qu'un nouveau ticket est créé, une requête POST est envoyée à votre URL avec le payload suivant :
        </p>

        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              zIndex: 10,
            }}
          >
            <select
              className="fr-select"
              value={selectedLanguage}
              onChange={(e) =>
                setSelectedLanguage(e.target.value as "json" | "curl" | "node" | "python")
              }
              style={{
                fontSize: "0.875rem",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid var(--border-default-grey)",
                backgroundColor: "var(--background-default-grey)",
              }}
            >
              <option value="json">JSON</option>
              <option value="curl">cURL</option>
              <option value="node">Node.js</option>
              <option value="python">Python</option>
              <option value="php">PHP</option>
              <option value="java">Java</option>
              <option value="ruby">Ruby</option>
              <option value="csharp">C#</option>
            </select>
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
                  minHeight: "200px",
                }}
              >
                <code>Chargement...</code>
              </pre>
            ) : (
              <>
                {selectedLanguage === "json" && (
                  <SyntaxHighlighter
                    language="json"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      fontSize: "0.875rem",
                    }}
                  >
                    {jsonPayload}
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
                    {`curl -X POST https://votre-endpoint.com/webhook \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Secret: votre-secret" \\
  -d '${jsonPayload.replace(/'/g, "\\'")}'`}
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
                    {`const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  // Vérifier le secret
  const secret = req.headers['x-webhook-secret'];
  if (secret !== 'votre-secret') {
    return res.status(401).send('Unauthorized');
  }
  
  // Récupérer les données
  const { event, contribution, commune } = req.body;
  
  // Vérifier le type d'événement
  if (event === 'contribution.created') {
    console.log('Nouveau ticket:', contribution.ticketNumber);
    console.log('Commune:', commune.name);
    console.log('Type:', contribution.type);
    console.log('Catégorie:', contribution.category.name);
    
    // Traiter le webhook...
    // Exemple: sauvegarder en base de données, envoyer une notification, etc.
  }
  
  // Répondre rapidement (dans les 5 secondes)
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Serveur webhook démarré sur le port 3000');
});`}
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
                    {`from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    # Vérifier le secret
    secret = request.headers.get('X-Webhook-Secret')
    if secret != 'votre-secret':
        return 'Unauthorized', 401
    
    # Récupérer les données
    data = request.json
    event = data.get('event')
    contribution = data.get('contribution')
    commune = data.get('commune')
    
    # Vérifier le type d'événement
    if event == 'contribution.created':
        print(f"Nouveau ticket: {contribution.get('ticketNumber')}")
        print(f"Commune: {commune.get('name')}")
        print(f"Type: {contribution.get('type')}")
        print(f"Catégorie: {contribution.get('category', {}).get('name')}")
        
        # Traiter le webhook...
        # Exemple: sauvegarder en base de données, envoyer une notification, etc.
    
    # Répondre rapidement (dans les 5 secondes)
    return 'OK', 200

if __name__ == '__main__':
    app.run(port=3000)`}
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
                    {`<?php

// Exemple avec Symfony ou framework similaire
// Route: POST /webhook

use Symfony\\Component\\HttpFoundation\\Request;
use Symfony\\Component\\HttpFoundation\\Response;
use Symfony\\Component\\HttpFoundation\\JsonResponse;

public function webhook(Request $request): Response
{
    // Vérifier le secret
    $secret = $request->headers->get('X-Webhook-Secret');
    if ($secret !== 'votre-secret') {
        return new Response('Unauthorized', 401);
    }
    
    // Récupérer les données
    $data = json_decode($request->getContent(), true);
    $event = $data['event'] ?? null;
    $contribution = $data['contribution'] ?? null;
    $commune = $data['commune'] ?? null;
    
    // Vérifier le type d'événement
    if ($event === 'contribution.created') {
        error_log('Nouveau ticket: ' . $contribution['ticketNumber']);
        error_log('Commune: ' . $commune['name']);
        error_log('Type: ' . $contribution['type']);
        error_log('Catégorie: ' . $contribution['category']['name']);
        
        // Traiter le webhook...
        // Exemple: sauvegarder en base de données, envoyer une notification, etc.
    }
    
    // Répondre rapidement (dans les 5 secondes)
    return new JsonResponse(['status' => 'OK'], 200);
}

// Exemple avec PHP natif
/*
$secret = $_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? '';
if ($secret !== 'votre-secret') {
    http_response_code(401);
    echo 'Unauthorized';
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$event = $data['event'] ?? null;
$contribution = $data['contribution'] ?? null;
$commune = $data['commune'] ?? null;

if ($event === 'contribution.created') {
    error_log('Nouveau ticket: ' . $contribution['ticketNumber']);
    // Traiter le webhook...
}

http_response_code(200);
echo json_encode(['status' => 'OK']);
*/`}
                  </SyntaxHighlighter>
                )}
                {selectedLanguage === "java" && (
                  <SyntaxHighlighter
                    language="java"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      fontSize: "0.875rem",
                    }}
                  >
                    {`// Exemple avec Spring Boot

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import javax.servlet.http.HttpServletRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

@RestController
@RequestMapping("/webhook")
public class WebhookController {
    
    private static final String WEBHOOK_SECRET = "votre-secret";
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @PostMapping
    public ResponseEntity<String> webhook(
            HttpServletRequest request,
            @RequestBody Map<String, Object> payload) {
        
        // Vérifier le secret
        String secret = request.getHeader("X-Webhook-Secret");
        if (secret == null || !secret.equals(WEBHOOK_SECRET)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Unauthorized");
        }
        
        // Récupérer les données
        String event = (String) payload.get("event");
        Map<String, Object> contribution = 
            (Map<String, Object>) payload.get("contribution");
        Map<String, Object> commune = 
            (Map<String, Object>) payload.get("commune");
        
        // Vérifier le type d'événement
        if ("contribution.created".equals(event)) {
            System.out.println("Nouveau ticket: " + 
                contribution.get("ticketNumber"));
            System.out.println("Commune: " + commune.get("name"));
            System.out.println("Type: " + contribution.get("type"));
            Map<String, Object> category = 
                (Map<String, Object>) contribution.get("category");
            System.out.println("Catégorie: " + category.get("name"));
            
            // Traiter le webhook...
            // Exemple: sauvegarder en base de données, envoyer une notification, etc.
        }
        
        // Répondre rapidement (dans les 5 secondes)
        return ResponseEntity.ok("OK");
    }
}`}
                  </SyntaxHighlighter>
                )}
                {selectedLanguage === "ruby" && (
                  <SyntaxHighlighter
                    language="ruby"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      fontSize: "0.875rem",
                    }}
                  >
                    {`# Exemple avec Ruby on Rails

class WebhooksController < ApplicationController
  skip_before_action :verify_authenticity_token
  
  def webhook
    # Vérifier le secret
    secret = request.headers['X-Webhook-Secret']
    unless secret == 'votre-secret'
      return render json: { error: 'Unauthorized' }, status: :unauthorized
    end
    
    # Récupérer les données
    data = JSON.parse(request.body.read)
    event = data['event']
    contribution = data['contribution']
    commune = data['commune']
    
    # Vérifier le type d'événement
    if event == 'contribution.created'
      Rails.logger.info "Nouveau ticket: #{contribution['ticketNumber']}"
      Rails.logger.info "Commune: #{commune['name']}"
      Rails.logger.info "Type: #{contribution['type']}"
      Rails.logger.info "Catégorie: #{contribution['category']['name']}"
      
      # Traiter le webhook...
      # Exemple: sauvegarder en base de données, envoyer une notification, etc.
    end
    
    # Répondre rapidement (dans les 5 secondes)
    render json: { status: 'OK' }, status: :ok
  end
end

# routes.rb
# post '/webhook', to: 'webhooks#webhook'`}
                  </SyntaxHighlighter>
                )}
                {selectedLanguage === "csharp" && (
                  <SyntaxHighlighter
                    language="csharp"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      fontSize: "0.875rem",
                    }}
                  >
                    {`// Exemple avec ASP.NET Core

using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace WebhookApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WebhookController : ControllerBase
    {
        private const string WebhookSecret = "votre-secret";
        
        [HttpPost]
        public IActionResult Webhook([FromBody] JsonElement payload)
        {
            // Vérifier le secret
            if (!Request.Headers.TryGetValue("X-Webhook-Secret", out var secret) ||
                secret != WebhookSecret)
            {
                return Unauthorized("Unauthorized");
            }
            
            // Récupérer les données
            var eventType = payload.GetProperty("event").GetString();
            var contribution = payload.GetProperty("contribution");
            var commune = payload.GetProperty("commune");
            
            // Vérifier le type d'événement
            if (eventType == "contribution.created")
            {
                var ticketNumber = contribution.GetProperty("ticketNumber").GetString();
                var communeName = commune.GetProperty("name").GetString();
                var type = contribution.GetProperty("type").GetString();
                var categoryName = contribution
                    .GetProperty("category")
                    .GetProperty("name")
                    .GetString();
                
                Console.WriteLine($"Nouveau ticket: {ticketNumber}");
                Console.WriteLine($"Commune: {communeName}");
                Console.WriteLine($"Type: {type}");
                Console.WriteLine($"Catégorie: {categoryName}");
                
                // Traiter le webhook...
                // Exemple: sauvegarder en base de données, envoyer une notification, etc.
            }
            
            // Répondre rapidement (dans les 5 secondes)
            return Ok(new { status = "OK" });
        }
    }
}`}
                  </SyntaxHighlighter>
                )}
              </>
            )}
          </div>
        </div>

        <h3 className="fr-h4 fr-mt-4w">Headers envoyés</h3>
        <p>Chaque requête webhook inclut les headers suivants :</p>
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
              {`Content-Type: application/json
X-Webhook-Secret: votre-secret`}
            </SyntaxHighlighter>
          )}
        </div>
        <p className="fr-text--sm fr-mt-2w">
          Le header <code>X-Webhook-Secret</code> contient le secret généré automatiquement.
          Vous devez vérifier ce secret dans votre endpoint pour authentifier les requêtes.
        </p>

        <h3 className="fr-h4 fr-mt-4w">Authentification</h3>
        <p>
          Pour sécuriser votre endpoint, vous devez vérifier le secret dans le header <code>X-Webhook-Secret</code>.
          Si le secret ne correspond pas, vous devez retourner une erreur 401 Unauthorized.
        </p>

        <h3 className="fr-h4 fr-mt-4w">Gestion des erreurs</h3>
        <p>Contribcit gère les erreurs de la manière suivante :</p>
        <ul>
          <li><strong>Timeout</strong> : Si votre endpoint ne répond pas dans les 5 secondes, la requête est annulée</li>
          <li><strong>Codes HTTP d'erreur</strong> : Les codes 4xx et 5xx sont considérés comme des erreurs</li>
          <li><strong>Logs</strong> : Toutes les tentatives sont enregistrées dans les logs de votre commune</li>
        </ul>

        <h3 className="fr-h4 fr-mt-4w">Bonnes pratiques</h3>
        <ul>
          <li><strong>Idempotence</strong> : Votre endpoint doit être idempotent. Utilisez le <code>ticketNumber</code> pour éviter les doublons</li>
          <li><strong>Réponse rapide</strong> : Répondez rapidement (dans les 5 secondes) pour éviter les timeouts</li>
          <li><strong>Validation</strong> : Validez toujours les données reçues avant de les traiter</li>
          <li><strong>Logging</strong> : Enregistrez les webhooks reçus pour le débogage</li>
          <li><strong>HTTPS</strong> : Utilisez toujours HTTPS pour votre endpoint webhook</li>
        </ul>

        <h3 className="fr-h4 fr-mt-4w">Structure des données</h3>
        <p>Le payload contient les champs suivants :</p>
        <ul>
          <li><code>event</code> : Type d'événement (actuellement "contribution.created")</li>
          <li><code>timestamp</code> : Date et heure de l'événement au format ISO 8601</li>
          <li><code>contribution</code> : Objet contenant toutes les données du ticket
            <ul>
              <li><code>id</code> : Identifiant unique de la contribution</li>
              <li><code>ticketNumber</code> : Numéro de ticket (ex: "CT-2024-001234")</li>
              <li><code>type</code> : Type de contribution ("ALERT" ou "SUGGESTION")</li>
              <li><code>status</code> : Statut du ticket ("OPEN", "IN_PROGRESS", "RESOLVED", etc.)</li>
              <li><code>category</code> : Catégorie du ticket (id et name)</li>
              <li><code>title</code> : Titre du signalement</li>
              <li><code>details</code> : Description détaillée</li>
              <li><code>email</code> : Email du contributeur (peut être null)</li>
              <li><code>location</code> : Localisation (label, latitude, longitude - peuvent être null)</li>
              <li><code>photo</code> : Photo associée (url et publicId - peuvent être null)</li>
              <li><code>createdAt</code> : Date de création au format ISO 8601</li>
              <li><code>isPotentiallyMalicious</code> : Indicateur de contenu potentiellement malveillant</li>
            </ul>
          </li>
          <li><code>commune</code> : Informations sur la commune
            <ul>
              <li><code>id</code> : Identifiant unique de la commune</li>
              <li><code>name</code> : Nom de la commune</li>
              <li><code>postalCode</code> : Code postal</li>
            </ul>
          </li>
        </ul>
      </div>
    </section>
  );
}

