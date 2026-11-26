import "server-only";
import {createClient} from "@supabase/supabase-js";
import {websiteDesignPilotEnabled} from "../website-design-pilot-gate";
import {isolatedDatabaseTarget} from "./environment-policy";
import {recoverVerifiedWhopTopup} from "./whop-credit-recovery";
import {verifyWhopTopupByLookup} from "./whop-payment-verifier";
// Internal operator-only path. A trusted checkout binding must be established
// separately. No public route, live payment or production wallet access.
export async function executeIsolatedWhopTopupRecovery(paymentId:string,reviewedCheckoutBinding:unknown){
 const key=process.env.STUDIO_AGENT_TEST_SERVICE_KEY,providerKey=process.env.STUDIO_WHOP_TEST_READ_ONLY_KEY||"";
 if(process.env.VERCEL_ENV!=="preview"||!websiteDesignPilotEnabled()||!isolatedDatabaseTarget()||!key||!providerKey||process.env.STUDIO_WHOP_ISOLATED_RECOVERY_ENABLED!=="true"||process.env.STUDIO_WHOP_ISOLATED_DB_CONFIRMED!=="true")return {state:"disabled" as const,safeToRetryAutomatically:false as const};
 const db=createClient("https://bwzxdxqgrgbsvndinmrv.supabase.co",key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 return recoverVerifiedWhopTopup(paymentId,{
  enabled:()=>true,
  verify:async(id)=>verifyWhopTopupByLookup(id,reviewedCheckoutBinding,{enabled:()=>true,apiKey:providerKey}),
  async loadWallet(userId){const {data,error}=await db.from("credit_balances").select("*").eq("user_id",userId).maybeSingle();if(error)throw Error("wallet_unavailable");return data;},
  async rpc(name,args){const {data,error}=await db.rpc(name,args);return {data,error};},
 });
}
