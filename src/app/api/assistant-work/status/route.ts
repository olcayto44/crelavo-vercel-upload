import { NextRequest, NextResponse } from "next/server";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { mirrorProviderVideoVertical } from "@/lib/providers/storage";
import { pollMediaJob } from "@/lib/assistant-work/runMediaEngine";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const token=bearerTokenFromRequest(req); if(!token)return NextResponse.json({ok:false,code:"sign_in",message:"Sign in required."},{status:401});
  const supabase=supabaseAdmin(); const auth=await supabase.auth.getUser(token); if(auth.error||!auth.data.user)return NextResponse.json({ok:false,code:"sign_in",message:"Sign in required."},{status:401});
  const body=await req.json().catch(()=>({})); const category=String(body.category||"").trim(); const taskId=String(body.taskId||"").trim(); const result=await pollMediaJob(category,taskId);
  if(result.status!=="ready"||!result.mediaUrl)return NextResponse.json({ok:true,...result},{status:result.status==="failed"?502:200});
  let mediaUrl=result.mediaUrl; try { mediaUrl=await mirrorProviderVideoVertical({ productionId:"assistant-"+auth.data.user.id, sourceUrl:result.mediaUrl, filenameBase:"media-"+taskId }); } catch { /* keep provider URL if vertical export is unavailable */ }
  return NextResponse.json({ok:true,status:"ready",mediaUrl});
}
