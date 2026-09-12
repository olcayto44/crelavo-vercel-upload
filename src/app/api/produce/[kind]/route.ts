import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILE_KINDS = [
  "website", "saas", "mobile", "admin",
  "clipping", "tools",
  "campaign", "ad_score", "calendar", "agent", "localization", "cultural",
  "voice", "brand_kit", "document",
] as const;
type Kind = (typeof FILE_KINDS)[number];

const ALIAS: Record<string, Kind> = {
  website: "website", saas: "saas", mobile: "mobile", "mobile-app": "mobile",
  admin: "admin", "admin-panel": "admin", admin_project: "admin",
  clipping: "clipping", "video-clipping": "clipping", video_clipping: "clipping",
  tools: "tools", "video-tools": "tools", video_tools: "tools",
  campaign: "campaign", "ad-score": "ad_score", ad_score: "ad_score", ad_score_checker: "ad_score",
  calendar: "calendar", "campaign-calendar": "calendar",
  agent: "agent", "ai-agent": "agent", ai_agent: "agent",
  localization: "localization", cultural: "cultural", "cultural-localization": "cultural",
  voice: "voice", "voice-clone": "voice", voice_clone: "voice",
  "brand-kit": "brand_kit", brand_kit: "brand_kit",
  document: "document", "document-pack": "document", document_pack: "document",
};

const BLOCK_MINIMAX = new Set([
  "video", "documentary", "animation", "music_video", "drama", "cinematic",
  "anime", "animal", "nature", "space", "drone", "stickman", "studio", "image", "visual_clone",
]);
const BLOCK_HEYGEN = new Set(["talking", "avatar", "lip_sync", "live_sales", "lipsync"]);

function esc(s: string) {
  return String(s || "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}
function norm(raw: string): string {
  return String(raw || "").toLowerCase().replace(/^\//, "").replace(/\s+/g, "_");
}
function titleOf(prompt: string, fallback: string) {
  const t = String(prompt || "").trim().split(/[.!\n]/)[0].replace(/\s+/g, " ").slice(0, 72);
  return t || fallback;
}
function chip(chips: any, key: string, d = "") {
  return String(chips?.[key] || d);
}

function page(title: string, kicker: string, blocks: [string, string][], extra = "") {
  const inner = blocks.map(([h, p]) => `<section><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(title)} · Crelavo</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;font-family:Inter,system-ui,sans-serif;background:#070b18;color:#e8eefc;line-height:1.55}
main{max-width:880px;margin:0 auto;padding:48px 20px 80px}
.k{display:inline-block;color:#7dd3fc;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px}
h1{font-size:34px;letter-spacing:-.03em;margin:0 0 18px}
h2{font-size:18px;margin:28px 0 8px;color:#f8fbff}
p{color:#aeb8cc;margin:0 0 10px}
.card{background:#0b1220;border:1px solid #1e293b;border-radius:16px;padding:22px;margin:18px 0}
a{color:#38bdf8}
pre{white-space:pre-wrap;background:#020617;border-radius:12px;padding:14px;color:#dbeafe;overflow:auto}
</style></head><body><main>
<div class="k">${esc(kicker)}</div><h1>${esc(title)}</h1>
<div class="card">${inner}${extra}</div>
<p>Crelavo package · credits are not deducted until Download.</p>
</main></body></html>`;
}

async function polish(system: string, user: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: "system", content: system + " Reply in English. No markdown fences." },
          { role: "user", content: user.slice(0, 4000) },
        ],
      }),
      signal: ac.signal,
    });
    const j = await r.json();
    return String(j?.choices?.[0]?.message?.content || "").trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function t2a(text: string, wav: boolean) {
  const key = process.env.MINIMAX_API_KEY;
  const group = process.env.MINIMAX_GROUP_ID;
  if (!key) throw new Error("MINIMAX_API_KEY missing");
  const r = await fetch("https://api.minimax.io/v1/t2a_v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(group ? { GroupId: String(group) } : {}),
    },
    body: JSON.stringify({
      model: "speech-2.8-hd",
      text: text.slice(0, 4000),
      stream: false,
      language_boost: "auto",
      output_format: "hex",
      voice_setting: { voice_id: "English_expressive_narrator", speed: 1, vol: 1, pitch: 0 },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: wav ? "wav" : "mp3",
        channel: 1,
      },
    }),
  });
  const j = await r.json();
  const hex = j?.data?.audio;
  if (!hex) throw new Error(j?.base_resp?.status_msg || "no audio");
  return Buffer.from(String(hex), "hex").toString("base64");
}

function icsMonth(title: string, prompt: string) {
  const start = new Date();
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Crelavo//Campaign Calendar//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (let d = 1; d <= 30; d++) {
    if (d % 2 === 0) continue;
    const dt = `${y}${String(m + 1).padStart(2, "0")}${String(d).padStart(2, "0")}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:cal-${dt}@crelavo.com`,
      `DTSTART;VALUE=DATE:${dt}`,
      `SUMMARY:${title} · post`,
      `DESCRIPTION:${prompt.replace(/\r?\n/g, " ").slice(0, 180)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function pack(kind: Kind, prompt: string, chips: any) {
  const title = titleOf(prompt, kind);
  const site = chip(chips, "siteType", kind === "website" ? "landing" : kind);
  const format = chip(chips, "format", "9:16");
  const channel = chip(chips, "channel", "tiktok");
  const brief = prompt || "No brief yet.";

  if (kind === "website" || kind === "saas" || kind === "mobile" || kind === "admin") {
    const label = { website: "Website", saas: "SaaS", mobile: "Mobile App", admin: "Admin Panel" }[kind];
    return {
      filename: `crelavo-${kind}.html`,
      mime: "text/html",
      html: page(`${label}: ${title}`, `${label} · ${site}`, [
        ["Brief", brief],
        ["Scope", `Type ${site}. Extra pages and admin are credit extras, not deducted yet.`],
        ["IA", kind === "admin"
          ? "Orders table, status chips, roles, export, empty states."
          : kind === "mobile"
            ? "Today screen, product grid, cart, account. Expo-ready folder notes in README."
            : kind === "saas"
              ? "Sidebar, metrics, filters, trial CTA, billing stub."
              : "Hero, proof, product, FAQ, contact, checkout CTA."],
        ["README", "Open this HTML in a browser. Replace copy, colors, and links. Host on any static host."],
      ], `<pre>npm i\n# static preview only\nopen index.html</pre>`),
    };
  }

  if (kind === "campaign") {
    return {
      filename: "crelavo-campaign.html",
      mime: "text/html",
      html: page(`Campaign: ${title}`, `${channel} · ${format}`, [
        ["Hook", `Stop the scroll in 2s. ${brief}`],
        ["Proof", "Show the product working. One concrete outcome. No vague claims."],
        ["CTA", channel === "email" ? "Reply or tap the product link." : "Tap the product link / shop now."],
        ["Captions", `Primary caption for ${channel}. Keep the offer in the first line.`],
        ["Delivery", "ZIP-style pack as one HTML file. Credits lock on Download."],
      ]),
    };
  }

  if (kind === "ad_score") {
    const detail = chip(chips, "report", "basic") === "detail";
    const hook = /hook|wait|stop|you/i.test(brief) ? 22 : 14;
    const cta = /shop|buy|link|now|get/i.test(brief) ? 20 : 11;
    const proof = /result|before|after|demo|review/i.test(brief) ? 18 : 10;
    const clarity = Math.min(20, 8 + Math.round(brief.length / 40));
    const total = Math.min(100, hook + cta + proof + clarity + 10);
    return {
      filename: "crelavo-ad-score.html",
      mime: "text/html",
      html: page(`Ad score ${total}/100`, detail ? "Detailed report" : "Basic score", [
        ["Total", `${total} / 100 · not a live ROAS claim.`],
        ["Hook", `${hook}/25`],
        ["CTA", `${cta}/25`],
        ["Proof", `${proof}/25`],
        ["Clarity", `${clarity}/25`],
        ["Fix next", "Put the offer in the first line, show the product by second 3, end on one CTA."],
        ["Brief", brief],
      ]),
    };
  }

  if (kind === "calendar") {
    const span = chip(chips, "span", "month");
    const ics = icsMonth(title, brief);
    const href = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
    return {
      filename: "crelavo-calendar.html",
      mime: "text/html",
      html: page(`Calendar: ${title}`, span === "season" ? "Season plan" : "30-day plan", [
        ["Cadence", "Three posts a week. Hook / proof / offer rotation."],
        ["Peaks", "Launch day, social proof day, offer day."],
        ["Brief", brief],
      ], `<p><a href="${href}" download="crelavo-calendar.ics">Download ICS</a></p><pre>${esc(ics)}</pre>`),
    };
  }

  if (kind === "agent") {
    const agent = chip(chips, "agent", "influencer");
    const json = JSON.stringify({
      agent,
      system: agent === "social"
        ? "You queue posts, keep brand tone, and draft replies. Never invent discounts."
        : "You draft influencer outreach. Brand-safe, short, no fake stats.",
      brief,
    }, null, 2);
    return {
      filename: "crelavo-agent.html",
      mime: "text/html",
      html: page(`Agent: ${agent}`, "Playbook JSON", [
        ["Role", agent],
        ["Guardrails", "No fake social proof. No off-platform checkout. Stay on the brief."],
        ["Brief", brief],
      ], `<pre>${esc(json)}</pre>`),
    };
  }

  if (kind === "localization" || kind === "cultural") {
    const cultural = kind === "cultural";
    return {
      filename: `crelavo-${kind}.html`,
      mime: "text/html",
      html: page(cultural ? `Cultural adapt: ${title}` : `Global pack: ${title}`, channel || "ig", [
        ["Source", brief],
        ["EN", "Keep the CTA. Keep the offer. Shorten the hook."],
        ["DE", "Direct, specific, no slang. Formal you unless the brand is casual."],
        ["TR", "Warm, concrete benefit first. CTA in Turkish."],
        cultural
          ? ["Markets", "JP: quieter color, trust marks, no aggressive urgency. MENA: respectful tone, no alcohol/pork cues. US: speed + proof."]
          : ["Captions", "One caption per market. Do not machine-translate idioms."],
      ]),
    };
  }

  if (kind === "clipping" || kind === "tools") {
    return {
      filename: `crelavo-${kind}.html`,
      mime: "text/html",
      html: page(kind === "tools" ? `Video tools: ${title}` : `Clipping EDL: ${title}`, format || "9:16", [
        ["Input", chip(chips, "input", "clip") === "clip" ? "Use the attached clip. Server does not re-encode in this path." : brief],
        ["Cut 1", "0.0–1.5s hook face / product."],
        ["Cut 2", "1.5–5s proof beat."],
        ["Cut 3", "Last 2s CTA hold."],
        ["Tools", kind === "tools" ? "Reframe to selected format, stabilize, trim dead air, color match." : "Export 3 hooks from this EDL."],
      ]),
    };
  }

  if (kind === "brand_kit") {
    return {
      filename: "crelavo-brand-kit.html",
      mime: "text/html",
      html: page(`Brand kit: ${title}`, chip(chips, "pack", "full"), [
        ["Mark", "Geometric C mark, navy #070b18, cyan #0ea5e9, paper #f8fbff."],
        ["Type", "Inter for UI. One display serif optional for posters."],
        ["Voice", "Calm, specific, no slogans."],
        ["Brief", brief],
      ], `<svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true"><rect width="72" height="72" rx="16" fill="#0ea5e9"/><path d="M22 36c0-8 6-14 14-14h8v8h-8c-3 0-6 3-6 6s3 6 6 6h8v8h-8c-8 0-14-6-14-14z" fill="#070b18"/></svg>`),
    };
  }

  if (kind === "document") {
    const k = chip(chips, "kind", "pitch");
    return {
      filename: "crelavo-document.html",
      mime: "text/html",
      html: page(`Document: ${k}`, k, [
        ["1 Problem", brief],
        ["2 Product", title],
        ["3 Why now", "Distribution + production in one path."],
        ["4 How it works", "Brief → package → download locks credits."],
        ["5 Traction", "Replace with real numbers. Do not invent."],
        ["6 Ask", k === "proposal" ? "Scope, timeline, pricing table." : "The raise / next step."],
      ]),
    };
  }

  return {
    filename: "crelavo.html",
    mime: "text/html",
    html: page(title, kind, [["Brief", brief]]),
  };
}

async function paramsKind(ctx: { params: { kind: string } | Promise<{ kind: string }> }) {
  const p = await Promise.resolve(ctx.params);
  return norm(p?.kind || "");
}

export async function GET(_req: Request, ctx: { params: { kind: string } | Promise<{ kind: string }> }) {
  const raw = await paramsKind(ctx);
  const kind = ALIAS[raw];
  return NextResponse.json({
    ok: true,
    provider: "crelavo-produce",
    kind: kind || raw,
    kinds: FILE_KINDS,
    note: "POST {prompt, chips, type, session, user_id}. Credits are not deducted here. MiniMax H3 and HeyGen are not called.",
  });
}

export async function POST(req: Request, ctx: { params: { kind: string } | Promise<{ kind: string }> }) {
  const raw = await paramsKind(ctx);
  if (BLOCK_MINIMAX.has(raw)) {
    return NextResponse.json({ error: "use_minimax", kind: raw }, { status: 400 });
  }
  if (BLOCK_HEYGEN.has(raw)) {
    return NextResponse.json({ error: "use_heygen", kind: raw }, { status: 400 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const fromBody = norm(body.type || body.kind || "");
  const kind = ALIAS[raw] || ALIAS[fromBody];
  if (!kind) {
    return NextResponse.json({ error: "unknown_kind", kind: raw || fromBody, kinds: FILE_KINDS }, { status: 400 });
  }

  const prompt = String(body.prompt || body.text || "").trim();
  const chips = body.chips && typeof body.chips === "object" ? body.chips : {};

  if (kind === "voice") {
    const wav = Array.isArray(chips.delivery) && chips.delivery.indexOf("wav") >= 0;
    const script = prompt || "Welcome to Crelavo. This is a short voice sample.";
    try {
      const b64 = await t2a(script, wav);
      return NextResponse.json({
        kind,
        mime: wav ? "audio/wav" : "audio/mpeg",
        filename: wav ? "crelavo-voice.wav" : "crelavo-voice.mp3",
        file_base64: b64,
        provider: "minimax-speech-2.8-hd",
      });
    } catch (e: any) {
      return NextResponse.json({
        kind,
        error: "voice_failed",
        message: String(e?.message || e),
        html: page("Voice unavailable", "Narration", [
          ["Brief", script],
          ["Note", "Speech API did not return audio. MiniMax video was not called."],
        ]),
        filename: "crelavo-voice.html",
        mime: "text/html",
      });
    }
  }

  const built = pack(kind, prompt, chips);
  const note = await polish(
    `You refine copy for a ${kind} package. Keep facts. Do not invent metrics. 80-140 words.`,
    prompt,
  );
  let html = built.html;
  if (note) {
    html = html.replace("</h1>", `</h1><p>${esc(note)}</p>`);
  }

  return NextResponse.json({
    kind,
    title: titleOf(prompt, kind),
    mime: built.mime,
    filename: built.filename,
    html,
    preview_url: null,
    provider: "crelavo-produce",
  });
}
