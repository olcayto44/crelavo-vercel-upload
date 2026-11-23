import {isolatedDatabaseTarget} from "./environment-policy";
import {readCostPolicy} from "./cost-policy";
import type { supabaseAdmin } from "@/lib/supabase";
import { readAssistantTariff } from "./conversation-engine";
export type StudioReadiness = { ready:boolean; configured:boolean; checks:{ approval:boolean; realEnabled:boolean; accountingEnabled:boolean; keyConfigured:boolean; providerVerified:boolean; tariff:boolean; database:boolean; accounting:boolean; isolation:boolean;costPolicy:boolean;offlineDisabled:boolean }; blockers:string[]; providerProbePerformed:false; executionReady:false };
export async function studioReadiness(db:ReturnType<typeof supabaseAdmin>):Promise<StudioReadiness> {
 const env=process.env;
 const isolation=isolatedDatabaseTarget(env)&&env.STUDIO_AGENT_ISOLATED_PREVIEW!=="true";
 const checks={approval:env.STUDIO_AGENT_REAL_AI_APPROVED==="true",realEnabled:env.STUDIO_AGENT_REAL_AI_ENABLED==="true",accountingEnabled:env.STUDIO_AGENT_ACCOUNTING_ENABLED==="true",keyConfigured:!!env.STUDIO_AGENT_TEST_PROVIDER_KEY?.trim(),providerVerified:env.STUDIO_AGENT_PROVIDER_VERIFIED==="true",tariff:false,database:false,accounting:false,isolation,costPolicy:false,offlineDisabled:env.STUDIO_AGENT_TEST_OFFLINE!=="true"};
 try { readAssistantTariff(); checks.tariff=true; } catch { /* Missing tariff is a blocker, not a fallback. */ }
 try{readCostPolicy();checks.costPolicy=true;}catch{/* Fail closed. */}
 // No provider request, no mutation RPC, and no DB probe while disabled/offline.
 if(checks.approval&&checks.realEnabled&&checks.accountingEnabled&&checks.tariff&&checks.isolation&&checks.costPolicy&&checks.offlineDisabled){
  try {const {data,error}=await db.rpc("studio_agent_readiness",{});if(!error&&data?.version==="b3-isolated-cost"){checks.database=data.database===true;checks.accounting=data.accounting===true;}} catch { /* Fail closed. Never expose DB details or secrets. */ }
 }
 const blockers=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
 return {ready:blockers.length===0,configured:checks.keyConfigured&&checks.tariff&&checks.database&&checks.accounting,checks,blockers,providerProbePerformed:false,executionReady:false};
}