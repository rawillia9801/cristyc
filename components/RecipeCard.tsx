"use client";

import { Clock, Eye, Heart, Pencil, Trash2, Users } from "lucide-react";
import type { Recipe } from "@/data/recipes";

type RecipeCardProps = {
  recipe: Recipe;
  onView: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
};

const categoryClass: Record<Recipe["category"], string> = {
  Breakfast: "badgeBreakfast",
  Dinner: "badgeDinner",
  Dessert: "badgeDessert",
  Holiday: "badgeHoliday",
  Southern: "badgeSouthern"
};

export function RecipeCard({ recipe, onView, onEdit, onDelete }: RecipeCardProps) {
  return (
    <article className="recipeCard">
      <button className="imageButton" onClick={() => onView(recipe)} aria-label={`View ${recipe.title}`}>
        <img className="recipeImage" src={recipe.image_url} alt="" />
      </button>
      <span className={`categoryBadge ${categoryClass[recipe.category]}`}>{recipe.category}</span>
      <button className="heartButton" aria-label="Favorite recipe">
        <Heart size={18} fill="#fef8ec" strokeWidth={2.4} />
      </button>

      <div className="recipeContent">
        <button className="titleButton" onClick={() => onView(recipe)}>
          <h3>{recipe.title}</h3>
        </button>
        <div className="recipeMeta">
          <span>
            <Clock size={13} />
            {recipe.cook_time}
          </span>
          <span>
            <Users size={13} />
            {recipe.serves}
          </span>
        </div>
        <p>{recipe.description}</p>
        <div className="cardActions">
          <button className="viewBtn" onClick={() => onView(recipe)}>
            <Eye size={13} />
            View
          </button>
          <button className="editBtn" onClick={() => onEdit(recipe)}>
            <Pencil size={13} />
            Edit
          </button>
          <button className="deleteBtn" onClick={() => onDelete(recipe.id)}>
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
