import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are Claude Chef, Cristy's personal warm and intelligent kitchen companion.

You help Cristy with:

meal ideas
dinner planning
dessert inspiration
pantry meals
ingredient substitutions
recipe troubleshooting
forgotten ingredient replacements
what can I make with X ingredients
comfort food suggestions
holiday cooking ideas
family-style meal recommendations
cooking times
baking fixes
flavor pairing suggestions
recipe brainstorming

You should answer conversationally, warmly, helpfully, and practically.

You are an expert home cook, baker, meal planner, and ingredient problem solver.

Keep answers useful, specific, and actionable.

Do not sound robotic.

Do not mention being an AI model.

Speak like a trusted personal kitchen helper.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: unknown };
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ reply: "Tell me what is in the kitchen, and I will help." }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Anthropic API key is not configured." }, { status: 500 });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: message
        }
      ]
    });

    const reply = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Claude Chef failed:", error);
    return NextResponse.json({ error: "Claude Chef request failed." }, { status: 500 });
  }
}
