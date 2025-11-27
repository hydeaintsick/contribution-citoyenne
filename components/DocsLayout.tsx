"use client";

import { useEffect, useState, useRef, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@codegouvfr/react-dsfr/Input";

type DocsLayoutProps = {
  children: React.ReactNode;
};

const SECTIONS = [
  { id: "webhook", title: "Webhook", available: true },
  { id: "graphql", title: "API GraphQL", available: true },
  { id: "services-tiers", title: "Services tiers", available: false },
];

const DocsContext = createContext<{
  registerSection: (id: string, element: HTMLElement) => void;
} | null>(null);

export function DocsLayout({ children }: DocsLayoutProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const sectionsRef = useRef<Map<string, HTMLElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const registerSection = (id: string, element: HTMLElement) => {
    sectionsRef.current.set(id, element);
  };

  useEffect(() => {
    // Scroll vers l'ancre au chargement si présente dans l'URL
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => {
        const element =
          sectionsRef.current.get(hash) || document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          setActiveSection(hash);
        }
      }, 300);
    }

    // Observer pour détecter la section active au scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const id = entry.target.id;
            setActiveSection(id);
            // Mettre à jour l'URL sans recharger la page
            if (window.location.hash !== `#${id}`) {
              window.history.replaceState(null, "", `#${id}`);
            }
          }
        });
      },
      {
        rootMargin: "-100px 0px -66% 0px",
        threshold: 0.5,
      }
    );

    // Observer toutes les sections après un délai
    const timeoutId = setTimeout(() => {
      sectionsRef.current.forEach((element) => {
        observer.observe(element);
      });
      // Aussi observer directement depuis le DOM
      SECTIONS.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element && !sectionsRef.current.has(section.id)) {
          sectionsRef.current.set(section.id, element);
          observer.observe(element);
        }
      });
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  const handleSectionClick = (sectionId: string) => {
    const element =
      sectionsRef.current.get(sectionId) || document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
      window.history.pushState(null, "", `#${sectionId}`);
    }
  };

  return (
    <DocsContext.Provider value={{ registerSection }}>
      <main className="fr-container--fluid fr-background-alt--grey fr-py-4w">
        <div className="fr-container">
          <div className="fr-grid-row fr-grid-row--gutters">
            {/* Menu latéral */}
            <aside className="fr-col-12 fr-col-md-3">
              <nav
                className="fr-sidemenu"
                role="navigation"
                aria-label="Menu latéral de documentation"
              >
                <div className="fr-sidemenu__inner">
                  <div className="fr-collapse" id="fr-sidemenu-wrapper">
                    <ul className="fr-sidemenu__list">
                      {SECTIONS.map((section) => (
                        <li key={section.id} className="fr-sidemenu__item">
                          <button
                            className={`fr-sidemenu__btn ${
                              activeSection === section.id
                                ? "fr-sidemenu__btn--active"
                                : ""
                            }`}
                            onClick={() => handleSectionClick(section.id)}
                            aria-current={
                              activeSection === section.id ? "page" : undefined
                            }
                            disabled={!section.available}
                            style={{
                              opacity: section.available ? 1 : 0.5,
                              cursor: section.available
                                ? "pointer"
                                : "not-allowed",
                            }}
                          >
                            {section.title}
                            {!section.available && (
                              <span
                                className="fr-text--xs fr-ml-1w"
                                style={{ fontStyle: "italic" }}
                              >
                                (bientôt disponible)
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </nav>
            </aside>

            {/* Contenu principal */}
            <div className="fr-col-12 fr-col-md-9">
              <div
                ref={containerRef}
                className="fr-background-default--grey fr-p-4w"
                style={{ borderRadius: "8px" }}
              >
                {/* Barre de recherche */}
                <div className="fr-mb-4w">
                  <Input
                    label="Rechercher dans la documentation"
                    hintText="Recherchez par mot-clé..."
                    nativeInputProps={{
                      type: "search",
                      value: searchQuery,
                      onChange: (e) => setSearchQuery(e.target.value),
                      placeholder: "Rechercher...",
                    }}
                  />
                </div>

                {/* Contenu des sections */}
                <div className="fr-flow">{children}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </DocsContext.Provider>
  );
}

// Hook pour utiliser le contexte
export function useDocsContext() {
  const context = useContext(DocsContext);
  if (!context) {
    throw new Error("useDocsContext must be used within DocsLayout");
  }
  return context;
}
