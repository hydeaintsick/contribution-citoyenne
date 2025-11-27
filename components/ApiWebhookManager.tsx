"use client";

import { useCallback, useState, useEffect } from "react";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";

type WebhookLog = {
  id: string;
  url: string;
  statusCode: number | null;
  success: boolean;
  errorMessage: string | null;
  responseTime: number | null;
  contributionId: string | null;
  isTest: boolean;
  createdAt: string;
};

type ApiWebhookManagerProps = {
  initialWebhookUrl: string | null;
  initialWebhookSecret: string | null;
  initialLogs: WebhookLog[];
};

export function ApiWebhookManager({
  initialWebhookUrl,
  initialWebhookSecret,
  initialLogs,
}: ApiWebhookManagerProps) {
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl ?? "");
  const [webhookSecret, setWebhookSecret] = useState(
    initialWebhookSecret ?? ""
  );
  const [logs, setLogs] = useState<WebhookLog[]>(initialLogs);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "success" | "error" | "test-success" | "test-error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isConfigured = Boolean(webhookUrl && webhookSecret);

  const loadLogs = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/webhook/logs?limit=100");
      if (response.ok) {
        const data = (await response.json()) as { logs: WebhookLog[] };
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Failed to load logs", error);
    }
  }, []);

  const handleSave = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setStatus("idle");
      setMessage(null);

      try {
        const response = await fetch("/api/admin/webhook", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: webhookUrl }),
        });

        const data = (await response.json()) as
          | { webhookUrl: string; webhookSecret: string }
          | { error: string };

        if (!response.ok) {
          throw new Error(
            "error" in data ? data.error : "Erreur lors de l'enregistrement"
          );
        }

        if ("webhookSecret" in data) {
          setWebhookSecret(data.webhookSecret);
        }
        setStatus("success");
        setMessage("Configuration enregistrée avec succès.");
        await loadLogs();
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Erreur lors de l'enregistrement."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [webhookUrl, loadLogs]
  );

  const handleDisable = useCallback(async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir désactiver le webhook ? Les nouveaux tickets ne seront plus envoyés. Vous pourrez le réactiver en cliquant sur 'Enregistrer' après avoir entré l'URL."
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setMessage(null);

    try {
      const response = await fetch("/api/admin/webhook", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error: string };
        throw new Error(data.error);
      }

      // Garder l'URL pour faciliter la réactivation, mais vider le secret
      // L'utilisateur devra juste réentrer l'URL et cliquer sur "Enregistrer"
      setWebhookSecret("");
      setStatus("success");
      setMessage(
        "Webhook désactivé avec succès. Vous pouvez le réactiver en entrant l'URL et en cliquant sur 'Enregistrer'."
      );
      await loadLogs();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Erreur lors de la désactivation."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [loadLogs]);

  const handleTest = useCallback(async () => {
    setIsTesting(true);
    setStatus("idle");
    setMessage(null);

    try {
      const response = await fetch("/api/admin/webhook", {
        method: "POST",
      });

      const data = (await response.json()) as
        | {
            success: boolean;
            statusCode?: number;
            errorMessage?: string;
            responseTime?: number;
          }
        | { error: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Erreur lors du test");
      }

      if ("success" in data) {
        if (data.success) {
          setStatus("test-success");
          setMessage(
            `Test réussi ! Réponse HTTP ${data.statusCode} en ${data.responseTime}ms`
          );
        } else {
          setStatus("test-error");
          setMessage(`Test échoué : ${data.errorMessage ?? "Erreur inconnue"}`);
        }
      }

      await loadLogs();
    } catch (error) {
      setStatus("test-error");
      setMessage(
        error instanceof Error ? error.message : "Erreur lors du test."
      );
    } finally {
      setIsTesting(false);
    }
  }, [loadLogs]);

  const handleCopySecret = useCallback(() => {
    if (webhookSecret) {
      navigator.clipboard.writeText(webhookSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [webhookSecret]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return "-";
    return `${ms}ms`;
  };

  return (
    <div className="fr-flow">
      <header className="fr-flow">
        <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
          <div className="fr-col-auto">
            <h1 className="fr-h3 fr-mb-0">API Webhook</h1>
          </div>
          <div className="fr-col-auto">
            <Tag
              style={{
                backgroundColor: "#FFD700",
                color: "#000000",
                fontWeight: "bold",
              }}
            >
              PREMIUM
            </Tag>
          </div>
        </div>
        <p className="fr-text--lead fr-mb-2">
          Configurez un webhook pour recevoir automatiquement les données de
          chaque nouveau ticket créé dans votre commune.
        </p>
      </header>

      {/* Section Configuration */}
      <section className="fr-mt-4w">
        <h2 className="fr-h4 fr-mb-2w">Configuration</h2>
        <div className="fr-card fr-card--no-arrow fr-card--shadow fr-card--horizontal">
          <div className="fr-card__body fr-px-4w fr-py-4w">
            {status === "success" && message && (
              <Alert
                severity="success"
                title="Succès"
                description={message}
                className="fr-mb-3w"
                closable
                onClose={() => setStatus("idle")}
              />
            )}

            {status === "error" && message && (
              <Alert
                severity="error"
                title="Erreur"
                description={message}
                className="fr-mb-3w"
                closable
                onClose={() => setStatus("idle")}
              />
            )}

            {status === "test-success" && message && (
              <Alert
                severity="success"
                title="Test réussi"
                description={message}
                className="fr-mb-3w"
                closable
                onClose={() => setStatus("idle")}
              />
            )}

            {status === "test-error" && message && (
              <Alert
                severity="error"
                title="Test échoué"
                description={message}
                className="fr-mb-3w"
                closable
                onClose={() => setStatus("idle")}
              />
            )}

            <form onSubmit={handleSave}>
              <div className="fr-input-group fr-mb-3w">
                <Input
                  label="URL du webhook"
                  hintText="L'URL HTTPS de votre endpoint qui recevra les notifications"
                  nativeInputProps={{
                    type: "url",
                    value: webhookUrl,
                    onChange: (e) => setWebhookUrl(e.target.value),
                    required: true,
                    placeholder: "https://example.com/webhook",
                  }}
                />
              </div>

              {webhookSecret && (
                <div className="fr-input-group fr-mb-3w">
                  <label className="fr-label" htmlFor="webhook-secret">
                    Secret du webhook
                  </label>
                  <div className="fr-input-wrap fr-input-wrap--addon">
                    <input
                      id="webhook-secret"
                      className="fr-input"
                      type="text"
                      value={webhookSecret}
                      readOnly
                      style={{ fontFamily: "monospace" }}
                    />
                    <button
                      type="button"
                      className="fr-btn fr-btn--secondary"
                      title="Copier le secret"
                      onClick={handleCopySecret}
                      style={{ minWidth: "auto" }}
                    >
                      {copied ? "Copié !" : "Copier"}
                    </button>
                  </div>
                  <p className="fr-hint-text fr-mt-1v">
                    Le secret est généré automatiquement pour garantir sa
                    sécurité. Copiez-le pour le configurer dans votre endpoint
                    webhook.
                  </p>
                </div>
              )}

              <div className="fr-btns-group fr-btns-group--inline">
                <Button
                  type="submit"
                  disabled={isSubmitting || !webhookUrl.trim()}
                  iconId={isSubmitting ? "fr-icon-refresh-line" : undefined}
                >
                  {isSubmitting
                    ? "Enregistrement..."
                    : isConfigured
                    ? "Enregistrer"
                    : webhookUrl.trim()
                    ? "Réactiver le webhook"
                    : "Enregistrer"}
                </Button>

                <Button
                  type="button"
                  priority="secondary"
                  onClick={handleTest}
                  disabled={isTesting || !isConfigured}
                >
                  {isTesting ? "Test en cours..." : "Tester le webhook"}
                </Button>

                <Button
                  type="button"
                  priority="tertiary"
                  onClick={handleDisable}
                  disabled={isSubmitting || !isConfigured}
                >
                  Désactiver
                </Button>
              </div>
            </form>

            <div className="fr-mt-4w">
              <Button
                type="button"
                priority="secondary"
                iconId="fr-icon-external-link-line"
                iconPosition="right"
                onClick={() => window.open("/docs#webhook", "_blank")}
              >
                Voir la documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section Logs */}
      <section className="fr-mt-4w">
        <Accordion
          label={`Logs des 100 dernières tentatives${
            logs.length > 0 ? ` (${logs.length})` : ""
          }`}
          className="fr-mb-4w"
        >
          {logs.length === 0 ? (
            <p className="fr-text--sm fr-text-mention--grey">
              Aucun log disponible pour le moment.
            </p>
          ) : (
            <div className="fr-table fr-table--bordered">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>URL</th>
                    <th>Statut</th>
                    <th>Temps de réponse</th>
                    <th>Erreur</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.createdAt)}</td>
                      <td>
                        {log.isTest ? <Tag>TEST</Tag> : <Tag>Production</Tag>}
                      </td>
                      <td>
                        <code className="fr-text--xs">
                          {log.url.length > 40
                            ? `${log.url.substring(0, 40)}...`
                            : log.url}
                        </code>
                      </td>
                      <td>
                        {log.success ? (
                          <Tag className="fr-tag--success">
                            {log.statusCode ?? "OK"}
                          </Tag>
                        ) : (
                          <Tag className="fr-tag--error">
                            {log.statusCode ?? "Erreur"}
                          </Tag>
                        )}
                      </td>
                      <td>{formatResponseTime(log.responseTime)}</td>
                      <td>
                        {log.errorMessage ? (
                          <span className="fr-text--xs fr-text--error">
                            {log.errorMessage.length > 50
                              ? `${log.errorMessage.substring(0, 50)}...`
                              : log.errorMessage}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Accordion>
      </section>
    </div>
  );
}
