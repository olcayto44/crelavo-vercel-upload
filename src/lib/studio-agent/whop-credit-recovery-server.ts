import "server-only";
import {supabaseAdmin} from "@/lib/supabase";
import {recoverVerifiedWhopTopup} from "./whop-credit-recovery";
// No route or scheduled worker calls this. Keep disabled until both verified
// Whop entry points, pending-user mapping, reversals, ops projection and all
// wallet writers have passed acceptance; never enable for legacy production.
export async function executeIsolatedWhopTopupRecovery(paymentId:string,verify:(id:string)=>Promise<unknown>){
 if(process.env.VERCEL_ENV!=="preview"||process.env.STUDIO_WHOP_ISOLATED_RECOVERY_ENABLED!=="true"||process.env.STUDIO_WHOP_ISOLATED_DB_CONFIRMED!=="true")return {state:"disabled" as const,safeToRetryAutomatically:false as const};
 const db=supabaseAdmin();
 return recoverVerifiedWhopTopup(paymentId,{
  enabled:()=>true,verify,
  async loadWallet(userId){const {data,error}=await db.from("credit_balances").select("*").eq("user_id",userId).maybeSingle();if(error)throw Error("wallet_unavailable");return data;},
  async rpc(name,args){const {data,error}=await db.rpc(name,args);return {data,error};},
 });
}
