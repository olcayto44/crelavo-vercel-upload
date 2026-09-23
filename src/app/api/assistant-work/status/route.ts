import { NextRequest, NextResponse } from "next/server";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { mirrorProviderVideoVertical } from "@/lib/providers/storage";
import { pollMediaJob } from "@/lib/assistant-work/runMediaEngine";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const token=bearerTokenFromRequest(req); if(!token)return NextResponse.json({ok:false,code:"sign_in",message:"Sign in required."},{status:401});
  const supabase=supabaseAdmin(); const auth=await supabase.auth.getUser(token); if(auth.error||!auth.data.user)return NextResponse.json({ok:false,code:"sign_in",message:"Sign in required."},{status:401});
  const body=await req.json().catch(()=>({})); const category=String(body.category||"").trim(); const taskId=String(body.taskId||"").trim(); const productionId=String(body.productionId||"").trim(); const result=await pollMediaJob(category,taskId);
  if(productionId){ await supabase.from("production_requests").update({ generation_status: result.status, status: result.status === "failed" ? "failed" : "in_production", error_message: result.message ?? null, updated_at: new Date().toISOString() }).eq("id", productionId).eq("user_id", auth.data.user.id); }
  if(result.status!=="ready"||!result.mediaUrl)return NextResponse.json({ok:true,...result,productionId},{status:result.status==="failed"?502:200});
  let mediaUrl=result.mediaUrl; try { mediaUrl=await mirrorProviderVideoVertical({ productionId:"assistant-"+auth.data.user.id, sourceUrl:result.mediaUrl, filenameBase:"media-"+taskId }); } catch { /* keep provider URL if vertical export is unavailable */ }
  if(productionId){ await supabase.from("production_requests").update({ generation_status: "ready", status: "ready", preview_url: mediaUrl, output_json: { assistant: true, provider: "heygen_or_minimax", taskId, media: { kind: "video", url: mediaUrl } }, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", productionId).eq("user_id", auth.data.user.id); }
  return NextResponse.json({ok:true,status:"ready",mediaUrl,productionId});
}
