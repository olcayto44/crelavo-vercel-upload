import { optionalEnv, requireProviderEnv } from "./env";
import type { AdBrainResult, AdPerformanceScoreResult, ProductSnapshot } from "./types";

function parseBrainJson(text: string): AdBrainResult {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<AdBrainResult>;
  return {
    productName: String(parsed.productName ?? "Product"),
    offerAngle: String(parsed.offerAngle ?? "Direct response product ad"),
    voiceoverScript: String(parsed.voiceoverScript ?? ""),
    visualScenes: Array.isArray(parsed.visualScenes) ? parsed.visualScenes.map(String).slice(0, 6) : [],
    subtitleLines: Array.isArray(parsed.subtitleLines) ? parsed.subtitleLines.map(String).slice(0, 12) : [],
    cta: String(parsed.cta ?? "Shop now")
  };
}

export async function createAdBrain(input: {
  product: ProductSnapshot;
  campaignGoal: string;
  channels: string;
  targetDurationSeconds: number;
  voiceDirection: string;
  subtitleStyle: string;
  style?: string;
  targetCountry?: string;
  targetCity?: string;
  culture?: string;
}): Promise<AdBrainResult> {
  const apiKey = requireProviderEnv("openai");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: optionalEnv("OPENAI_AD_MODEL") || optionalEnv("OPENAI_ASSISTANT_MODEL") || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an e-commerce direct-response creative strategist. Return only valid JSON with keys productName, offerAngle, voiceoverScript, visualScenes, subtitleLines, cta."
        },
        {
          role: "user",
          content: JSON.stringify({
            formula: "Hook + Problem + Solution + Proof + Offer + CTA",
            product: input.product,
            campaignGoal: input.campaignGoal,
            channels: input.channels,
            targetDurationSeconds: input.targetDurationSeconds,
            voiceDirection: input.voiceDirection,
            subtitleStyle: input.subtitleStyle,
            style: input.style,
            targetCountry: input.targetCountry,
            targetCity: input.targetCity,
            culture: input.culture,
            instruction: "Write a concise social ad voice-over and 4-6 visual scenes. Avoid unsupported medical/legal claims."
          })
        }
      ]
    })
  });

  if (!response.ok) throw new Error(`OpenAI ad brain failed: ${response.status} ${await response.text()}`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI ad brain returned no content.");
  return parseBrainJson(content);
}

function parseAdPerformanceScoreJson(text: string): AdPerformanceScoreResult {
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as Partial<AdPerformanceScoreResult>;
  const score = (value: unknown) => Math.max(0, Math.min(100, Number(value ?? 0) || 0));
  const textValue = (value: unknown, fallback = "") => String(value ?? fallback).trim();
  const section = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const hook = section(parsed.hook);
  const messageClarity = section(parsed.messageClarity);
  const targetAudience = section(parsed.targetAudience);
  const valueProposition = section(parsed.valueProposition);
  const cta = section(parsed.cta);
  const platformFit = section(parsed.platformFit);
  return {
    totalScore: score(parsed.totalScore),
    verdict: textValue(parsed.verdict, "Review required"),
    hook: { score: score(hook.score), analysis: textValue(hook.analysis), rewrite: textValue(hook.rewrite) },
    messageClarity: { score: score(messageClarity.score), analysis: textValue(messageClarity.analysis) },
    targetAudience: { score: score(targetAudience.score), analysis: textValue(targetAudience.analysis), audience: textValue(targetAudience.audience) },
    valueProposition: { score: score(valueProposition.score), analysis: textValue(valueProposition.analysis) },
    cta: { score: score(cta.score), analysis: textValue(cta.analysis), rewrite: textValue(cta.rewrite) },
    platformFit: { score: score(platformFit.score), analysis: textValue(platformFit.analysis), platforms: Array.isArray(platformFit.platforms) ? platformFit.platforms.map(String).slice(0, 8) : [] },
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String).filter(Boolean).slice(0, 10) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String).filter(Boolean).slice(0, 12) : [],
    rewrittenBrief: textValue(parsed.rewrittenBrief),
    rewrittenScript: textValue(parsed.rewrittenScript)
  };
}

export type SocialAgentInput = {
  agentType: "agent_brand_face" | "agent_social_manager" | "agent_live_brand";
  brandName: string;
  product: string;
  industry: string;
  audience: string;
  languageMarket: string;
  tone: string;
  contentPillars: string[];
  platforms: string[];
  postingFrequency: string;
};

export type SocialAgentContent = {
  positioning: string;
  contentPillars: Array<{ name: string; purpose: string; ideas: string[] }>;
  platformPosts: Array<{ platform: string; post: string; caption: string; hook: string; cta: string; hashtags: string[] }>;
  calendar: Array<{ day: string; platform: string; pillar: string; format: string; topic: string; objective: string }>;
  nextSteps: string[];
};

function parseSocialAgentJson(text: string): SocialAgentContent {
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as Partial<SocialAgentContent>;
  const objectArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
  return {
    positioning: String(parsed.positioning ?? "").trim(),
    contentPillars: objectArray(parsed.contentPillars).slice(0, 8).map((item) => ({ name: String(item.name ?? ""), purpose: String(item.purpose ?? ""), ideas: Array.isArray(item.ideas) ? item.ideas.map(String).slice(0, 6) : [] })),
    platformPosts: objectArray(parsed.platformPosts).slice(0, 24).map((item) => ({ platform: String(item.platform ?? ""), post: String(item.post ?? ""), caption: String(item.caption ?? ""), hook: String(item.hook ?? ""), cta: String(item.cta ?? ""), hashtags: Array.isArray(item.hashtags) ? item.hashtags.map(String).slice(0, 12) : [] })),
    calendar: objectArray(parsed.calendar).slice(0, 31).map((item) => ({ day: String(item.day ?? ""), platform: String(item.platform ?? ""), pillar: String(item.pillar ?? ""), format: String(item.format ?? ""), topic: String(item.topic ?? ""), objective: String(item.objective ?? "") })),
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String).filter(Boolean).slice(0, 12) : []
  };
}

export async function generateSocialAgentContent(input: SocialAgentInput): Promise<SocialAgentContent> {
  const apiKey = requireProviderEnv("openai");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: optionalEnv("OPENAI_SOCIAL_AGENT_MODEL") || optionalEnv("OPENAI_ASSISTANT_MODEL") || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are Crelavo's real social content strategist. Return only valid JSON with positioning, contentPillars, platformPosts, calendar, nextSteps. Create specific, publishable content from supplied facts only. platformPosts must include platform, post, caption, hook, cta, hashtags. calendar must include day, platform, pillar, format, topic, objective. Never invent product claims. Write in the requested language/market. This is a content package only: never publish, schedule, call social APIs, or claim approval." },
        { role: "user", content: JSON.stringify(input) }
      ],
      temperature: 0.3
    })
  });
  if (!response.ok) throw new Error(`OpenAI social agent provider failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI social agent provider returned no content.");
  return parseSocialAgentJson(content);
}

export async function scoreAdPerformance(input: {
  adText: string;
  productBrief: string;
  productUrl?: string;
  platform?: string;
  material?: Record<string, unknown>;
}): Promise<AdPerformanceScoreResult> {
  const apiKey = requireProviderEnv("openai");
  const materialUrl = String(input.material?.file_url ?? "").trim();
  const materialKind = String(input.material?.kind ?? "").trim();
  const userContent: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: JSON.stringify({
        adText: input.adText,
        productBrief: input.productBrief,
        productUrl: input.productUrl || null,
        platform: input.platform || "not specified",
        materialMetadata: input.material || null,
        requestedOutput: "Total score, hook, message clarity, target audience, offer/value proposition, CTA, platform fit, risks, actionable improvements and a rewritten ad brief/script."
      })
    }
  ];
  if (materialKind === "image" && /^https?:\/\/\S+$/i.test(materialUrl)) {
    userContent.push({ type: "image_url", image_url: { url: materialUrl, detail: "high" } });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: optionalEnv("OPENAI_AD_SCORE_MODEL") || optionalEnv("OPENAI_AD_MODEL") || optionalEnv("OPENAI_ASSISTANT_MODEL") || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a rigorous direct-response advertising analyst. Return only JSON with totalScore, verdict, hook, messageClarity, targetAudience, valueProposition, cta, platformFit, risks, recommendations, rewrittenBrief, rewrittenScript. Each scored section has score 0-100 and analysis. hook and cta also have rewrite. targetAudience has audience. platformFit has platforms. Score only evidence in the supplied input and visible image when provided; do not invent performance data, ROAS, CTR or conversion results. Flag unsupported medical, financial, legal, absolute or misleading claims. Write in the language of adText when possible. Make rewritten copy specific but do not invent product facts. For video/audio references, assess only the supplied metadata and clearly state that frame/audio content was not inspected."
        },
        { role: "user", content: userContent }
      ]
    })
  });
  if (!response.ok) throw new Error(`OpenAI ad score provider failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI ad score provider returned no content.");
  return parseAdPerformanceScoreJson(content);
}

export type WebsiteGeneratedFile = {
  path: string;
  content: string;
  contentType: "text/html" | "text/css" | "application/javascript" | "application/json" | "text/markdown";
};

export type WebsiteGenerationResult = {
  siteTitle: string;
  framework: "static-html" | "nextjs-starter";
  files: WebsiteGeneratedFile[];
};

export type WebsiteQualityResult = {
  valid: boolean;
  missing: string[];
};

export type WebsiteGenerationInput = {
  brief: string;
  siteType: string;
  brand: string;
  audience: string;
  pages: string[];
  features: string[];
  style: string;
};

const WEBSITE_SYSTEM_PROMPT = `You generate production-ready, renderable website source files, not templates or design briefs. Return only valid JSON with siteTitle, framework set to static-html, and files containing index.html, styles.css, script.js, and README.md. index.html must reference styles.css and script.js.

Apply one coherent premium SaaS design contract to the entire user request and every section: polished dark navy foundation with electric-blue accents unless the user's brief explicitly requests a different theme; true glassmorphism built with translucent surfaces, borders, layered shadows, and CSS backdrop-filter; strong responsive typography, spacing, hierarchy, focus states, and mobile navigation. Build a conversion-ready single-page experience with a premium hero containing two distinct CTAs, a credible CSS/HTML dashboard or product mockup, a visual workflow timeline, feature cards, pricing cards, testimonials, an accessible FAQ accordion, About and Contact anchors, and a working Choose Plan action. Keep the same visual language across all requested content instead of mixing generic section templates.

Use semantic accessible markup and stable section ids: hero, about, features, workflow, pricing, testimonials, faq, contact. The hero must have at least two clickable CTA elements. Pricing must have Choose Plan buttons with data-plan values. FAQ controls must expose aria-expanded and work through script.js. script.js must implement FAQ accordion toggling and CTA actions that navigate, scroll, or open a contact/plan flow without fake checkout claims. Include a responsive @media query, gradients, and backdrop-filter in styles.css. Do not use placeholder blocks, lorem ipsum, fake customer names, invented metrics, fabricated testimonials, unverifiable claims, or unnecessary real-user details. If facts, plan prices, customer quotes, or contact details were not supplied, use clearly labeled neutral interface copy such as Custom or Contact sales rather than inventing data. Keep files text-only, self-contained, and free of secrets. Use the user's requested language.`;

function parseWebsiteJson(text: string): WebsiteGenerationResult {
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim()) as Partial<WebsiteGenerationResult> & Record<string, unknown>;
  const rawFiles = parsed.files ?? parsed.sourceFiles ?? parsed.generatedFiles;
  const files = Array.isArray(rawFiles)
    ? rawFiles
    : rawFiles && typeof rawFiles === "object"
      ? Object.entries(rawFiles as Record<string, unknown>).map(([path, content]) => ({ path, content, contentType: undefined }))
      : [];
  if (!files.length) throw new Error("OpenAI website provider returned no source files.");
  const normalizedFiles = files.slice(0, 30).map((file) => {
    const item = file && typeof file === "object" ? file as Record<string, unknown> : {};
    const path = String(item.path ?? item.filename ?? item.name ?? "").trim();
    const contentType = String(item.contentType ?? (path.endsWith(".html") ? "text/html" : path.endsWith(".css") ? "text/css" : path.endsWith(".js") ? "application/javascript" : path.endsWith(".json") ? "application/json" : path.endsWith(".md") ? "text/markdown" : "text/plain"));
    if (!["text/html", "text/css", "application/javascript", "application/json", "text/markdown"].includes(contentType)) throw new Error("OpenAI website provider returned an unsupported file type.");
    return { path, content: String(item.content ?? item.code ?? item.source ?? ""), contentType: contentType as WebsiteGeneratedFile["contentType"] };
  });
  return { siteTitle: String(parsed.siteTitle ?? "Generated website").trim(), framework: parsed.framework === "nextjs-starter" ? "nextjs-starter" : "static-html", files: normalizedFiles };
}

function websiteFile(files: WebsiteGeneratedFile[], path: string) {
  return files.find((file) => file.path === path)?.content ?? "";
}

function hasSection(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`id=["']${escaped}["']|<h[1-6][^>]*>[^<]*${escaped}[^<]*<\\/h[1-6]>`, "i").test(html);
}

export function validateWebsiteQuality(files: WebsiteGeneratedFile[]): WebsiteQualityResult {
  const missing: string[] = [];
  const index = websiteFile(files, "index.html");
  const styles = websiteFile(files, "styles.css");
  const script = websiteFile(files, "script.js");
  for (const path of ["index.html", "styles.css", "script.js", "README.md"]) {
    if (!websiteFile(files, path).trim()) missing.push(`${path}: required non-empty file`);
  }
  if (index) {
    for (const section of ["hero", "about", "features", "workflow", "pricing", "testimonials", "faq", "contact"]) {
      if (!hasSection(index, section)) missing.push(`index.html: ${section} section id or heading`);
    }
    const ctaCount = (index.match(/<(?:a|button)\b[^>]*(?:class=["'][^"']*(?:cta|btn|button)[^"']*["']|data-(?:cta|action|plan)\b|href=["']#[^"']+["'])[^>]*>/gi) ?? []).length;
    if (ctaCount < 2) missing.push("index.html: at least two clickable CTA elements");
    const planButtons = index.match(/<(?:a|button)\b[^>]*(?:data-plan\b|class=["'][^"']*(?:plan|pricing)[^"']*(?:button|cta|btn)[^"']*["'])[^>]*>/gi) ?? [];
    if (!planButtons.length || !/choose\s+plan/i.test(index)) missing.push("index.html: working Choose Plan button with data-plan");
    if (!/aria-expanded=["'](?:true|false)["']/i.test(index)) missing.push("index.html: accessible FAQ controls with aria-expanded");
    if (!/href=["']styles\.css["']/i.test(index)) missing.push("index.html: styles.css reference");
    if (!/src=["']script\.js["']/i.test(index)) missing.push("index.html: script.js reference");
  }
  if (styles) {
    if (!/(?:-webkit-)?backdrop-filter\s*:/i.test(styles)) missing.push("styles.css: backdrop-filter glassmorphism");
    if (!/(?:linear|radial|conic)-gradient\s*\(/i.test(styles)) missing.push("styles.css: gradient styling");
    if (!/@media\s*\(/i.test(styles)) missing.push("styles.css: responsive media query");
  }
  if (script) {
    if (!/(?:faq|accordion)/i.test(script) || !/(?:aria-expanded|classList\.toggle|hidden\s*=)/i.test(script)) missing.push("script.js: FAQ accordion toggle behavior");
    if (!/(?:data-plan|choose\s+plan|cta)/i.test(script) || !/(?:addEventListener|onclick)/i.test(script)) missing.push("script.js: CTA or Choose Plan action");
  }
  return { valid: missing.length === 0, missing };
}

async function requestWebsiteSource(apiKey: string, messages: Array<{ role: "system" | "user"; content: string }>) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: optionalEnv("OPENAI_WEBSITE_MODEL") || optionalEnv("OPENAI_ASSISTANT_MODEL") || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages,
      temperature: 0.2
    })
  });
  if (!response.ok) throw new Error(`OpenAI website provider failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI website provider returned no content.");
  return parseWebsiteJson(content);
}

export async function generateWebsiteSource(input: WebsiteGenerationInput): Promise<WebsiteGenerationResult> {
  const apiKey = requireProviderEnv("openai");
  const generated = await requestWebsiteSource(apiKey, [
    { role: "system", content: WEBSITE_SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(input) }
  ]);
  const initialQuality = validateWebsiteQuality(generated.files);
  if (initialQuality.valid) return generated;
  const repaired = await requestWebsiteSource(apiKey, [
    { role: "system", content: `${WEBSITE_SYSTEM_PROMPT}\n\nYou are performing one repair pass. Return the complete corrected source file set in exactly the same JSON format. Preserve supported user facts and the requested language. Fix every listed deterministic defect; do not merely describe the fixes.` },
    { role: "user", content: JSON.stringify({ originalRequest: input, missingRequirements: initialQuality.missing, currentGeneration: generated }) }
  ]);
  const repairedQuality = validateWebsiteQuality(repaired.files);
  if (!repairedQuality.valid) throw new Error(`generation_failed: website quality requirements missing after repair: ${repairedQuality.missing.join("; ")}`);
  return repaired;
}
