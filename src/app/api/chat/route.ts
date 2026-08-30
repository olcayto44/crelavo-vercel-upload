import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { hasValidProductionDispatch } from "@/lib/production-dispatch-gate";

export const runtime = "edge";

type LegacyChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

function appBaseUrl(request: Request) {
  const origin = request.headers.get("origin") || request.headers.get("x-forwarded-host");
  if (origin?.startsWith("http")) return origin.replace(/\/$/, "");
  if (origin) return `https://${origin.replace(/\/$/, "")}`;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function forwardHeaders(request: Request) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const authorization = request.headers.get("authorization");
  const cookie = request.headers.get("cookie");
  if (authorization) headers.Authorization = authorization;
  if (cookie) headers.Cookie = cookie;
  return headers;
}

async function postInternal(request: Request, path: string, payload: Record<string, unknown>) {
  const response = await fetch(`${appBaseUrl(request)}${path}`, {
    method: "POST",
    headers: forwardHeaders(request),
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { status: "error", httpStatus: response.status, message: String(data.error ?? data.message ?? "Crelavo API failed."), data };
  return { status: "success", ...data };
}

async function getInternal(request: Request, path: string) {
  const response = await fetch(`${appBaseUrl(request)}${path}`, {
    method: "GET",
    headers: forwardHeaders(request)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { status: "error", httpStatus: response.status, message: String(data.error ?? data.message ?? "Crelavo API failed."), data };
  return { status: "success", ...data };
}

function inferPackageId(type: string, prompt: string) {
  const text = prompt.toLowerCase();
  if (type === "website" && /ecommerce|e-commerce|store|shop|product|checkout|cart|e-ticaret|sepet|ürün|urun/.test(text)) return "website_ecommerce_admin";
  if (type === "website") return "website_business";
  if (type === "saas") return "saas_admin_billing";
  if (type === "mobile_app") return "mobile_expo";
  if (type === "admin_project") return "admin_dashboard";
  if (type === "campaign") return "campaign_product_ad_video";
  if (type === "document_pack") return "seo_growth_pack";
  return "video_premium";
}

export async function POST(req: Request) {
  try {
  const body = await req.json().catch(() => ({}));
  const rawMessages = (body.messages ?? []) as Array<UIMessage | LegacyChatMessage>;
  const messages = rawMessages.length && "parts" in rawMessages[0]
    ? await convertToModelMessages(rawMessages as UIMessage[])
    : (rawMessages as LegacyChatMessage[]).map((message) => ({ role: message.role === "tool" ? "assistant" : message.role, content: String(message.content ?? "") }));
  const userId = String(body.user_id ?? body.userId ?? "");
  const userEmail = String(body.user_email ?? body.userEmail ?? "");
  const lastRaw = rawMessages[rawMessages.length - 1] as UIMessage | LegacyChatMessage | undefined;
  const lastMessage = "parts" in (lastRaw ?? {})
    ? JSON.stringify((lastRaw as UIMessage).parts ?? "")
    : String((lastRaw as LegacyChatMessage | undefined)?.content ?? body.prompt ?? "");
  const lower = lastMessage.toLowerCase();
  const isCodeOrDesign = /site|web|app|uygulama|mobil|saas|admin|ecommerce|e-commerce|store|shop|checkout/.test(lower);
  const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasGoogleKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY);
  const canDispatchProduction = hasValidProductionDispatch(body as Record<string, unknown>);

  if (!hasAnthropicKey && !hasGoogleKey) {
    const providerStatus = await getInternal(req, "/api/providers/readiness");
    return Response.json({
      status: "success",
      mode: "crelavo_api_fallback",
      message: "Crelavo internal APIs are connected. Add ANTHROPIC_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY to enable AI SDK model routing.",
      connectedApis: ["/api/assistant/plan", "/api/productions", "/api/automation/start", "/api/providers/readiness", "/api/productions/[id]/delivery"],
      providerStatus
    });
  }

  const selectedModel = isCodeOrDesign && hasAnthropicKey ? anthropic("claude-3-5-sonnet-latest") : google("gemini-1.5-flash");

  const result = await streamText({
    model: selectedModel,
    messages,
    temperature: 0,
    system: `Crelavo's chat and planning assistant must keep normal conversation, setup answers, raw parameters, and plan revisions in chat/plan processing. Do not call production tools for those messages. Only use production tools when the request carries an explicit confirmed Start Production, Generate Video, or Generate Image action; otherwise answer or prepare the plan without creating a production or starting a provider.
Never invent an external endpoint or provider. Use only the existing Crelavo APIs and configured chat providers. If required planning information is missing, ask one short question. Never claim production started unless a production tool returned success.`,
    tools: {
      crelavoPlanla: tool({
        description: "Kullanıcının isteğini Crelavo üretim planına çevirir.",
        inputSchema: z.object({
          message: z.string(),
          userId: z.string().optional()
        }),
        execute: async ({ message, userId: toolUserId }) => postInternal(req, "/api/assistant/plan", { message, user_id: toolUserId || userId })
      }),
      crelavoProductionOlustur: tool({
        description: "Crelavo /api/productions üzerinden gerçek production kaydı oluşturur.",
        inputSchema: z.object({
          title: z.string(),
          prompt: z.string(),
          productionType: z.enum(["website", "saas", "mobile_app", "admin_project", "video", "campaign", "image", "document_pack", "voice_clone"]),
          packageId: z.string().optional(),
          selectedOptions: z.array(z.string()).default([])
        }),
        execute: async ({ title, prompt, productionType, packageId, selectedOptions }) => {
          const finalPackageId = packageId || inferPackageId(productionType, prompt);
          return postInternal(req, "/api/productions", {
            user_id: userId,
            user_email: userEmail,
            title,
            prompt,
            production_type: productionType,
            package_id: finalPackageId,
            quality: "premium",
            selected_quality: "premium",
            output_duration_seconds: ["website", "saas", "mobile_app", "admin_project"].includes(productionType) ? 0 : 30,
            features: selectedOptions.join(", "),
            project_details: selectedOptions.join("\n"),
            delivery_level: ["website", "saas", "mobile_app", "admin_project"].includes(productionType) ? "working_source_package" : "production_package",
            delivery_requirements: { requested: true, status: "pending", formats: ["website", "saas", "mobile_app", "admin_project"].includes(productionType) ? ["source_code", "readme", "dashboard_delivery"] : ["final_mp4", "dashboard_delivery"] },
            request_metadata: { source: "ai_sdk_chat_route", productionCards: selectedOptions, selectedOptions },
            input_json: { source: "ai_sdk_chat_route", work_prompt: prompt, productionCards: selectedOptions, selectedOptions },
            legal_acceptance: true,
            dispatch_action: canDispatchProduction ? body.dispatch_action : undefined,
            confirmation: canDispatchProduction ? body.confirmation : undefined
          });
        }
      }),
      crelavoUretimiBaslat: tool({
        description: "Mevcut production ID için /api/automation/start çağırır.",
        inputSchema: z.object({
          productionId: z.string(),
          userId: z.string().optional(),
          forceStart: z.boolean().default(true)
        }),
        execute: async ({ productionId, userId: toolUserId, forceStart }) => postInternal(req, "/api/automation/start", { production_id: productionId, user_id: toolUserId || userId, legal_acceptance: true, force_start: forceStart, dispatch_action: canDispatchProduction ? body.dispatch_action : undefined, confirmation: canDispatchProduction ? body.confirmation : undefined })
      }),
      crelavoProviderDurumu: tool({
        description: "Crelavo provider/API readiness durumunu getirir.",
        inputSchema: z.object({}),
        execute: async () => getInternal(req, "/api/providers/readiness")
      }),
      crelavoTeslimLinkleri: tool({
        description: "Production için dashboard delivery linklerini döndürür.",
        inputSchema: z.object({ productionId: z.string() }),
        execute: async ({ productionId }) => ({
          status: "success",
          productionId,
          previewUrl: `/api/productions/${productionId}/delivery?file=preview`,
          manifestUrl: `/api/productions/${productionId}/delivery?file=manifest`,
          sourceUrl: `/api/productions/${productionId}/delivery?file=source`,
          readmeUrl: `/api/productions/${productionId}/delivery?file=readme`,
          downloadUrl: `/api/productions/${productionId}/delivery?file=zip`,
          dashboardUrl: `/dashboard/productions/${productionId}`
        })
      })
    }
  });

  return result.toUIMessageStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat request could not be completed.";
    return Response.json({ error: message, code: "chat_request_failed" }, { status: 502 });
  }
}
