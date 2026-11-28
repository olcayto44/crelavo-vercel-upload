"use strict";
const {createHash}=require("node:crypto");
const {execFileSync}=require("node:child_process");
const TEST_ORIGIN="https://bwzxdxqgrgbsvndinmrv.supabase.co";
const BUCKET="model-original-quarantine";
const MAX=3000000;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const formats={"video/mp4":"mov","video/quicktime":"mov","audio/mpeg":"mp3","audio/wav":"wav"};
const imageFormats={"image/jpeg":"jpeg","image/png":"png","image/webp":"webp"};
const digest=b=>createHash("sha256").update(b).digest("hex");
function checkIdentity(row,owner){
 if(!uuid.test(owner)||!uuid.test(row.id)||row.user_id!==owner||row.model_id!=="magi-2"||row.state!=="quarantined"||row.object_key!==owner+"/"+row.id+"/original"||!Number.isInteger(row.bytes)||row.bytes<1||row.bytes>MAX||!/^[0-9a-f]{64}$/.test(row.sha256??""))throw Error("invalid_asset_identity");
}
function tool(name,args,bytes){return execFileSync(name,args,{input:bytes,timeout:12000,maxBuffer:512000,stdio:["pipe","pipe","pipe"],env:{PATH:process.env.PATH??"/usr/bin:/bin",LANG:"C"}})}
async function inspect(row,bytes,owner){
 checkIdentity(row,owner);
 if(!Buffer.isBuffer(bytes)||bytes.length!==row.bytes||digest(bytes)!==row.sha256)throw Error("integrity_mismatch");
 if(row.kind==="image"){
 const expected=imageFormats[row.mime];if(!expected)throw Error("invalid_format");
 const image=require("sharp")(bytes,{limitInputPixels:16000000,failOn:"warning"});
 const info=await image.metadata();
 if(info.format!==expected||(info.pages??1)!==1||!info.width||!info.height||info.width>8192||info.height>8192)throw Error("invalid_image");
 await image.resize(32,32,{fit:"inside"}).raw().toBuffer();
 return {duration_ms:null};
 }
 const format=formats[row.mime];
 if(!format||!(row.kind==="video"&&format==="mov"||row.kind==="audio"&&format!=="mov"))throw Error("invalid_format");
 // Pipe-only input prevents network and local-file access from embedded references.
 const common=["-v","error","-max_alloc","67108864","-protocol_whitelist","pipe","-f",format];
 const meta=JSON.parse(tool("ffprobe",[...common,"-show_entries","format=duration:stream=codec_type,codec_name,width,height,duration,sample_rate,channels","-of","json","pipe:0"],bytes).toString("utf8"));
 const streams=meta.streams??[],video=streams.filter(s=>s.codec_type==="video"),audio=streams.filter(s=>s.codec_type==="audio");
 if(streams.length!==video.length+audio.length||audio.length>1||video.length>(row.kind==="video"?1:0)||row.kind==="video"&&video.length!==1||row.kind==="audio"&&audio.length!==1)throw Error("unsupported_streams");
 if(video.some(s=>!["h264","hevc","av1","vp9","mpeg4"].includes(s.codec_name)||!Number.isInteger(s.width)||!Number.isInteger(s.height)||s.width<1||s.height<1||s.width*s.height>8294400))throw Error("unsupported_video");
 if(audio.some(s=>!["aac","mp3","alac","opus","pcm_s16le","pcm_s24le","pcm_s32le","pcm_f32le"].includes(s.codec_name)||Number(s.sample_rate)>96000||Number(s.sample_rate)<8000||s.channels<1||s.channels>2))throw Error("unsupported_audio");
 const candidates=[meta.format?.duration,...streams.map(s=>s.duration)].map(Number).filter(Number.isFinite);
 if(!candidates.length)throw Error("duration_unavailable");
 const ms=Math.round(Math.max(...candidates)*1000);
 if(ms<2000||ms>30000)throw Error("invalid_duration");
 // Bounded decode check. Non-streamable containers remain quarantined/rejected.
 tool("ffmpeg",["-nostdin","-xerror","-threads","1",...common,"-i","pipe:0","-map","0:v?","-map","0:a?","-t","30.001","-threads","1","-f","null","-"],bytes);
 return {duration_ms:ms};
}
function enabled(env=process.env){return env.MODEL_MEDIA_WORKER_ENABLED==="true"&&env.MODEL_MEDIA_TEST_DATABASE_URL===TEST_ORIGIN&&env.MODEL_MEDIA_TEST_DATABASE_ORIGIN===TEST_ORIGIN&&env.VERCEL_ENV!=="production"&&uuid.test(env.MODEL_MEDIA_PILOT_USER_ID??"")&&!!env.MODEL_MEDIA_TEST_SERVICE_KEY}
async function run(){
 if(!enabled()){console.log("model-media-worker: disabled");return}
 const {createClient}=require("@supabase/supabase-js");
 const db=createClient(TEST_ORIGIN,process.env.MODEL_MEDIA_TEST_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const owner=process.env.MODEL_MEDIA_PILOT_USER_ID;
 const config=await db.storage.getBucket(BUCKET);if(config.error||config.data?.public!==false)throw Error("storage_unavailable");
 const {data:row,error}=await db.from("model_media_assets").select("id,user_id,model_id,kind,mime,bytes,object_key,state,sha256").eq("user_id",owner).eq("model_id","magi-2").eq("state","quarantined").order("created_at",{ascending:true}).limit(1).maybeSingle();
 if(error)throw Error("query_failed");if(!row){console.log("model-media-worker: idle");return}
 checkIdentity(row,owner);
 const download=await db.storage.from(BUCKET).download(row.object_key);
 if(download.error||!download.data||download.data.size!==row.bytes)throw Error("storage_unavailable");
 const bytes=Buffer.from(await download.data.arrayBuffer());
 let result;try{result=await inspect(row,bytes,owner)}catch{console.log("model-media-worker: validation failed; retained in quarantine");process.exitCode=1;return}
 const updated=await db.from("model_media_assets").update({state:"verified",duration_ms:result.duration_ms}).eq("id",row.id).eq("user_id",owner).eq("model_id","magi-2").eq("state","quarantined").eq("sha256",row.sha256).select("id").maybeSingle();
 if(updated.error||!updated.data)throw Error("update_unconfirmed");
 console.log("model-media-worker: verified one asset");
}
module.exports={enabled,inspect,checkIdentity,digest};
if(require.main===module)run().catch(()=>{console.error("model-media-worker: execution unconfirmed");process.exitCode=1});
