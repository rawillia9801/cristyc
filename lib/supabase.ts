import { createClient } from "@supabase/supabase-js";
import type { Recipe, RecipeCategoryMeta, RecipeCollection, RecipeNote, ShoppingItem } from "@/data/recipes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export type Database = {
  public: {
    Tables: {
      recipes: {
        Row: Recipe;
        Insert: Omit<Recipe, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Recipe, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      recipe_collections: {
        Row: RecipeCollection;
        Insert: Omit<RecipeCollection, "id" | "created_at">;
        Update: Partial<Omit<RecipeCollection, "id" | "created_at">>;
        Relationships: [];
      };
      recipe_notes: {
        Row: RecipeNote;
        Insert: Omit<RecipeNote, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<RecipeNote, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      shopping_items: {
        Row: ShoppingItem;
        Insert: Omit<ShoppingItem, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ShoppingItem, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      recipe_categories: {
        Row: RecipeCategoryMeta;
        Insert: Omit<RecipeCategoryMeta, "id">;
        Update: Partial<Omit<RecipeCategoryMeta, "id">>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
