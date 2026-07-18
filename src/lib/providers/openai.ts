import { requireEnv } from "./env";
import type { AdBrainResult, ProductSnapshot } from "./types";

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
  const apiKey = requireEnv("OPENAI_API_KEY");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_AD_MODEL || "gpt-4o-mini",
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
