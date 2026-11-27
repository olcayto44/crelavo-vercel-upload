// Server-only helper; never persist or expose a general provider key, or use it
// as an implicit fallback. Dedicated pilot keys remain the preferred option.
const origin="https://bwzxdxqgrgbsvndinmrv.supabase.co";
import {websiteCommercialAcceptanceBranch,websitePilotBranchAllowed} from "../website-pilot-branches";
export function websitePilotScope(env:NodeJS.ProcessEnv=process.env){
 return env.VERCEL_ENV==="preview"&&websitePilotBranchAllowed(env.VERCEL_GIT_COMMIT_REF)&&env.STUDIO_WEBSITE_TEST_CONNECTION_ENABLED==="true"&&env.STUDIO_AGENT_DATABASE_TARGET==="isolated"&&env.STUDIO_AGENT_TEST_DATABASE_URL===origin&&env.STUDIO_AGENT_TEST_DATABASE_ORIGIN===origin&&!!env.STUDIO_AGENT_TEST_SERVICE_KEY?.trim();
}
export function websitePilotProviderKey(env:NodeJS.ProcessEnv=process.env){
 if(!websitePilotScope(env))return "";
 const dedicated=env.STUDIO_AGENT_TEST_PROVIDER_KEY?.trim();
 if(dedicated)return dedicated;
 // The commercial acceptance branch requires a dedicated test provider key.
 if(env.VERCEL_GIT_COMMIT_REF===websiteCommercialAcceptanceBranch)return "";
 // Explicit operator opt-in to existing Preview key, not a production secret.
 return env.STUDIO_WEBSITE_REUSE_PREVIEW_OPENAI==="true"?env.OPENAI_API_KEY?.trim()||"":"";
}
export function websitePilotCanary(actor:string,env:NodeJS.ProcessEnv=process.env){
 return websitePilotScope(env)&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(actor)&&actor===env.STUDIO_WEBSITE_AI_TEST_USER_ID;
}

/** Reuse existing preview credentials in place, never copy or resolve production secrets.
 * The dedicated image key and dedicated canary take precedence. No cross-provider fallback.
 * This only resolves configuration; the caller must still verify cost policy, approval and activation.
 */
export function websiteImagePilotConnection(env:NodeJS.ProcessEnv=process.env){
 if(!websitePilotScope(env))return {apiKey:"",canaryId:"",source:"disabled" as const};
 const dedicated=env.STUDIO_IMAGE_TEST_PROVIDER_KEY?.trim();
 if(dedicated)return {apiKey:dedicated,canaryId:env.STUDIO_IMAGE_TEST_USER_ID?.trim()||"",source:"dedicated" as const};
 if(env.VERCEL_GIT_COMMIT_REF===websiteCommercialAcceptanceBranch||env.STUDIO_WEBSITE_REUSE_PREVIEW_MINIMAX!=="true")return {apiKey:"",canaryId:"",source:"disabled" as const};
 const apiKey=(env.MINIMAX_API_KEY?.trim()||env.MINIMAX_KEY?.trim()||"");
 return {apiKey,canaryId:env.STUDIO_IMAGE_TEST_USER_ID?.trim()||env.STUDIO_WEBSITE_AI_TEST_USER_ID?.trim()||"",source:apiKey?"existing_preview_minimax" as const:"disabled" as const};
}
