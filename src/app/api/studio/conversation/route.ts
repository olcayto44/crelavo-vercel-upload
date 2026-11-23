import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/security";
import { ConversationError } from "@/lib/studio-agent/conversation-contract";
import { handleStudioConversation } from "@/lib/studio-agent/conversation-handler";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const handle=(request:Request)=>handleStudioConversation(request,{authenticate:async()=>{
  const token=bearerTokenFromRequest(request);if(!token)throw new ConversationError("sign_in",401);
  const db=supabaseAdmin();const {data,error}=await db.auth.getUser(token);
  if(error||!data.user)throw new ConversationError("sign_in",401);
  if(!rateLimit({key:"studio-b2:"+data.user.id,limit:60,windowMs:60000}).allowed)throw new ConversationError("rate_limit",429);
  return {userId:data.user.id,db};
}});
export const GET=handle;
export const POST=handle;
