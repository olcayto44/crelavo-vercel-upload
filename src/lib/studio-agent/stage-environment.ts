import {createClient} from "@supabase/supabase-js";
import {supabaseAdmin} from "../supabase";
import {StageTariff} from "./stage-plan";
const prod="https://yahegfagwxvixjnybkaw.supabase.co",isolated="https://bwzxdxqgrgbsvndinmrv.supabase.co";
export function stageEnvironment(){
 const env=process.env;
 if(env.VERCEL_ENV==="preview"&&env.STUDIO_AGENT_ISOLATED_PREVIEW==="true"&&env.STUDIO_AGENT_TEST_DATABASE_URL===isolated&&env.STUDIO_AGENT_TEST_SERVICE_KEY){
  return {db:createClient(isolated,env.STUDIO_AGENT_TEST_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),scope:"isolated" as const,editKey:env.STUDIO_EDIT_TEST_PROVIDER_KEY?.trim()||"",key:env.STUDIO_IMAGE_TEST_PROVIDER_KEY?.trim()||"",canary:env.STUDIO_IMAGE_TEST_USER_ID?.trim()||""};
 }
 if(env.VERCEL_ENV==="production"&&env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/,"")===prod&&env.STUDIO_AGENT_ISOLATED_PREVIEW!=="true"){
  return {db:supabaseAdmin(),scope:"production" as const,editKey:env.STABILITY_API_KEY?.trim()||env.STABILITY_KEY?.trim()||"",key:env.MINIMAX_API_KEY?.trim()||env.MINIMAX_KEY?.trim()||"",canary:env.CRELAVO_STAGE_CANARY_USER_ID?.trim()||""};
 }
 return null;
}
export type StageEnvironment=NonNullable<ReturnType<typeof stageEnvironment>>;
export function stageTariff(){
 const p=StageTariff.safeParse({version:process.env.CRELAVO_STAGE_TARIFF_VERSION,credits:Number(process.env.CRELAVO_STAGE_IMAGE_CREDITS),maxMicroUSD:Number(process.env.CRELAVO_STAGE_IMAGE_MAX_MICRO_USD),...(process.env.CRELAVO_STAGE_EDIT_CREDITS?{editCredits:Number(process.env.CRELAVO_STAGE_EDIT_CREDITS),editMaxMicroUSD:Number(process.env.CRELAVO_STAGE_EDIT_MAX_MICRO_USD)}:{})});
 return p.success?p.data:null;
}
export function stageEnabled(e:StageEnvironment,user:string){
 return Boolean(process.env.CRELAVO_STAGE_IMAGE_ENABLED==="true"&&process.env.CRELAVO_STAGE_IMAGE_PROVIDER_VERIFIED==="true"&&process.env.CRELAVO_STAGE_SHARED_WALLET_VERIFIED==="true"&&stageTariff()&&e.key&&e.canary===user);
}

export function stageEditEnabled(e:StageEnvironment,user:string){const t=stageTariff();return Boolean(stageEnabled(e,user)&&process.env.CRELAVO_STAGE_EDIT_PROVIDER_VERIFIED==="true"&&e.editKey&&t?.editCredits&&t.editMaxMicroUSD);}
