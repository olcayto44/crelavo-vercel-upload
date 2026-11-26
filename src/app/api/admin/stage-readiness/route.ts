import {requireAdminPermission} from "@/lib/admin-guard";
import {supabaseAdmin} from "@/lib/supabase";
import {stageEnvironment,stageTariff} from "@/lib/studio-agent/stage-environment";
import {stageCommercialReview,imageCosts} from "@/lib/studio-agent/stage-commercial-policy";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(request:Request){
 const access=await requireAdminPermission(request,"credits");if(!access.ok)return access.response;
 const e=stageEnvironment(),t=stageTariff(),db=supabaseAdmin(),audit=await db.rpc("studio_wallet_audit");
 const probes=await db.from("studio_provider_probes").select("suite,kind,state,error_code,completed_at,receipt").order("completed_at",{ascending:false}).limit(40);
 return Response.json({ok:!audit.error,scope:e?.scope??"unavailable",walletAudit:audit.error?null:audit.data,providerConfigured:{image:Boolean(e?.key),edit:Boolean(e?.editKey)},providerAcceptance:probes.error?null:(probes.data??[]).map(p=>({suite:p.suite,kind:p.kind,state:p.state,errorCode:p.error_code,completedAt:p.completed_at,bytes:p.receipt?.deliveryBytes??null})),publishedUnitCostsMicroUSD:imageCosts,tariff:t?stageCommercialReview(t):null,activation:{walletVerified:process.env.CRELAVO_STAGE_SHARED_WALLET_VERIFIED==="true",providerVerified:process.env.CRELAVO_STAGE_IMAGE_PROVIDER_VERIFIED==="true",editVerified:process.env.CRELAVO_STAGE_EDIT_PROVIDER_VERIFIED==="true",cronSecretConfigured:Boolean(process.env.CRON_SECRET),canaryConfigured:Boolean(e?.canary)}},{headers:{"Cache-Control":"private,no-store"}});
}
