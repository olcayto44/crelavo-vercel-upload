import { NextRequest, NextResponse } from "next/server";
import { clientIpFromRequest, rateLimit, rateLimitResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status: number) => NextResponse.json(
  { ok: false, spend: false, error }, { status, headers: noStore }
);
type ChatMessage = { role: "user" | "assistant"; content: string };
const historyFrom = (value: unknown): ChatMessage[] => {
  if (!Array.isArray(value)) return [];
  return value.slice(-12).flatMap((item): ChatMessage[] => {
    if (!item || typeof item !== "object") return [];
    const role = (item as Record<string,unknown>).role;
    const content = (item as Record<string,unknown>).content;
    if ((role !== "assistant" && role !== "user") || typeof content !== "string" || content.length > 4000) return [];
    return [{ role, content }];
  });
};

/** Real, bounded developer conversation strictly for Vercel *preview* environments.
 * No image/video rendering, code execution, repository access, file upload or credit mutation.
 * Production and signed-in conversation flows are separate.
 */
export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") return fail("preview_only", 404);
  if (req.headers.get("origin") !== new URL(req.url).origin) return fail("same_origin_required", 403);
  if (!(req.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) return fail("json_required", 415);
  if (Number(req.headers.get("content-length") || 0) > 25000) return fail("request_too_large", 413);
  const limit = rateLimit({ key: "studio-preview-expert:" + clientIpFromRequest(req), limit: 8, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);
  const data: unknown = await req.json().catch(() => null);
  if (!data || typeof data !== "object" || Array.isArray(data)) return fail("invalid_body", 400);
  const body = data as Record<string,unknown>;
  if (JSON.stringify(body).length > 24000) return fail("request_too_large", 413);
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const category = typeof body.category === "string" && /^[a-z0-9_]{1,48}$/.test(body.category) ? body.category : "general";
  const lang = ["en","tr","de","es","fr","ar"].includes(String(body.language)) ? String(body.language) : "en";
  if (!prompt || prompt.length > 4000) return fail("invalid_prompt", 400);
  if (!process.env.OPENAI_API_KEY) return fail("assistant_not_configured", 503);
  const messages = historyFrom(body.messages);
  const instructions = [
    "You are Crelavo Studio's knowledgeable, practical AI software developer and production assistant.",
    "Understand the actual user request and answer it directly, including greetings, coding questions, debugging, architecture, product planning, and creative production work.",
    "You have expertise across modern web apps, Next.js, React, TypeScript, PostgreSQL/Supabase, auth/RLS, Vercel, APIs, AI image/video pipelines, FFmpeg, media editing, pricing and product delivery.",
    "Write usable code and concrete plans when requested. Keep context from previous messages and the selected category. Ask clarifications only if truly necessary.",
    "Do not pretend to have read the user's repository, run commands, browsed websites, deployed code, produced media, or inspected account data. You have no external tools in this preview chat.",
    "Distinguish suggestions from changes actually carried out. Never claim that an unavailable action, integration, model or production feature works.",
    "The conversation is non-billable inside Crelavo's credit system; no credits are deducted and no media generation is triggered.",
    "Answer in the user's language. The preferred interface language is " + lang + ".",
    "Current Studio category: " + category + "."
  ].join(" ");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{ Authorization:"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json" },
      body:JSON.stringify({
        model:process.env.OPENAI_ASSISTANT_MODEL || "gpt-4o-mini",
        temperature:0.35,
        max_tokens:1600,
        messages:[{role:"system",content:instructions},...messages,{role:"user",content:prompt}]
      }),
      signal:controller.signal
    });
    if (!response.ok) return fail("assistant_provider_unavailable", 503);
    const output: unknown = await response.json();
    const result = output && typeof output === "object" ? output as Record<string,unknown> : {};
    const choices = Array.isArray(result.choices) ? result.choices : [];
    const first = choices[0] as { message?: { content?: unknown } } | undefined;
    const reply = typeof first?.message?.content === "string" ? first.message.content.trim() : "";
    if (!reply) return fail("assistant_empty_reply", 503);
    return NextResponse.json({ ok:true, reply:reply.slice(0,9000), spend:false, mode:"preview_real_ai" }, { headers:noStore });
  } catch {
    return fail("assistant_request_failed", 503);
  } finally {
    clearTimeout(timeout);
  }
}
