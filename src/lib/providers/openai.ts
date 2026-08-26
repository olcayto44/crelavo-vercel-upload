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
