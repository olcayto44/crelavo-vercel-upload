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
