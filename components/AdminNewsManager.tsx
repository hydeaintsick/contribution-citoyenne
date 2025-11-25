"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { RichTextEditor } from "@/components/RichTextEditor";
import { sanitizeHtml } from "@/lib/sanitize";

type NewsItem = {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  readCount?: number;
  createdBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

type Reader = {
  communeId: string;
  communeName: string;
  postalCode: string;
  readAt: string;
};

type AdminNewsManagerProps = {
  initialNews: NewsItem[];
};

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

function formatDateTime(value: Date | string) {
  return dateTimeFormatter.format(new Date(value));
}

function formatUserName(user: { firstName: string | null; lastName: string | null; email: string }) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || user.email;
}

export function AdminNewsManager({ initialNews }: AdminNewsManagerProps) {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [readersModalOpen, setReadersModalOpen] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [isLoadingReaders, setIsLoadingReaders] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const resetForm = useCallback(() => {
    setFormTitle("");
    setFormContent("");
    setFormIsActive(true);
    setError(null);
    setSuccess(null);
  }, []);

  const loadNews = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/news", {
        headers: {
          "Cache-Control": "no-store",
        },
      });
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des annonces");
      }
      const data = await response.json();
      setNews(data.news || []);
    } catch (err) {
      console.error("Failed to load news", err);
      setError("Impossible de charger les annonces.");
    }
  }, []);

  const handleCreate = useCallback(() => {
    setIsCreating(true);
    setEditingNews(null);
    resetForm();
  }, [resetForm]);

  const handleEdit = useCallback((item: NewsItem) => {
    setEditingNews(item);
    setIsCreating(false);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormIsActive(item.isActive);
    setError(null);
    setSuccess(null);
  }, []);

  const handleCancel = useCallback(() => {
    setIsCreating(false);
    setEditingNews(null);
    resetForm();
  }, [resetForm]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      try {
        const sanitizedContent = sanitizeHtml(formContent);

        if (editingNews) {
          // Mise à jour
          const response = await fetch(`/api/admin/news/${editingNews.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: formTitle,
              content: sanitizedContent,
              isActive: formIsActive,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Erreur lors de la mise à jour");
          }

          setSuccess("Annonce mise à jour avec succès.");
        } else {
          // Création
          const response = await fetch("/api/admin/news", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: formTitle,
              content: sanitizedContent,
              isActive: formIsActive,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Erreur lors de la création");
          }

          setSuccess("Annonce créée avec succès.");
        }

        await loadNews();
        setTimeout(() => {
          handleCancel();
        }, 1500);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Une erreur est survenue.";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formTitle, formContent, formIsActive, editingNews, loadNews, handleCancel],
  );

  const handleToggleActive = useCallback(
    async (item: NewsItem) => {
      try {
        const response = await fetch(`/api/admin/news/${item.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !item.isActive,
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour");
        }

        await loadNews();
      } catch (err) {
        console.error("Failed to toggle news active status", err);
        setError("Impossible de modifier le statut de l'annonce.");
      }
    },
    [loadNews],
  );

  const handleDelete = useCallback(
    async (item: NewsItem) => {
      if (!confirm(`Êtes-vous sûr de vouloir supprimer l'annonce "${item.title}" ?`)) {
        return;
      }

      try {
        const response = await fetch(`/api/admin/news/${item.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression");
        }

        await loadNews();
        setSuccess("Annonce supprimée avec succès.");
      } catch (err) {
        console.error("Failed to delete news", err);
        setError("Impossible de supprimer l'annonce.");
      }
    },
    [loadNews],
  );

  const handleViewReaders = useCallback(async (newsId: string) => {
    setSelectedNewsId(newsId);
    setReadersModalOpen(true);
    setIsLoadingReaders(true);
    setReaders([]);

    try {
      const response = await fetch(`/api/admin/news/${newsId}/readers`, {
        headers: {
          "Cache-Control": "no-store",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des communes");
      }

      const data = await response.json();
      setReaders(data.readers || []);
    } catch (err) {
      console.error("Failed to load readers", err);
      setError("Impossible de charger la liste des communes.");
    } finally {
      setIsLoadingReaders(false);
    }
  }, []);

  const closeReadersModal = useCallback(() => {
    setReadersModalOpen(false);
    setSelectedNewsId(null);
    setReaders([]);
  }, []);

  const activeNews = news.filter((n) => n.isActive);
  const inactiveNews = news.filter((n) => !n.isActive);

  return (
    <div className="fr-flow">
      <div className="fr-grid-row fr-grid-row--middle fr-grid-row--between">
        <div className="fr-col">
          <h1 className="fr-h3">Gestion des annonces</h1>
          <p className="fr-text--sm fr-text-mention--grey">
            Créez et gérez les annonces affichées dans le carousel du dashboard municipal.
          </p>
        </div>
        <div className="fr-col-auto">
          <Button
            iconId="fr-icon-add-line"
            onClick={handleCreate}
            disabled={isCreating || editingNews !== null}
          >
            Créer une annonce
          </Button>
        </div>
      </div>

      <div className="fr-grid-row">
        <div className="fr-col-12">
      {(isCreating || editingNews) && (
        <div className="fr-mt-4w">
          <div className="fr-card fr-card--no-arrow fr-card--shadow">
            <div className="fr-card__body fr-px-4w fr-py-4w">
              <h2 className="fr-h4 fr-mb-2w">
                {editingNews ? "Modifier l'annonce" : "Nouvelle annonce"}
              </h2>

              {error && (
                <Alert
                  severity="error"
                  title="Erreur"
                  description={error}
                  className="fr-mb-3w"
                />
              )}

              {success && (
                <Alert
                  severity="success"
                  title="Succès"
                  description={success}
                  className="fr-mb-3w"
                />
              )}

              <form onSubmit={handleSubmit}>
                <div className="fr-input-group fr-mb-3w">
                  <label className="fr-label" htmlFor="news-title">
                    Titre <span className="fr-text--bold">*</span>
                  </label>
                  <input
                    className="fr-input"
                    id="news-title"
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="fr-input-group fr-mb-3w">
                  <label className="fr-label" htmlFor="news-content">
                    Contenu <span className="fr-text--bold">*</span>
                  </label>
                  <RichTextEditor
                    value={formContent}
                    onChange={setFormContent}
                    placeholder="Saisissez le contenu de l'annonce..."
                    maxLength={5000}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="fr-checkbox-group fr-mb-3w">
                  <input
                    type="checkbox"
                    id="news-active"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <label className="fr-label" htmlFor="news-active">
                    Annonce active (visible dans le carousel)
                  </label>
                </div>

                <div className="fr-btns-group fr-btns-group--right fr-btns-group--inline">
                  <Button
                    priority="secondary"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Enregistrement..."
                      : editingNews
                        ? "Mettre à jour"
                        : "Créer"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {error && !isCreating && !editingNews && (
        <Alert
          severity="error"
          title="Erreur"
          description={error}
          className="fr-mt-4w"
        />
      )}

      {success && !isCreating && !editingNews && (
        <Alert
          severity="success"
          title="Succès"
          description={success}
          className="fr-mt-4w"
        />
      )}

      {activeNews.length > 0 && (
        <div className="fr-mt-4w">
          <h2 className="fr-h4 fr-mb-2w">Annonces actives</h2>
          <div className="fr-table">
            <table>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Créée par</th>
                  <th>Date de création</th>
                  <th>Vues</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeNews.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                    </td>
                    <td>{formatUserName(item.createdBy)}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="fr-link fr-link--sm"
                        onClick={() => handleViewReaders(item.id)}
                        style={{ cursor: "pointer" }}
                      >
                        {item.readCount ?? 0}
                      </button>
                    </td>
                    <td>
                      <div className="fr-btns-group fr-btns-group--sm fr-btns-group--inline">
                        <Button
                          priority="secondary"
                          size="small"
                          onClick={() => handleEdit(item)}
                          disabled={isCreating || editingNews !== null}
                        >
                          Modifier
                        </Button>
                        <Button
                          priority="secondary"
                          size="small"
                          onClick={() => handleToggleActive(item)}
                        >
                          Désactiver
                        </Button>
                        <Button
                          priority="secondary"
                          size="small"
                          onClick={() => handleDelete(item)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {inactiveNews.length > 0 && (
        <div className="fr-mt-4w">
          <h2 className="fr-h4 fr-mb-2w">Annonces désactivées</h2>
          <div className="fr-table">
            <table>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Créée par</th>
                  <th>Date de création</th>
                  <th>Vues</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inactiveNews.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                    </td>
                    <td>{formatUserName(item.createdBy)}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="fr-link fr-link--sm"
                        onClick={() => handleViewReaders(item.id)}
                        style={{ cursor: "pointer" }}
                      >
                        {item.readCount ?? 0}
                      </button>
                    </td>
                    <td>
                      <div className="fr-btns-group fr-btns-group--sm fr-btns-group--inline">
                        <Button
                          priority="secondary"
                          size="small"
                          onClick={() => handleEdit(item)}
                          disabled={isCreating || editingNews !== null}
                        >
                          Modifier
                        </Button>
                        <Button
                          priority="secondary"
                          size="small"
                          onClick={() => handleToggleActive(item)}
                        >
                          Activer
                        </Button>
                        <Button
                          priority="secondary"
                          size="small"
                          onClick={() => handleDelete(item)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {news.length === 0 && (
        <div className="fr-mt-4w">
          <Alert
            severity="info"
            title="Aucune annonce"
            description="Aucune annonce n'a été créée pour le moment."
          />
        </div>
      )}
        </div>
      </div>

      <div
        className={`fr-modal${readersModalOpen ? " fr-modal--opened" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-readers-modal-title"
        id="news-readers-modal"
      >
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className="fr-modal__body">
            <div className="fr-modal__header">
              <button
                className="fr-btn--close fr-btn"
                title="Fermer"
                type="button"
                onClick={closeReadersModal}
              >
                Fermer
              </button>
            </div>
            <div className="fr-modal__content">
              <h1 className="fr-h4" id="news-readers-modal-title">
                Communes ayant lu l&apos;annonce
              </h1>
              {isLoadingReaders ? (
                <p className="fr-text--sm fr-mt-2w">Chargement...</p>
              ) : readers.length === 0 ? (
                <p className="fr-text--sm fr-mt-2w">
                  Aucune commune n&apos;a encore lu cette annonce.
                </p>
              ) : (
                <div className="fr-mt-3w">
                  <div className="fr-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Commune</th>
                          <th>Code postal</th>
                          <th>Date de lecture</th>
                        </tr>
                      </thead>
                      <tbody>
                        {readers.map((reader) => (
                          <tr key={reader.communeId}>
                            <td>
                              <strong>{reader.communeName}</strong>
                            </td>
                            <td>{reader.postalCode}</td>
                            <td>{formatDateTime(reader.readAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

