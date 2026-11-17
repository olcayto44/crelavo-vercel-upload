import { resolveWorkspaceCategory } from "@/lib/assistant-work/workspace-chat";
import { handleProductionManager } from "@/lib/assistant-work/production-manager";
import { executeWebsiteRequest } from "@/lib/assistant-work/website-request";
import { clientIpFromRequest, rateLimit, rateLimitResponse, rejectSuspiciousText } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { handleAssistantWork } from "@/lib/assistant-work/core";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { runVideoClippingPipeline } from "@/lib/pipelines/video-clipping-pipeline";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const out = await handleAssistantWork(req, { action: "balance" });
  return NextResponse.json(out.payload, { status: out.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (body && typeof body === "object" && typeof body.prompt === "string") {
    const token = bearerTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { ok: false, spend: false, code: "sign_in", message: "Sign in to start production." },
        { status: 401 },
      );
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    const user = data.user;
    if (error || !user) {
      return NextResponse.json(
        { ok: false, spend: false, code: "sign_in", message: "Sign in to start production." },
        { status: 401 },
      );
    }

    const requestedCategory = String(body.category || "").trim().toLowerCase();
    const requestedType = String(body.type || "");
    const category = resolveWorkspaceCategory(requestedCategory, requestedType, String(body.prompt || ""));
    const prompt = String(body.prompt || "").trim();
    const type = category === "website" ? "Website" : requestedType;
    const scene = String(body.scene || "01");
    const action = String(body.action || "revise");
    const extras = body.extras && typeof body.extras === "object" ? body.extras as Record<string,string> : {};
    if (category === "website") {
      const limit = rateLimit({ key: `website-assistant:${user.id}:${clientIpFromRequest(req)}`, limit: 30, windowMs: 15 * 60 * 1000 }); if (!limit.allowed) return rateLimitResponse(limit.resetAt);
      if (JSON.stringify(body).length > 50000) return NextResponse.json({ ok: false, error: "website_request_too_large" }, { status: 413 });
      const safe = rejectSuspiciousText([String(body.prompt ?? ""), JSON.stringify(body.websiteBrief ?? {})]); if (!safe.ok) return NextResponse.json({ ok: false, error: safe.message }, { status: 400 });
      const result = await executeWebsiteRequest(req, { ...body, category, type }, { id: user.id, email: user.email });
      return NextResponse.json(result.payload, { status: result.status, headers: { "Cache-Control": "no-store" } });
    }
    if (!prompt && action !== "approve_plan") return NextResponse.json({ok:false,code:"empty_prompt",message:"Write something first."},{status:400});
    const limit = rateLimit({key:`workspace-conversation:${user.id}:${clientIpFromRequest(req)}`,limit:30,windowMs:15*60*1000});
    if (!limit.allowed) return rateLimitResponse(limit.resetAt);
    if (JSON.stringify(body).length>50000) return NextResponse.json({ok:false,error:"conversation_request_too_large"},{status:413});
    const safe = rejectSuspiciousText([prompt,JSON.stringify(body.messages ?? [])]);
    if (!safe.ok) return NextResponse.json({ok:false,error:safe.message},{status:400});
    try {
      const result = await handleProductionManager(supabase,user.id,category,{...body,category,type,scene,extras},async input => {
        const sourceVideoUrl = String(input.sourceVideoUrl || "");
        if (!/^https:\/\//i.test(sourceVideoUrl)) throw new Error("source_video_required");
        const clipping = await runVideoClippingPipeline({productionId:input.productionId,title:input.prompt.slice(0,100),prompt:input.prompt,requestMetadata:{sourceVideoUrl,userId:input.userId},requestedClipCount:3,targetDurationSeconds:18});
        const render = clipping.renderJob as unknown as Record<string,unknown> | null;
        const finalUrl = typeof render?.outputUrl === "string" ? render.outputUrl : clipping.clipUrls[0] || null;
        return {ok:true,spend:true,engine:"none",category,status:finalUrl?"ready":"queued",providerOutcome:"accepted",title:"Video clips",body:input.prompt,media:finalUrl?{kind:"video",url:finalUrl}:null,taskId:typeof render?.id === "string"?render.id:undefined,files:[{name:"clips.json",mime:"application/json",content:JSON.stringify({sourceVideoUrl,clips:clipping.selectedHighlights,clipUrls:clipping.clipUrls})}]};
      });
      return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
    } catch (error) {
      const detail = error instanceof Error ? error.message : "production_manager_unavailable";
      const code = detail.includes("insufficient") ? "insufficient" : detail.includes("plan") || detail.includes("fenced") ? "plan_required" : "production_manager_unavailable";
      const status = code === "insufficient" ? 402 : code === "plan_required" ? 409 : 503;
      return NextResponse.json({ok:false,spend:false,code,message:detail},{status});
    }
  }

  const out = await handleAssistantWork(req, body || {});
  return NextResponse.json(out.payload, { status: out.status });
}
