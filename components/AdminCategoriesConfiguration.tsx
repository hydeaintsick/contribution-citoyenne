/* eslint-disable react/jsx-no-bind */
"use client";

import { useCallback, useMemo, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";

const DEFAULT_BADGE_COLOR = "#000091";
const DEFAULT_BADGE_TEXT_COLOR = "#FFFFFF";

type CategoryResource = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  badgeColor: string;
  badgeTextColor: string;
  createdAt: string;
  updatedAt: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

type EditableCategory = {
  id: string;
  name: string;
  description: string;
  badgeColor: string;
  badgeTextColor: string;
};

type Props = {
  initialCategories: CategoryResource[];
};

type ColorPickerFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  disabled?: boolean;
};

function ColorPickerField({
  id,
  label,
  value,
  onChange,
  hint,
  disabled = false,
}: ColorPickerFieldProps) {
  return (
    <div className="fr-input-group">
      <label className="fr-label" htmlFor={`${id}-color`}>
        {label}
      </label>
      {hint ? <span className="fr-hint-text">{hint}</span> : null}
      <div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
        <div className="fr-col-auto">
          <input
            id={`${id}-color`}
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="fr-input"
            disabled={disabled}
            style={{
              width: "3rem",
              height: "3rem",
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
            aria-describedby={`${id}-value`}
          />
        </div>
        <div className="fr-col">
          <code
            id={`${id}-value`}
            className="fr-text--sm fr-text-mention--grey-625"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "var(--background-alt-grey)",
              minWidth: "6.5rem",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {value}
          </code>
        </div>
      </div>
    </div>
  );
}

function sortCategories(categories: CategoryResource[]) {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export function AdminCategoriesConfiguration({ initialCategories }: Props) {
  const [categories, setCategories] = useState<CategoryResource[]>(
    sortCategories(initialCategories),
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createBadgeColor, setCreateBadgeColor] = useState(DEFAULT_BADGE_COLOR);
  const [createBadgeTextColor, setCreateBadgeTextColor] = useState(
    DEFAULT_BADGE_TEXT_COLOR,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null,
  );
  const [editableCategory, setEditableCategory] =
    useState<EditableCategory | null>(null);

  const resetFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const categoriesCount = categories.length;
  const activeCount = useMemo(
    () => categories.filter((category) => category.isActive).length,
    [categories],
  );

  const setCategoriesSorted = useCallback((next: CategoryResource[]) => {
    setCategories(sortCategories(next));
  }, []);

  const handleCreateCategory = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedName = createName.trim();

      if (trimmedName.length < 2) {
        setFeedback({
          type: "error",
          message: "Le nom de la catégorie doit contenir au moins 2 caractères.",
        });
        return;
      }

      setIsCreating(true);
      resetFeedback();

      try {
        const response = await fetch("/api/admin/configuration/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            description: createDescription.trim() || undefined,
            badgeColor: createBadgeColor,
            badgeTextColor: createBadgeTextColor,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            payload?.error ?? "Impossible de créer la catégorie.",
          );
        }

        const payload = (await response.json()) as {
          category: CategoryResource;
        };

        setCategoriesSorted([...categories, payload.category]);
        setCreateName("");
        setCreateDescription("");
        setCreateBadgeColor(DEFAULT_BADGE_COLOR);
        setCreateBadgeTextColor(DEFAULT_BADGE_TEXT_COLOR);
        setFeedback({
          type: "success",
          message: "Catégorie créée avec succès.",
        });
      } catch (error) {
        console.error("Failed to create category", error);
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Impossible de créer la catégorie.",
        });
      } finally {
        setIsCreating(false);
      }
    },
    [
      categories,
      createBadgeColor,
      createBadgeTextColor,
      createDescription,
      createName,
      resetFeedback,
      setCategoriesSorted,
    ],
  );

  const handleEditClick = useCallback(
    (category: CategoryResource) => {
      setEditableCategory({
        id: category.id,
        name: category.name,
        description: category.description ?? "",
        badgeColor: category.badgeColor,
        badgeTextColor: category.badgeTextColor,
      });
      resetFeedback();
    },
    [resetFeedback],
  );

  const handleCancelEdit = useCallback(() => {
    setEditableCategory(null);
    resetFeedback();
  }, [resetFeedback]);

  const handleSaveEdit = useCallback(async () => {
    if (!editableCategory) {
      return;
    }

    const trimmedName = editableCategory.name.trim();

    if (trimmedName.length < 2) {
      setFeedback({
        type: "error",
        message: "Le nom de la catégorie doit contenir au moins 2 caractères.",
      });
      return;
    }

    setPendingCategoryId(editableCategory.id);
    resetFeedback();

    try {
      const response = await fetch(
        `/api/admin/configuration/categories/${editableCategory.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            description: editableCategory.description.trim() || null,
            badgeColor: editableCategory.badgeColor,
            badgeTextColor: editableCategory.badgeTextColor,
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          payload?.error ?? "Impossible de mettre à jour la catégorie.",
        );
      }

      const payload = (await response.json()) as {
        category: CategoryResource;
      };

      setCategoriesSorted(
        categories.map((category) =>
          category.id === payload.category.id ? payload.category : category,
        ),
      );

      setEditableCategory(null);
      setFeedback({
        type: "success",
        message: "Catégorie mise à jour.",
      });
    } catch (error) {
      console.error("Failed to update category", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour la catégorie.",
      });
    } finally {
      setPendingCategoryId(null);
    }
  }, [categories, editableCategory, resetFeedback, setCategoriesSorted]);

  const handleToggleActive = useCallback(
    async (category: CategoryResource) => {
      setPendingCategoryId(category.id);
      resetFeedback();

      try {
        const response = await fetch(
          `/api/admin/configuration/categories/${category.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              isActive: !category.isActive,
            }),
          },
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            payload?.error ??
              "Impossible de changer l’état de la catégorie.",
          );
        }

        const payload = (await response.json()) as {
          category: CategoryResource;
        };

        setCategoriesSorted(
          categories.map((item) =>
            item.id === payload.category.id ? payload.category : item,
          ),
        );

        setFeedback({
          type: "success",
          message: payload.category.isActive
            ? "Catégorie activée."
            : "Catégorie désactivée.",
        });
      } catch (error) {
        console.error("Failed to toggle category", error);
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Impossible de modifier l’état de la catégorie.",
        });
      } finally {
        setPendingCategoryId(null);
      }
    },
    [categories, resetFeedback, setCategoriesSorted],
  );

  const handleDeleteCategory = useCallback(
    async (category: CategoryResource) => {
      const confirmed = window.confirm(
        `Supprimer la catégorie « ${category.name} » ? Cette action est définitive.`,
      );

      if (!confirmed) {
        return;
      }

      setPendingCategoryId(category.id);
      resetFeedback();

      try {
        const response = await fetch(
          `/api/admin/configuration/categories/${category.id}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            payload?.error ?? "Impossible de supprimer la catégorie.",
          );
        }

        setCategoriesSorted(
          categories.filter((item) => item.id !== category.id),
        );
        setFeedback({
          type: "success",
          message: "Catégorie supprimée.",
        });
      } catch (error) {
        console.error("Failed to delete category", error);
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Impossible de supprimer la catégorie.",
        });
      } finally {
        setPendingCategoryId(null);
      }
    },
    [categories, resetFeedback, setCategoriesSorted],
  );

  const renderCategoryActions = useCallback(
    (category: CategoryResource) => {
      const isPending = pendingCategoryId === category.id;

      if (editableCategory?.id === category.id) {
        return (
          <div className="fr-btns-group fr-btns-group--inline-md fr-btns-group--sm fr-btns-group--right">
            <Button
              priority="primary"
              size="small"
              disabled={isPending}
              iconId={isPending ? "fr-icon-refresh-line" : "fr-icon-check-line"}
              onClick={handleSaveEdit}
            >
              Enregistrer
            </Button>
            <Button
              priority="secondary"
              size="small"
              disabled={isPending}
              iconId="fr-icon-close-line"
              onClick={handleCancelEdit}
            >
              Annuler
            </Button>
          </div>
        );
      }

      return (
        <div className="fr-btns-group fr-btns-group--inline-md fr-btns-group--sm fr-btns-group--right">
          <Button
            priority="tertiary"
            size="small"
            iconId="fr-icon-edit-line"
            disabled={isPending}
            onClick={() => handleEditClick(category)}
          >
            Modifier
          </Button>
          <Button
            priority="secondary"
            size="small"
            iconId={category.isActive ? "fr-icon-close-line" : "fr-icon-check-line"}
            disabled={isPending}
            onClick={() => handleToggleActive(category)}
          >
            {category.isActive ? "Désactiver" : "Activer"}
          </Button>
          <Button
            priority="secondary"
            size="small"
            iconId="fr-icon-delete-line"
            disabled={isPending}
            onClick={() => handleDeleteCategory(category)}
          >
            Supprimer
          </Button>
        </div>
      );
    },
    [
      editableCategory,
      handleCancelEdit,
      handleDeleteCategory,
      handleEditClick,
      handleSaveEdit,
      handleToggleActive,
      pendingCategoryId,
    ],
  );

  const renderCategoryRow = useCallback(
    (category: CategoryResource) => {
      const isEditing = editableCategory?.id === category.id;
      const isPending = pendingCategoryId === category.id;

      return (
        <tr key={category.id}>
          <td>
            {isEditing ? (
              <Input
                label="Nom"
                hideLabel
                nativeInputProps={{
                  value: editableCategory?.name ?? "",
                  onChange: (event) =>
                    setEditableCategory((prev) =>
                      prev && prev.id === category.id
                        ? { ...prev, name: event.target.value }
                        : prev,
                    ),
                  disabled: isPending,
                  minLength: 2,
                  maxLength: 120,
                }}
              />
            ) : (
              <span className="fr-text--bold">{category.name}</span>
            )}
            <div className="fr-text--xs fr-text-mention--grey-625 fr-mt-1w">
              Dernière mise à jour :{" "}
              {new Date(category.updatedAt).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </div>
          </td>
          <td>
            {isEditing ? (
              <Input
                label="Description"
                hideLabel
                textArea
                nativeTextAreaProps={{
                  value: editableCategory?.description ?? "",
                  onChange: (event) =>
                    setEditableCategory((prev) =>
                      prev && prev.id === category.id
                        ? { ...prev, description: event.target.value }
                        : prev,
                    ),
                  rows: 3,
                  disabled: isPending,
                  maxLength: 280,
                }}
              />
            ) : category.description ? (
              <p className="fr-mb-0">{category.description}</p>
            ) : (
              <span className="fr-text-mention--grey">
                Aucune description renseignée.
              </span>
            )}
          </td>
          <td>
            {isEditing ? (
              <div className="fr-flow">
                <ColorPickerField
                  id={`category-${category.id}-badge-color`}
                  label="Fond du badge"
                  value={editableCategory?.badgeColor ?? category.badgeColor}
                  onChange={(value) =>
                    setEditableCategory((prev) =>
                      prev && prev.id === category.id
                        ? { ...prev, badgeColor: value }
                        : prev,
                    )
                  }
                  hint="Couleur principale affichée sur la liste et la fiche."
                  disabled={isPending}
                />
                <ColorPickerField
                  id={`category-${category.id}-badge-text-color`}
                  label="Texte du badge"
                  value={
                    editableCategory?.badgeTextColor ?? category.badgeTextColor
                  }
                  onChange={(value) =>
                    setEditableCategory((prev) =>
                      prev && prev.id === category.id
                        ? { ...prev, badgeTextColor: value }
                        : prev,
                    )
                  }
                  hint="Optimisez la lisibilité en choisissant un bon contraste."
                  disabled={isPending}
                />
                <div>
                  <Badge
                    small
                    style={{
                      backgroundColor:
                        editableCategory?.badgeColor ?? category.badgeColor,
                      color:
                        editableCategory?.badgeTextColor ??
                        category.badgeTextColor,
                    }}
                  >
                    Aperçu badge
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="fr-flow">
                <Badge
                  small
                  style={{
                    backgroundColor: category.badgeColor,
                    color: category.badgeTextColor,
                  }}
                >
                  {category.name}
                </Badge>
                <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
                  Fond {category.badgeColor} · Texte {category.badgeTextColor}
                </p>
              </div>
            )}
          </td>
          <td>
            <Badge small severity={category.isActive ? "success" : "warning"}>
              {category.isActive ? "Active" : "Inactive"}
            </Badge>
          </td>
          <td className="fr-text--right">{renderCategoryActions(category)}</td>
        </tr>
      );
    },
    [editableCategory, pendingCategoryId, renderCategoryActions],
  );

  return (
    <div className="fr-flow">
      <header className="fr-flow fr-mb-4w">
        <h1 className="fr-h3 fr-mb-2w">Configuration des catégories</h1>
        <p className="fr-text--sm fr-text-mention--grey">
          Activez, renommez ou supprimez les catégories utilisées par le tunnel
          citoyen pour l’ensemble de la plateforme.
        </p>
        <p className="fr-text--xs fr-text-mention--grey">
          {activeCount} catégorie{activeCount > 1 ? "s" : ""} active
          {activeCount > 1 ? "s" : ""} sur {categoriesCount}.
        </p>
      </header>

      {feedback && (
        <Alert
          severity={feedback.type === "success" ? "success" : "error"}
          title={feedback.type === "success" ? "Succès" : "Erreur"}
          description={feedback.message}
        />
      )}

      <section className="fr-flow fr-mb-6w">
        <h2 className="fr-h5">Catégories existantes</h2>

        {categories.length === 0 ? (
          <p className="fr-text--sm fr-text-mention--grey">
            Aucune catégorie configurée pour le moment.
          </p>
        ) : (
          <div className="fr-table fr-table--layout-fixed">
            <table>
              <thead>
                <tr>
                  <th scope="col">Nom</th>
                  <th scope="col">Description</th>
                  <th scope="col">Badge</th>
                  <th scope="col">Statut</th>
                  <th scope="col" className="fr-text--right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>{categories.map(renderCategoryRow)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="fr-flow">
        <h2 className="fr-h5">Ajouter une catégorie</h2>
        <form className="fr-flow" onSubmit={handleCreateCategory}>
          <Input
            label="Nom de la catégorie"
            disabled={isCreating}
            nativeInputProps={{
              value: createName,
              onChange: (event) => setCreateName(event.target.value),
              required: true,
              minLength: 2,
              maxLength: 120,
            }}
          />
          <Input
            label="Description (optionnel)"
            textArea
            disabled={isCreating}
            nativeTextAreaProps={{
              value: createDescription,
              onChange: (event) => setCreateDescription(event.target.value),
              rows: 3,
              maxLength: 280,
            }}
          />
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-12 fr-col-md-6">
              <ColorPickerField
                id="create-category-badge-color"
                label="Fond du badge"
                value={createBadgeColor}
                onChange={setCreateBadgeColor}
                hint="Couleur principale utilisée sur les badges catégorie."
                disabled={isCreating}
              />
            </div>
            <div className="fr-col-12 fr-col-md-6">
              <ColorPickerField
                id="create-category-badge-text-color"
                label="Texte du badge"
                value={createBadgeTextColor}
                onChange={setCreateBadgeTextColor}
                hint="Choisissez une couleur lisible sur le fond sélectionné."
                disabled={isCreating}
              />
            </div>
          </div>
          <div>
            <Badge
              small
              style={{
                backgroundColor: createBadgeColor,
                color: createBadgeTextColor,
              }}
            >
              Aperçu badge
            </Badge>
          </div>
          <Button
            type="submit"
            priority="primary"
            iconId={isCreating ? "fr-icon-refresh-line" : "fr-icon-add-line"}
            disabled={isCreating}
          >
            {isCreating ? "Création…" : "Ajouter"}
          </Button>
        </form>
      </section>
    </div>
  );
}


