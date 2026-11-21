import { NextRequest, NextResponse } from "next/server";
import { getWorkUserId } from "@/lib/assistant-work/core";
import { requireAssistantStorageOwner } from "@/lib/assistant-work/storage-ownership";
import { supabaseAdmin } from "@/lib/supabase";
export async function POST(req:NextRequest) {
 const db=supabaseAdmin();const userId=await getWorkUserId(req);
 if(!userId)return NextResponse.json({error:"sign_in_required"},{status:401});
 const body=await req.json().catch(()=>({}));const material=body.material;
 if(!material || !["image/png","image/jpeg","image/webp"].includes(material.content_type) || !Number.isInteger(material.size_bytes) || material.size_bytes<=0 || material.size_bytes>50*1024*1024 || typeof material.file_url!=="string")return NextResponse.json({error:"invalid_website_reference"},{status:422});
 const {data:row,error}=await db.from("production_requests").select("id,input_json,output_json,updated_at,status").eq("id",String(body.productionId)).eq("user_id",userId).eq("production_type","website").maybeSingle();
 if(error || !row)return NextResponse.json({error:"website_project_not_found"},{status:404});
 if(["generating","ready","cancelled"].includes(row.status) || ["generating","awaiting_payment"].includes(row.output_json?.websiteAssistant?.phase))return NextResponse.json({error:"website_project_locked"},{status:409});
 try{await requireAssistantStorageOwner(db,userId,material.file_url)}catch{return NextResponse.json({error:"material_ownership_unverified"},{status:403})}
 const refs=Array.isArray(row.input_json?.studioReferences)?row.input_json.studioReferences:[];
 if(refs.length>=10)return NextResponse.json({error:"website_reference_limit"},{status:422});
 const entry={file_url:material.file_url,title:String(material.title||"Reference").slice(0,200),content_type:material.content_type,size_bytes:material.size_bytes};
 const next=refs.some((ref:{file_url:string})=>ref.file_url===entry.file_url)?refs:[...refs,entry];
 let update=db.from("production_requests").update({input_json:{...row.input_json,studioReferences:next},output_json:{...row.output_json,websiteAssistant:{...row.output_json?.websiteAssistant,approvedHash:null}},updated_at:new Date().toISOString()}).eq("id",row.id).eq("user_id",userId);
 update=row.updated_at?update.eq("updated_at",row.updated_at):update.is("updated_at",null);
 const saved=await update.select("id").maybeSingle();
 if(saved.error || !saved.data)return NextResponse.json({error:"website_changed_reload_before_saving"},{status:409});
 return NextResponse.json({ok:true,references:next,approvalInvalidated:true});
}

export async function GET(req:NextRequest){const userId=await getWorkUserId(req);if(!userId)return NextResponse.json({error:"sign_in_required"},{status:401});const {data,error}=await supabaseAdmin().from("production_requests").select("input_json").eq("id",req.nextUrl.searchParams.get("productionId")||"").eq("user_id",userId).eq("production_type","website").maybeSingle();if(error||!data)return NextResponse.json({error:"website_project_not_found"},{status:404});return NextResponse.json({ok:true,references:data.input_json?.studioReferences||[]});}
