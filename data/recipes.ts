export type RecipeCategory = "Breakfast" | "Lunch" | "Dinner" | "Dessert" | "Holiday" | "Southern" | "Soup" | "Lemon";

export type Recipe = {
  id: string;
  title: string;
  category: RecipeCategory;
  cook_time: string;
  serves: string;
  description: string;
  ingredients: string;
  instructions: string;
  image_url: string;
  is_favorite?: boolean;
  collection_id?: string | null;
  rating?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type RecipeInput = Omit<Recipe, "id" | "created_at" | "updated_at">;

export type RecipeCollection = {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
};

export type RecipeNote = {
  id: string;
  body: string;
  pinned: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ShoppingItem = {
  id: string;
  label: string;
  checked: boolean;
  category: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RecipeCategoryMeta = {
  id: string;
  name: RecipeCategory;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
};

export const categories: RecipeCategory[] = ["Breakfast", "Lunch", "Dinner", "Dessert", "Holiday", "Southern", "Soup", "Lemon"];
