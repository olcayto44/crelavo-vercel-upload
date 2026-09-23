import { NextRequest, NextResponse } from "next/server";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { mirrorProviderVideoVertical } from "@/lib/providers/storage";
import { generateStableAudio, stableAudioConfigured } from "@/lib/providers/stable-audio";
import { createVoiceover } from "@/lib/providers/elevenlabs";
import { falConfigured, pollMediaJob, runwayConfigured, startFalFallback, startRunwayFallback } from "@/lib/assistant-work/runMediaEngine";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const token=bearerTokenFromRequest(req); if(!token)return NextResponse.json({ok:false,code:"sign_in",message:"Sign in required."},{status:401});
  const supabase=supabaseAdmin(); const auth=await supabase.auth.getUser(token); if(auth.error||!auth.data.user)return NextResponse.json({ok:false,code:"sign_in",message:"Sign in required."},{status:401});
  const body=await req.json().catch(()=>({})); const category=String(body.category||"").trim(); let taskId=String(body.taskId||"").trim(); const productionId=String(body.productionId||"").trim();
  let production:any=null;
  if(productionId){const lookup=await supabase.from("production_requests").select("id,prompt,output_json,input_json,generation_status").eq("id",productionId).eq("user_id",auth.data.user.id).maybeSingle();production=lookup.data||null;const savedTask=production?.output_json?.taskId||production?.output_json?.task_id;if(typeof savedTask==="string"&&(savedTask.startsWith("runway:")||savedTask.startsWith("fal:")))taskId=savedTask;}
  let result=await pollMediaJob(category,taskId);
  if(result.status==="failed" && !taskId.startsWith("runway:") && production?.prompt && runwayConfigured()){
    const alreadyAttempted=production?.output_json?.fallbackFrom === "minimax" || production?.output_json?.runwayFallbackAttempted === true;
    if(!alreadyAttempted){
      const fallback=await startRunwayFallback({prompt:String(production.prompt),category,extras:(production.input_json?.extras && typeof production.input_json.extras === "object" ? production.input_json.extras : {})});
      if(fallback.ok&&fallback.taskId){taskId=String(fallback.taskId);result={status:"queued",provider:"runway",taskId,message:"MiniMax failed; Runway fallback started."};await supabase.from("production_requests").update({generation_status:"queued",status:"in_production",output_json:{...(production.output_json||{}),assistant:true,provider:"runway",taskId,runwayFallbackAttempted:true,fallbackFrom:"minimax"},error_message:null,updated_at:new Date().toISOString()}).eq("id",productionId).eq("user_id",auth.data.user.id);}
      else result={...result,message:(result.message||"MiniMax failed.")+" Runway fallback could not start: "+(fallback.message||"unknown error")};
    }
  }
  if(result.status==="failed" && taskId.startsWith("runway:") && production?.prompt && falConfigured()){
    const alreadyAttempted=production?.output_json?.falFallbackAttempted===true;
    if(!alreadyAttempted){const fallback=await startFalFallback({prompt:String(production.prompt),category,extras:(production.input_json?.extras && typeof production.input_json.extras === "object" ? production.input_json.extras : {})});if(fallback.ok&&fallback.taskId){taskId=String(fallback.taskId);result={status:"queued",provider:"fal",taskId,message:"Runway failed; FAL fallback started."};await supabase.from("production_requests").update({generation_status:"queued",status:"in_production",output_json:{...(production.output_json||{}),assistant:true,provider:"fal",taskId,falFallbackAttempted:true,fallbackFrom:"runway"},error_message:null,updated_at:new Date().toISOString()}).eq("id",productionId).eq("user_id",auth.data.user.id);}else result={...result,message:(result.message||"Runway failed.")+" FAL fallback could not start: "+(fallback.message||"unknown error")};}
  }
  if(productionId){ await supabase.from("production_requests").update({ generation_status: result.status, status: result.status === "failed" ? "failed" : "in_production", error_message: result.message ?? null, updated_at: new Date().toISOString() }).eq("id",productionId).eq("user_id",auth.data.user.id); }
  if(result.status!=="ready"||!result.mediaUrl)return NextResponse.json({ok:true,...result,productionId},{status:result.status==="failed"?502:200});
  let mediaUrl=result.mediaUrl; let audioStatus="not_requested"; let audioBytes:Uint8Array|undefined;
  const sound=String(production?.input_json?.extras?.sound||"");
  const audioAlready=production?.output_json?.audioMuxed===true;
  if(sound==="instrumental_bgm"&&!audioAlready){if(stableAudioConfigured()){try{const duration=String(production?.input_json?.extras?.duration||"").includes("15")?15:8;audioBytes=await generateStableAudio({prompt:"Premium instrumental background music for a modern AI creative technology brand video, elegant, energetic, no vocals, no spoken words, clean commercial sound design",durationSeconds:duration});audioStatus="generated";}catch(error){audioStatus="failed";}}else audioStatus="not_configured";}
  if(sound==="ai_voice_over"&&!audioAlready){try{const audioUrl=await createVoiceover({productionId:"assistant-"+auth.data.user.id,script:String(production?.prompt||""),voiceDirection:"Clear, confident, premium commercial narration"});const voiceResponse=await fetch(audioUrl,{cache:"no-store"});if(!voiceResponse.ok)throw new Error("ElevenLabs audio download failed.");audioBytes=new Uint8Array(await voiceResponse.arrayBuffer());audioStatus="generated";}catch(error){audioStatus="failed";}}
  try { mediaUrl=await mirrorProviderVideoVertical({ productionId:"assistant-"+auth.data.user.id, sourceUrl:result.mediaUrl, filenameBase:"media-"+taskId, audioBytes }); if(audioBytes)audioStatus="muxed"; } catch { /* keep provider URL when postprocessing is unavailable */ }
  if(productionId){ await supabase.from("production_requests").update({ generation_status: "ready", status: "ready", preview_url: mediaUrl, output_json: { ...(production?.output_json||{}), assistant: true, provider: result.provider || production?.output_json?.provider || "heygen_or_minimax", taskId, audioStatus, audioMuxed: audioStatus === "muxed", media: { kind: "video", url: mediaUrl } }, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id",productionId).eq("user_id",auth.data.user.id); }
  return NextResponse.json({ok:true,status:"ready",provider:result.provider,taskId,mediaUrl,audioStatus,productionId});
}
