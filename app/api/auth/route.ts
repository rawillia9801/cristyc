import { NextResponse } from "next/server";
import { createSessionToken, isValidPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";

  if (!process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "APP_PASSWORD is not configured." }, { status: 500 });
  }

  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "That password did not open the recipe book." }, { status: 401 });
  }

  return NextResponse.json({ token: createSessionToken() });
}
