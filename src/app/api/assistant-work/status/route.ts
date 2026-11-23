import { GET as mergeStatus } from "@/lib/merge/status";
export { GET } from "@/lib/merge/status";
import { NextRequest, NextResponse } from "next/server";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { pollMediaJob } from "@/lib/assistant-work/runMediaEngine";
import { finalizeAssistantProduction } from "@/lib/assistant-work/production-finalizer";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
function savedFailureMessage(output: Record<string, unknown>): string {
  if (output.code === "engine_not_configured") return "Production failed: provider configuration is missing. No automatic retry was started.";
  const message = typeof output.message === "string" ? output.message : "";
  const safeRejection = message.match(/^Provider rejected the request \(HTTP [1-5][0-9]{2}; (?:authorization|endpoint_unavailable|invalid_request|provider_error)(?:; code [a-zA-Z0-9_-]{1,64})?\)\. No automatic retry was started\.$/);
  if (safeRejection) return safeRejection[0];
  if (output.code === "provider_rejected") return "The provider rejected this production. The saved record contains no safe detailed rejection code. No automatic retry was started.";
  return "Production failed. The saved record contains no safe detailed failure reason. No automatic retry was started.";
}
export async function POST(req: NextRequest) {
  const token=bearerTokenFromRequest(req);
  if (!token) return NextResponse.json({ok:false,code:"sign_in"},{status:401});
  const db=supabaseAdmin(),auth=await db.auth.getUser(token),user=auth.data.user;
  if(auth.error||!user)return NextResponse.json({ok:false,code:"sign_in"},{status:401});
  const body=await req.json().catch(()=>({})),productionId=String(body.productionId||"");
  if(!productionId)return NextResponse.json({ok:false,code:"production_id_required"},{status:400});
  const {data:production,error}=await db.from("production_requests").select("id,user_id,production_type,task_generation,output_json,generation_status,status,provider_job_id").eq("id",productionId).eq("user_id",user.id).maybeSingle();
  if(error||!production)return NextResponse.json({ok:false,code:"production_not_found"},{status:404});
  const output=production.output_json||{},taskId=String(production.provider_job_id||output.taskId||"");
  if(output.mergeJobId)return mergeStatus(new Request(new URL("/api/assistant-work/status?jobId="+encodeURIComponent(output.mergeJobId),req.url),{headers:req.headers}));
  if(production.status==="ready"||production.status==="failed")return NextResponse.json({ok:true,status:production.status,productionId,taskId,...(production.status==="failed"?{message:savedFailureMessage(output)}:{}),media:output.media||null,mediaUrl:output.media?.url,mediaKind:output.media?.kind,files:output.files||[]});
  if(production.production_type==="website")return NextResponse.json({ok:true,status:"queued",productionId});
  if(production.generation_status==="reconcile_required"||!taskId)return NextResponse.json({ok:true,status:"reconcile_required",productionId});
  // Category/task identity comes only from the owned server row, never browser input.
  if(!output.planVersionId) {
    const result=await pollMediaJob(user.id,production.production_type,taskId);
    return NextResponse.json({ok:true,...result,productionId,mediaKind:output.media?.kind||"video",legacyReadOnly:true});
  }
  const claimed=await db.rpc("claim_assistant_production_lease",{p_user_id:user.id,p_production_id:productionId});
  if(claimed.error||!claimed.data)return NextResponse.json({ok:false,code:"lease_unavailable"},{status:503});
  const lease=claimed.data;
  if(lease.reconcileRequired)return NextResponse.json({ok:true,status:"reconcile_required",productionId});
  if(lease.busy||lease.finalized)return NextResponse.json({ok:true,status:"queued",productionId});
  try {
    const result=await pollMediaJob(user.id,production.production_type,taskId);
    if(result.status==="queued")return NextResponse.json({ok:true,...result,productionId});
    const kind=result.mediaKind||output.media?.kind||(["image","brand_kit","visual_clone"].includes(production.production_type)?"image":production.production_type==="voice_clone"?"audio":"video");
    if(result.status==="ready"&&!result.mediaUrl)return NextResponse.json({ok:true,status:"queued",productionId});
    const nextOutput={...output,media:result.mediaUrl?{kind,url:result.mediaUrl}:null,providerTerminal:result.status==="failed"?"failed":"ready",message:result.message};
    const settled=await finalizeAssistantProduction(db,{userId:user.id,productionId,taskGeneration:lease.taskGeneration,workerLease:lease.workerLease,stepToken:lease.stepToken},result.status,nextOutput);
    if(settled.reconcileRequired)return NextResponse.json({ok:true,status:"reconcile_required",productionId});
    return NextResponse.json({ok:true,...result,productionId,media:nextOutput.media,mediaKind:kind,files:output.files||[],balance:settled.available});
  } catch { return NextResponse.json({ok:true,status:"queued",productionId,message:"Status temporarily unavailable; no generation failure or refund was recorded."}); }
  finally { await db.rpc("release_assistant_production_lease",{p_user_id:user.id,p_production_id:productionId,p_generation:lease.taskGeneration,p_lease:lease.workerLease}); }
}
