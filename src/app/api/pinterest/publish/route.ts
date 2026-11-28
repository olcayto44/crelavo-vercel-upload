import {requireVerifiedRequestUser} from "@/lib/supabase";
export async function POST(request:Request){
 const body=await request.json().catch(()=>({}));const userId=String(body.user_id??body.userId??"");
 const auth=await requireVerifiedRequestUser(request,userId);if(!auth.ok)return auth.response;
 // Fail closed: the previous endpoint fetched arbitrary user-supplied URLs and lacked atomic dispatch protection.
 return Response.json({error:"Direct Pinterest publishing is temporarily disabled pending secure media upload and verified platform tests."},{status:503,headers:{"Cache-Control":"no-store"}});
}
