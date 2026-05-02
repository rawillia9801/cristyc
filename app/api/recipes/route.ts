import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { type Recipe, type RecipeInput } from "@/data/recipes";

export const runtime = "nodejs";

const recipeFields =
  "id,title,category,ingredients,instructions,image_url,cook_time,serves,description,is_favorite,collection_id,rating,created_at,updated_at";

function unauthorized() {
  return NextResponse.json({ error: "Cristy's recipe book is locked." }, { status: 401 });
}

function toRecipeInput(body: Partial<Recipe>): RecipeInput {
  return {
    title: body.title ?? "",
    category: body.category ?? "Breakfast",
    ingredients: body.ingredients ?? "",
    instructions: body.instructions ?? "",
    image_url:
      body.image_url ||
      "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=900&q=85",
    cook_time: body.cook_time ?? "",
    serves: body.serves ?? "",
    description: body.description ?? "",
    is_favorite: body.is_favorite ?? false,
    collection_id: body.collection_id ?? null,
    rating: body.rating ?? null
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("recipes").select(recipeFields).order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recipes: data ?? [] });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const body = (await request.json()) as Partial<Recipe>;
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("recipes").insert(toRecipeInput(body));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const body = (await request.json()) as Partial<Recipe>;
  if (!body.id) {
    return NextResponse.json({ error: "Recipe id is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("recipes").update(toRecipeInput(body)).eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Recipe id is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("recipes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
