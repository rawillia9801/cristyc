export type RecipeCategory = "Breakfast" | "Dinner" | "Dessert" | "Holiday" | "Southern";

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
  created_at?: string;
};

export type RecipeInput = Omit<Recipe, "id" | "created_at">;

export const categories: RecipeCategory[] = [
  "Breakfast",
  "Dinner",
  "Dessert",
  "Holiday",
  "Southern"
];
