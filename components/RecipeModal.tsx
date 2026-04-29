"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { categories, type Recipe, type RecipeCategory, type RecipeInput } from "@/data/recipes";

type RecipeModalProps = {
  mode: "add" | "edit" | "view";
  recipe: Recipe | null;
  onClose: () => void;
  onSave: (recipe: Recipe | RecipeInput) => void;
};

const emptyRecipe: RecipeInput = {
  title: "",
  category: "Breakfast",
  cook_time: "",
  serves: "",
  description: "",
  ingredients: "",
  instructions: "",
  image_url: ""
};

export function RecipeModal({ mode, recipe, onClose, onSave }: RecipeModalProps) {
  const [draft, setDraft] = useState<Recipe | RecipeInput>(recipe ?? emptyRecipe);
  const isView = mode === "view";

  useEffect(() => {
    setDraft(recipe ?? emptyRecipe);
  }, [recipe]);

  function update<K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isView) {
      onClose();
      return;
    }

    const fallbackImage =
      "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=900&q=85";

    onSave({
      ...draft,
      image_url: draft.image_url || fallbackImage
    });
  }

  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true">
      <form className="recipeModal" onSubmit={submit}>
        <div className="modalHeader">
          <div>
            <span className="modalKicker">{mode === "add" ? "New family favorite" : mode === "edit" ? "Recipe notes" : draft.category}</span>
            <h2>{mode === "add" ? "Add New Recipe" : mode === "edit" ? "Edit Recipe" : draft.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {isView ? (
          <div className="detailView">
            <img src={draft.image_url} alt="" />
            <div className="detailMeta">
              <span>{draft.cook_time}</span>
              <span>{draft.serves}</span>
            </div>
            <p>{draft.description}</p>
            <h3>Ingredients</h3>
            <pre>{draft.ingredients}</pre>
            <h3>Instructions</h3>
            <pre>{draft.instructions}</pre>
          </div>
        ) : (
          <div className="formGrid">
            <label>
              Recipe Title
              <input value={draft.title} onChange={(event) => update("title", event.target.value)} required />
            </label>
            <label>
              Category
              <select value={draft.category} onChange={(event) => update("category", event.target.value as RecipeCategory)}>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Time
              <input value={draft.cook_time} onChange={(event) => update("cook_time", event.target.value)} placeholder="30 min" required />
            </label>
            <label>
              Serves
              <input value={draft.serves} onChange={(event) => update("serves", event.target.value)} placeholder="Serves 4" required />
            </label>
            <label className="spanTwo">
              Image URL
              <input value={draft.image_url} onChange={(event) => update("image_url", event.target.value)} placeholder="https://..." />
            </label>
            <label className="spanTwo">
              Short Description
              <textarea value={draft.description} onChange={(event) => update("description", event.target.value)} required />
            </label>
            <label>
              Ingredients
              <textarea value={draft.ingredients} onChange={(event) => update("ingredients", event.target.value)} required />
            </label>
            <label>
              Instructions
              <textarea value={draft.instructions} onChange={(event) => update("instructions", event.target.value)} required />
            </label>
          </div>
        )}

        <div className="modalActions">
          <button type="button" className="modalCancel" onClick={onClose}>
            {isView ? "Close" : "Cancel"}
          </button>
          {!isView && <button className="modalSave">{mode === "add" ? "Add Recipe" : "Save Changes"}</button>}
        </div>
      </form>
    </div>
  );
}
