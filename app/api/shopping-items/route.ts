import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Cristy's recipe book is locked." }, { status: 401 });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const body = (await request.json()) as { label?: unknown; category?: unknown };
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : null;

  if (!label) {
    return NextResponse.json({ error: "Shopping item is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("shopping_items").insert({ label, category, checked: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const body = (await request.json()) as { id?: unknown; checked?: unknown };
  const id = typeof body.id === "string" ? body.id : "";
  const checked = typeof body.checked === "boolean" ? body.checked : null;

  if (!id || checked === null) {
    return NextResponse.json({ error: "Shopping item id and checked state are required." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("shopping_items").update({ checked }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const id = new URL(request.url).searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Shopping item id is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("shopping_items").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
