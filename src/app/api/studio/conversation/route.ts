import {createClient} from "@supabase/supabase-js";
import {isolatedDatabaseTarget} from "@/lib/studio-agent/environment-policy";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/security";
import { ConversationError } from "@/lib/studio-agent/conversation-contract";
import { handleStudioConversation } from "@/lib/studio-agent/conversation-handler";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const handle=(request:Request)=>handleStudioConversation(request,{authenticate:async()=>{
  const token=bearerTokenFromRequest(request);if(!token)throw new ConversationError("sign_in",401);
  // Real assistant must authenticate against the same exact isolated DB that
  // owns its accounting and project state. Never dispatch with the legacy DB.
  const target="https://bwzxdxqgrgbsvndinmrv.supabase.co";
  const isolated=isolatedDatabaseTarget()&&process.env.STUDIO_AGENT_TEST_DATABASE_URL===target&&process.env.STUDIO_AGENT_TEST_DATABASE_ORIGIN===target;
  if(process.env.STUDIO_AGENT_REAL_AI_ENABLED==="true"&&!isolated)throw new ConversationError("isolated_database_required",503);
  const db=isolated?createClient(target,process.env.STUDIO_AGENT_TEST_SERVICE_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):supabaseAdmin();
  const {data,error}=await db.auth.getUser(token);
  if(isolated&&(!data.user?.email_confirmed_at&&!data.user?.confirmed_at))throw new ConversationError("sign_in",401);
  if(error||!data.user)throw new ConversationError("sign_in",401);
  if(!rateLimit({key:"studio-b2:"+data.user.id,limit:60,windowMs:60000}).allowed)throw new ConversationError("rate_limit",429);
  return {userId:data.user.id,db};
}});
export const GET=handle;
export const POST=handle;
