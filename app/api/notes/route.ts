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

  const body = (await request.json()) as { body?: unknown };
  const noteBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!noteBody) {
    return NextResponse.json({ error: "Note text is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("recipe_notes").insert({ body: noteBody, pinned: false });

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
    return NextResponse.json({ error: "Note id is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("recipe_notes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
