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

const WEBSITE_SYSTEM_PROMPT = `You generate production-ready, renderable English website source files, not templates, wireframes, snippets, or design briefs. Return only valid JSON with siteTitle, framework set to static-html, and files containing index.html, styles.css, script.js, and README.md. index.html must reference styles.css and script.js.

This is a strict acceptance contract. Build one coherent, polished, conversion-ready website from the user's brief. The final index.html MUST contain: a visually rich hero with an actual img/picture/inline SVG or a styled CSS visual panel and at least two distinct clickable CTAs; a credible dashboard or product mockup containing at least three visible panels/cards; a visual workflow timeline with at least three steps; pricing with at least three plan cards, each with a heading and action, plus Choose Plan controls; testimonials with at least two testimonial/review items; an accessible FAQ accordion with at least two questions using buttons with aria-expanded or native details/summary; and working About and Contact anchor sections. Use semantic markup. Section ids, classes, and headings may use clear equivalents such as banner/masthead, company/story, benefits/capabilities, process/how-it-works, plans/packages, reviews/social-proof, questions/help, and get-in-touch/reach-us.

The final styles.css MUST contain a real glassmorphism combination, not a label: translucent rgba() surface colors with alpha, backdrop-filter (and preferably -webkit-backdrop-filter), visible border, layered box-shadow, and a gradient. It MUST include a responsive @media query and an obvious typography hierarchy for body, h1, h2, and supporting text. The final script.js MUST implement FAQ accordion behavior using aria-expanded, smooth-scroll behavior, and Choose Plan behavior that opens a modal/contact flow or follows a real link. The alert( call is forbidden anywhere. Do not return a plain collection of flat sections and buttons, a generic template, lorem ipsum, placeholder blocks, fake checkout claims, invented metrics, fake customer names, fabricated testimonials, unverifiable claims, or secrets. If facts are absent, use neutral English copy such as Custom or Contact sales without losing supplied brief content. Return complete files, not patch instructions.`;

export class WebsiteQualityError extends Error {
  readonly code = "website_quality_failed" as const;
  constructor(public readonly missing: string[]) {
    super(`website_quality_failed: ${missing.join("; ")}`);
    this.name = "WebsiteQualityError";
  }
}

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

const WEBSITE_SECTION_ALIASES: Record<string, string[]> = {
  hero: ["hero", "banner", "masthead", "intro"],
  about: ["about", "company", "story", "mission"],
  features: ["features", "benefits", "capabilities", "solutions"],
  workflow: ["workflow", "process", "how-it-works", "steps", "timeline"],
  pricing: ["pricing", "plans", "packages", "tiers"],
  testimonials: ["testimonials", "reviews", "social-proof", "customer-stories"],
  faq: ["faq", "faqs", "questions", "help"],
  contact: ["contact", "get-in-touch", "reach-us", "demo"]
};

function tokenPattern(values: string[]) {
  return values.map((value) => value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")).join("|");
}

function hasSection(html: string, name: string) {
  const aliases = WEBSITE_SECTION_ALIASES[name] ?? [name];
  const tokens = tokenPattern(aliases);
  return new RegExp(`(?:id|class)=["'][^"']*(?:${tokens})[^"']*["']|<h[1-6][^>]*>[^<]*(?:${tokens})[^<]*<\\/h[1-6]>`, "i").test(html);
}

function extractRegion(html: string, name: string) {
  const tokens = tokenPattern(WEBSITE_SECTION_ALIASES[name] ?? [name]);
  return html.match(new RegExp(`<(?:section|main|article|div)\\b[^>]*(?:id|class)=["'][^"']*(?:${tokens})[^"']*["'][^>]*>[\\s\\S]*?<\\/(?:section|main|article|div)>`, "i"))?.[0] ?? html;
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0;
}

function hasAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

function countPlanCards(html: string) {
  const cardClasses = countMatches(html, /class=["'][^"']*(?:pricing[-_ ]?card|price[-_ ]?card|plan[-_ ]?card|tier[-_ ]?card|package[-_ ]?card)[^"']*["']/gi);
  const semanticCards = countMatches(html, /<(?:article|li)\b[^>]*(?:data-plan|data-tier|data-package)[^>]*>/gi);
  const planHeadings = countMatches(html, /<h[1-6]\b[^>]*>[^<]*(?:starter|growth|scale|basic|pro|enterprise|plan|tier|package)[^<]*<\/h[1-6]>/gi);
  return Math.max(cardClasses, semanticCards, planHeadings);
}

function countFaqQuestions(faq: string) {
  const details = countMatches(faq, /<details\b[\s\S]*?<summary\b/gi);
  const buttons = countMatches(faq, /<button\b[^>]*(?:aria-expanded|aria-controls|faq|accordion)[^>]*>/gi);
  return { details, buttons };
}

export function validateWebsiteQuality(files: WebsiteGeneratedFile[]): WebsiteQualityResult {
  const missing: string[] = [];
  const index = websiteFile(files, "index.html");
  const styles = websiteFile(files, "styles.css");
  const script = websiteFile(files, "script.js");
  const allSource = files.map((file) => file.content).join("\\n");
  for (const path of ["index.html", "styles.css", "script.js", "README.md"]) {
    if (!websiteFile(files, path).trim()) missing.push(`${path}: required non-empty file`);
  }
  if (/(?:lorem\s+ipsum|your\s+brand\s+here|placeholder|coming\s+soon)/i.test(allSource)) missing.push("website source: generic placeholder/template content is forbidden");
  if (/alert\s*\(/i.test(allSource)) missing.push("website source: alert( is forbidden");
  if (index) {
    for (const section of Object.keys(WEBSITE_SECTION_ALIASES)) {
      if (!hasSection(index, section)) missing.push(`index.html: ${section} section id, class, or heading`);
    }
    const hero = extractRegion(index, "hero");
    const hasInlineVisual = /<(?:img\b[^>]*\bsrc=["'][^"']+["']|picture\b[\s\S]*?<img\b|svg\b[\s\S]*?<\/svg>)/i.test(hero);
    const visualClass = /(?:visual|illustration|artwork|hero-media|hero-art|mockup|visual-panel|media-block)/i.test(hero);
    const cssVisualBlock = visualClass && /(?:background(?:-image)?|aspect-ratio|min-height|height)\s*:/i.test(styles) && /(?:visual|illustration|artwork|hero-media|hero-art|mockup|visual-panel|media-block)[^{}]*\{[\s\S]*?(?:background|border|box-shadow|border-radius)\s*:/i.test(styles);
    if (!hasInlineVisual && !cssVisualBlock) missing.push("index.html: hero must contain a real image, picture, inline SVG, or styled CSS visual panel");
    const heroCtaCount = countMatches(hero, /<(?:a|button)\b[^>]*(?:class=["'][^"']*(?:cta|action|btn|button|primary|secondary|hero-link)[^"']*["']|data-(?:cta|action|plan)\b|href=["']#[^"']+["'])[^>]*>/gi);
    if (heroCtaCount < 2) missing.push("index.html: hero must contain at least two clickable CTA elements");
    if (countPlanCards(extractRegion(index, "pricing")) < 3) missing.push("index.html: pricing must contain at least three plan cards with headings and actions");
    if (countMatches(index, /<(?:a|button)\b[^>]*(?:data-plan|data-(?:action|cta))=["'][^"']+["'][^>]*>/gi) < 1 || !/(?:choose|select)\s+plan/i.test(index)) missing.push("index.html: Choose Plan CTA with data-plan or equivalent action");
    if (countMatches(index, /(?:workflow[-_ ]?(?:step|item)|step[-_ ]?card|process[-_ ]?step|timeline[-_ ]?step|data-step|aria-label=["'][^"']*step)/gi) < 3) missing.push("index.html: visual workflow timeline with at least three steps");
    if (countMatches(index, /(?:dashboard|mockup|product|interface|screen|app)[-_ ]?(?:panel|card|tile|widget)/gi) < 3) missing.push("index.html: dashboard/product mockup with at least three panels or cards");
    if (countMatches(index, /(?:testimonial|review|quote|customer[-_ ]?story|social[-_ ]?proof)[-_ ]?(?:card|item|quote)?|class=["'][^"']*(?:testimonial|review|social-proof)[^"']*["']/gi) < 2) missing.push("index.html: at least two testimonial or review items");
    const faq = extractRegion(index, "faq");
    const faqQuestions = countFaqQuestions(faq);
    if (faqQuestions.details + faqQuestions.buttons < 2) missing.push("index.html: FAQ accordion/details with at least two questions");
    if (faqQuestions.buttons > 0 && !/<button\b[^>]*aria-expanded=["'](?:true|false)["']/i.test(faq)) missing.push("index.html: FAQ buttons must expose aria-expanded");
    if (!/href=["'](?:\.\/)?styles\.css(?:#[^"']*)?["']/i.test(index)) missing.push("index.html: styles.css reference");
    if (!/src=["'](?:\.\/)?script\.js(?:#[^"']*)?["']/i.test(index)) missing.push("index.html: script.js reference");
  }
  if (styles) {
    if (!/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:0\.|1?\.?\d+)\s*\)/i.test(styles) || !/(?:-webkit-)?backdrop-filter\s*:/i.test(styles) || !/border\s*:/i.test(styles) || !/box-shadow\s*:/i.test(styles)) missing.push("styles.css: complete glassmorphism requires rgba alpha, backdrop-filter, border, and box-shadow");
    if (!/(?:linear|radial|conic)-gradient\s*\(/i.test(styles)) missing.push("styles.css: gradient styling");
    if (!/@media\s*\(/i.test(styles)) missing.push("styles.css: responsive media query");
    for (const selector of ["body", "h1", "h2"]) if (!new RegExp(`${selector}\\s*\\{`, "i").test(styles)) missing.push(`styles.css: typography hierarchy missing ${selector}`);
  }
  if (script) {
    if (!/(?:faq|accordion)/i.test(script) || !/(?:aria-expanded|classList\.toggle|hidden\s*=)/i.test(script)) missing.push("script.js: FAQ accordion toggle behavior");
    if (!/(?:data-plan|choose\s+plan)/i.test(script) || !/(?:addEventListener|onclick)/i.test(script) || !/(?:modal|dialog|location\.href|scrollIntoView)/i.test(script)) missing.push("script.js: Choose Plan must open a modal or perform a real link action");
    if (!/(?:scrollIntoView|behavior:\s*["']smooth["'])/i.test(script)) missing.push("script.js: smooth scroll behavior");
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

const WEBSITE_REPAIR_GUIDANCE = `Concrete repair patterns: use <section id="banner"> or <section class="masthead"> for hero; pricing-card, price-card, plan-card, tier-card, and package-card are accepted card class forms. Use equivalent semantic section ids/classes/headings; include <picture><img src="..." alt="..."></picture>, a complete inline <svg>...</svg>, or a hero element such as <div class="hero-visual"></div> backed by .hero-visual { min-height: 20rem; background: linear-gradient(...); border-radius: 1rem; }. Use at least three pricing elements such as <article class="plan-card"><h3>...</h3><a data-plan="...">Choose plan</a></article>; three distinct workflow-step/process-step/timeline-step items; three dashboard-panel/mockup-card/product-panel items; two testimonial-item/review-card items; and either two <details><summary>...</summary>...</details> controls or two FAQ buttons with aria-expanded="false". Use CTA links/buttons with href, data-cta, data-action, or data-plan. Keep styles.css glass surfaces concrete with rgba(..., alpha), backdrop-filter, border, box-shadow, gradient, @media, body, h1, and h2 rules. Keep script.js free of alert( and implement FAQ state, a real Choose Plan action, and smooth scrolling. Do not use lorem ipsum, placeholder, your brand here, or coming soon anywhere in any file.`;

export async function generateWebsiteSource(input: WebsiteGenerationInput): Promise<WebsiteGenerationResult> {
  const apiKey = requireProviderEnv("openai");
  const generated = await requestWebsiteSource(apiKey, [
    { role: "system", content: WEBSITE_SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(input) }
  ]);
  let current = generated;
  for (let pass = 1; pass <= 3; pass += 1) {
    const quality = validateWebsiteQuality(current.files);
    if (quality.valid) return current;
    current = await requestWebsiteSource(apiKey, [
      { role: "system", content: `${WEBSITE_SYSTEM_PROMPT}\n\nYou are performing repair pass ${pass} of 3. Return the complete corrected source file set in exactly the same JSON format. Preserve every supported fact and meaningful phrase from the original request and current files. Fix every listed deterministic defect in the exact requirements list; do not merely describe fixes. Do not shorten the site into a template. ${WEBSITE_REPAIR_GUIDANCE}` },
      { role: "user", content: JSON.stringify({ originalRequest: input, exactMissingRequirements: quality.missing, minimumConcretePatterns: WEBSITE_REPAIR_GUIDANCE, currentFiles: current.files, currentSiteTitle: current.siteTitle }) }
    ]);
  }
  const finalQuality = validateWebsiteQuality(current.files);
  if (!finalQuality.valid) throw new WebsiteQualityError(finalQuality.missing);
  return current;
}
