import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Cristy's recipe book is locked." }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const supabase = createSupabaseAdmin();
  const [recipes, notes, shoppingItems, collections, categories] = await Promise.all([
    supabase
      .from("recipes")
      .select("id,title,category,ingredients,instructions,image_url,cook_time,serves,description,is_favorite,collection_id,rating,created_at,updated_at")
      .order("created_at", { ascending: false }),
    supabase.from("recipe_notes").select("id,body,pinned,created_at,updated_at").order("created_at", { ascending: false }).limit(12),
    supabase.from("shopping_items").select("id,label,checked,category,created_at,updated_at").order("created_at", { ascending: false }),
    supabase.from("recipe_collections").select("id,name,description,created_at").order("created_at", { ascending: false }),
    supabase.from("recipe_categories").select("id,name,image_url,icon,sort_order").order("sort_order", { ascending: true })
  ]);

  const firstError = recipes.error ?? notes.error ?? shoppingItems.error ?? collections.error ?? categories.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    recipes: recipes.data ?? [],
    notes: notes.data ?? [],
    shoppingItems: shoppingItems.data ?? [],
    collections: collections.data ?? [],
    categories: categories.data ?? []
  });
}
