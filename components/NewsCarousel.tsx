"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { sanitizeHtml } from "@/lib/sanitize";

type NewsItem = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type NewsCarouselProps = {
  communeId: string;
};

const AUTO_SCROLL_INTERVAL = 8000; // 8 secondes

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeZone: "Europe/Paris",
});

function formatDate(value: Date | string) {
  return dateFormatter.format(new Date(value));
}

export function NewsCarousel({ communeId }: NewsCarouselProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingRead, setIsMarkingRead] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/news/for-commune/${communeId}`, {
        headers: {
          "Cache-Control": "no-store",
        },
      });
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des annonces");
      }
      const data = await response.json();
      const newsItems = data.news || [];
      setNews(newsItems);
      if (newsItems.length > 0) {
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error("Failed to load news", err);
    } finally {
      setIsLoading(false);
    }
  }, [communeId]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // Défilement automatique toutes les 8 secondes
  useEffect(() => {
    if (news.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [news.length]);

  const handleMarkAsRead = useCallback(
    async (newsId: string) => {
      setIsMarkingRead(newsId);
      try {
        const response = await fetch(`/api/admin/news/${newsId}/mark-read`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ communeId }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors du marquage comme lu");
        }

        // Recharger les annonces pour retirer celle qui vient d'être marquée comme lue
        await loadNews();
      } catch (err) {
        console.error("Failed to mark news as read", err);
      } finally {
        setIsMarkingRead(null);
      }
    },
    [communeId, loadNews],
  );

  const handleDotClick = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (isLoading) {
    return null;
  }

  if (news.length === 0) {
    return null;
  }

  const currentNews = news[currentIndex];

  return (
    <section className="fr-mt-4w fr-mb-4w" aria-label="Annonces du staff Contribcit">
      <div className="fr-alert fr-alert--info news-carousel__alert">
        <div className="news-carousel__alert-content">
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
            <div className="fr-col-12 fr-col-md-9">
              <div className="fr-mb-2w">
                <p className="fr-text--xs fr-text--bold fr-text-mention--grey fr-mb-1w">
                  ANNONCE DU STAFF CONTRIBCIT
                </p>
                <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
                  {formatDate(currentNews.createdAt)}
                </p>
              </div>
              <div
                className="news-carousel__content"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(currentNews.content),
                }}
              />
            </div>
            <div className="fr-col-12 fr-col-md-3 fr-text--right news-carousel__button-wrapper">
              <Button
                priority="secondary"
                size="small"
                iconId="fr-icon-check-line"
                onClick={() => handleMarkAsRead(currentNews.id)}
                disabled={isMarkingRead === currentNews.id}
              >
                {isMarkingRead === currentNews.id ? "Marquage..." : "Marquer comme lu"}
              </Button>
            </div>
          </div>

          {news.length > 1 && (
            <div className="fr-mt-3w">
              <div className="fr-btns-group fr-btns-group--center fr-btns-group--inline">
                {news.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`news-carousel__dot ${
                      index === currentIndex ? "news-carousel__dot--active" : ""
                    }`}
                    onClick={() => handleDotClick(index)}
                    aria-label={`Aller à l'annonce ${index + 1}`}
                    aria-current={index === currentIndex ? "true" : "false"}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .news-carousel__alert {
          position: relative;
        }

        .news-carousel__alert-content {
          padding-left: 0;
        }

        .news-carousel__button-wrapper {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-height: 100%;
        }

        @media (max-width: 767px) {
          .news-carousel__button-wrapper {
            margin-top: 1rem;
            min-height: auto;
          }
        }

        .news-carousel__content {
          color: var(--text-default-grey);
        }

        .news-carousel__content :global(p) {
          margin: 0 0 0.5rem 0;
        }

        .news-carousel__content :global(p:last-child) {
          margin-bottom: 0;
        }

        .news-carousel__content :global(a) {
          color: var(--text-action-high-blue-france);
          text-decoration: underline;
        }

        .news-carousel__content :global(a:hover) {
          text-decoration: none;
        }

        .news-carousel__dot {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 50%;
          border: none;
          background-color: var(--border-default-grey);
          cursor: pointer;
          padding: 0;
          margin: 0 0.25rem;
          transition: background-color 0.2s;
        }

        .news-carousel__dot:hover {
          background-color: var(--text-mention-grey);
        }

        .news-carousel__dot--active {
          background-color: var(--background-action-high-blue-france);
        }

        .news-carousel__dot:focus {
          outline: 2px solid var(--border-action-high-blue-france);
          outline-offset: 2px;
        }
      `}</style>
    </section>
  );
}

