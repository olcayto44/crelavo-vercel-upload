import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { websitePilotCanary, websitePilotScope } from "@/lib/studio-agent/website-pilot-provider";
import { websiteCommercialAcceptanceBranch } from "@/lib/website-pilot-branches";
import { rateLimit } from "@/lib/security";
import { ConversationError } from "@/lib/studio-agent/conversation-contract";
import { handleStudioConversation } from "@/lib/studio-agent/conversation-handler";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const handle=(request:Request)=>handleStudioConversation(request,{authenticate:async()=>{
  const token=bearerTokenFromRequest(request);if(!token)throw new ConversationError("sign_in",401);
  // Never authenticate an isolated Website test session against the live DB.
  const isolated=process.env.VERCEL_ENV==="preview"&&process.env.VERCEL_GIT_COMMIT_REF===websiteCommercialAcceptanceBranch;
  if(isolated&&!websitePilotScope())throw new ConversationError("isolated_website_preview_not_enabled",503);
  const db=isolated?createClient("https://bwzxdxqgrgbsvndinmrv.supabase.co",process.env.STUDIO_AGENT_TEST_SERVICE_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):supabaseAdmin();
  const {data,error}=await db.auth.getUser(token);
  if(error||!data.user)throw new ConversationError("sign_in",401);
  if(isolated&&(!(data.user.email_confirmed_at||data.user.confirmed_at)||!websitePilotCanary(data.user.id)))throw new ConversationError("website_pilot_only",403);
  if(!rateLimit({key:"studio-b2:"+data.user.id,limit:60,windowMs:60000}).allowed)throw new ConversationError("rate_limit",429);
  return {userId:data.user.id,db};
}});
export const GET=handle;
export const POST=handle;
