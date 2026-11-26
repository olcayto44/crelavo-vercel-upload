import {createClient} from "@supabase/supabase-js";
import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
import {bearerTokenFromRequest} from "@/lib/supabase";
import {ConversationError} from "@/lib/studio-agent/conversation-contract";
import {handleWebsiteAssistantRevision} from "@/lib/studio-agent/website-revision-handler";
import {rateLimit} from "@/lib/security";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function POST(request:Request){
 if(!websiteDesignPilotEnabled())return new Response(null,{status:404});
 return handleWebsiteAssistantRevision(request,{authenticate:async()=>{
  const token=bearerTokenFromRequest(request);if(!token)throw new ConversationError("sign_in",401);
  const url="https://bwzxdxqgrgbsvndinmrv.supabase.co",key=process.env.STUDIO_AGENT_TEST_SERVICE_KEY;
  if(!key||process.env.STUDIO_AGENT_TEST_DATABASE_URL!==url||process.env.STUDIO_AGENT_TEST_DATABASE_ORIGIN!==url)throw new ConversationError("isolated_database_unavailable");
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {data,error}=await db.auth.getUser(token);
  if(error||!data.user)throw new ConversationError("sign_in",401);
  if(!rateLimit({key:"website-revision:"+data.user.id,limit:30,windowMs:60000}).allowed)throw new ConversationError("rate_limit",429);
  return {userId:data.user.id,db};
 }});
}
