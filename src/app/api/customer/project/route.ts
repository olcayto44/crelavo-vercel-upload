import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
export async function GET(request:Request){
 const reply=(body:Record<string,unknown>,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
 const token=bearerTokenFromRequest(request);
 if(!token)return reply({error:"Sign in required."},401);
 try{
 const db=supabaseAdmin(),{data,error}=await db.auth.getUser(token);
 if(error||!data.user?.id)return reply({error:"Sign in required."},401);
 if(!(data.user.email_confirmed_at||data.user.confirmed_at))return reply({error:"Confirm your email."},403);
 const id=new URL(request.url).searchParams.get("id")||"";
 if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id))return reply({error:"Project not found."},404);
 const {data:row,error:readError}=await db.from("production_requests").select("id,user_id,title,prompt,production_type,package_id,status,generation_status,automation_status,estimated_credits,preview_url,delivery_zip_url,source_files_url,readme_url,delivery_link,output_json,input_json,request_metadata,materials_json,approval_question,approval_options,approval_status,error_message,reserved_credits").eq("id",id).eq("user_id",data.user.id).neq("status","deleted").maybeSingle();
 if(readError)return reply({error:"Project could not be loaded."},503);
 if(!row)return reply({error:"Project not found."},404);
 return reply({project:row});
 }catch{return reply({error:"Project could not be loaded."},503);}
}
