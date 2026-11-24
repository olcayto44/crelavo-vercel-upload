// Dedicated Node.js worker. Run on a separately managed FFmpeg-capable host;
// never deploy as a Vercel request handler or expose service-role credentials.
import { createClient } from "@supabase/supabase-js";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { composeMp4, validateTimeline } from "./studio-ffmpeg-compose.mjs";

const bucket="studio-private";
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const workerId="studio-mp4-"+process.pid+"-"+Math.random().toString(36).slice(2,9);
const leaseMinutes=20;
const ffmpeg=process.env.FFMPEG_PATH||"ffmpeg";
const ffprobe=process.env.FFPROBE_PATH||"ffprobe";

function makeDb() {
  const url=process.env.SUPABASE_URL;
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!secret)throw new Error("Worker requires private Supabase credentials");
  return createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
}
async function claimNext(db) {
  const {data,error}=await db.from("studio_render_jobs").select(
    "id,user_id,project_id,timeline_version_id,attempt_count,max_attempts"
  ).eq("status","queued").order("created_at",{ascending:true}).limit(8);
  if(error)throw error;
  for(const job of data||[]) {
    const {data:claimed,error:claimError}=await db.from("studio_render_jobs")
      .update({status:"processing",worker_id:workerId,
        attempt_count:job.attempt_count+1,started_at:new Date().toISOString(),
        updated_at:new Date().toISOString(),
        lease_expires_at:new Date(Date.now()+leaseMinutes*60_000).toISOString()})
      .eq("id",job.id).eq("status","queued").eq("attempt_count",job.attempt_count)
      .select("id,user_id,project_id,timeline_version_id,attempt_count,max_attempts").maybeSingle();
    if(claimError)throw claimError;
    if(claimed)return claimed;
  }
  return null;
}
async function recoverExpired(db) {
  const now=new Date().toISOString();
  const {data,error}=await db.from("studio_render_jobs")
    .select("id,attempt_count,max_attempts").eq("status","processing")
    .lt("lease_expires_at",now).limit(10);
  if(error)throw error;
  for(const job of data||[]){
    await db.from("studio_render_jobs").update({
      status:job.attempt_count>=job.max_attempts?"failed":"queued",
      error_code:"WORKER_LEASE_EXPIRED",worker_id:null,lease_expires_at:null,
      updated_at:new Date().toISOString()
    }).eq("id",job.id).eq("status","processing").lt("lease_expires_at",now);
  }
}
async function downloadObject(db,objectPath,localPath,maxBytes) {
  const {data,error}=await db.storage.from(bucket).download(objectPath);
  if(error||!data)throw new Error("INPUT_DOWNLOAD_FAILED");
  if(data.size<=0||data.size>maxBytes)throw new Error("INPUT_FILE_LIMIT");
  await writeFile(localPath,Buffer.from(await data.arrayBuffer()));
}
async function processJob(db,job) {
  let folder=null;
  // Long renders must renew their exclusive lease while encoding.
  const heartbeat=setInterval(()=>{
    void db.from("studio_render_jobs").update({
      lease_expires_at:new Date(Date.now()+leaseMinutes*60_000).toISOString(),
      updated_at:new Date().toISOString()
    }).eq("id",job.id).eq("status","processing").eq("worker_id",workerId).then(()=>{}).catch(()=>{});
  },60_000);
  try {
    const {data:row,error}=await db.from("studio_timeline_versions")
      .select("timeline").eq("id",job.timeline_version_id)
      .eq("project_id",job.project_id).eq("user_id",job.user_id).single();
    if(error||!row)throw new Error("TIMELINE_MISSING");
    const timeline=validateTimeline(row.timeline,job.user_id,job.project_id);
    folder=await mkdtemp(path.join(os.tmpdir(),"crelavo-mp4-"));
    const sourceFiles=[];
    for(let index=0;index<timeline.clips.length;index++){
      const clip=timeline.clips[index];
      const {data:asset} = await db.from("studio_assets").select("id")
        .eq("user_id",job.user_id).eq("project_id",job.project_id)
        .eq("bucket_id",bucket).eq("object_path",clip.path).maybeSingle();
      if(!asset)throw new Error("CLIP_REFERENCE_NOT_OWNED");
      const suffix=path.extname(clip.path).toLowerCase();
      const filename=path.join(folder,"input-"+index+suffix);
      await downloadObject(db,clip.path,filename,90_000_000);
      sourceFiles.push(filename);
    }
    let musicFile=null;
    if(timeline.musicPath){
      const {data:musicAsset}=await db.from("studio_assets").select("id")
        .eq("user_id",job.user_id).eq("project_id",job.project_id)
        .eq("bucket_id",bucket).eq("object_path",timeline.musicPath).maybeSingle();
      if(!musicAsset)throw new Error("MUSIC_REFERENCE_NOT_OWNED");
      musicFile=path.join(folder,"music"+path.extname(timeline.musicPath).toLowerCase());
      await downloadObject(db,timeline.musicPath,musicFile,25_000_000);
    }
    let voiceFile=null;
    if(timeline.voicePath){
      const {data:voiceAsset,error:voiceError}=await db.from("studio_assets").select("id")
        .eq("user_id",job.user_id).eq("project_id",job.project_id)
        .eq("bucket_id",bucket).eq("object_path",timeline.voicePath).eq("kind","audio").maybeSingle();
      if(voiceError||!voiceAsset)throw new Error("VOICE_REFERENCE_NOT_OWNED");
      voiceFile=path.join(folder,"voice"+path.extname(timeline.voicePath).toLowerCase());
      await downloadObject(db,timeline.voicePath,voiceFile,25_000_000);
    }
    const imageFiles=[];
    for(let i=0;i<timeline.images.length;i++){
      const layer=timeline.images[i];
      const {data:asset,error:assetError}=await db.from("studio_assets").select("id")
        .eq("user_id",job.user_id).eq("project_id",job.project_id)
        .eq("bucket_id",bucket).eq("object_path",layer.path).eq("kind","image").maybeSingle();
      if(assetError||!asset)throw new Error("IMAGE_REFERENCE_NOT_OWNED");
      const filename=path.join(folder,"image-"+i+path.extname(layer.path).toLowerCase());
      await downloadObject(db,layer.path,filename,10_000_000);
      imageFiles.push(filename);
    }
    const output=path.join(folder,"output.mp4");
    await composeMp4({ffmpeg,ffprobe,timeline,sourceFiles,musicFile,voiceFile,imageFiles,dir:folder,output});
    const objectPath=job.user_id+"/"+job.project_id+"/renders/"+job.id+".mp4";
    const bytes=await readFile(output);
    const {error:uploadError}=await db.storage.from(bucket).upload(objectPath,bytes,{
      contentType:"video/mp4",upsert:false,cacheControl:"private,max-age=0"
    });
    if(uploadError)throw new Error("MP4_UPLOAD_FAILED");
    const {data:updated,error:updateError}=await db.from("studio_render_jobs").update({
      status:"ready",output_bucket:bucket,output_path:objectPath,worker_id:null,
      lease_expires_at:null,updated_at:new Date().toISOString(),finished_at:new Date().toISOString(),
      error_code:null
    }).eq("id",job.id).eq("status","processing").eq("worker_id",workerId).select("id").maybeSingle();
    if(updateError||!updated) {
      await db.storage.from(bucket).remove([objectPath]);
      throw new Error("JOB_LEASE_LOST");
    }
    process.stdout.write("Studio MP4 ready: "+job.id+"\n");
  } catch(caught) {
    const label=caught instanceof Error?caught.message:"MP4_WORKER_FAILED";
    const code=/^[A-Z_0-9]{3,64}$/.test(label)?label:"MP4_WORKER_FAILED";
    await db.from("studio_render_jobs").update({
      status:job.attempt_count>=job.max_attempts?"failed":"queued",
      error_code:code,worker_id:null,lease_expires_at:null,
      updated_at:new Date().toISOString(),
      finished_at:job.attempt_count>=job.max_attempts?new Date().toISOString():null
    }).eq("id",job.id).eq("status","processing").eq("worker_id",workerId);
    process.stderr.write("Studio MP4 job failed: "+job.id+" ("+code+")\n");
  } finally {
    clearInterval(heartbeat);
    if(folder)await rm(folder,{recursive:true,force:true}).catch(()=>{});
  }
}
async function checkConnection(db) {
  execFileSync(ffmpeg,["-version"],{stdio:"ignore",timeout:10000});
  execFileSync(ffprobe,["-version"],{stdio:"ignore",timeout:10000});
  for(const table of ["studio_render_jobs","studio_timeline_versions","studio_assets"]){
    const {error}=await db.from(table).select("id",{head:true}).limit(1);
    if(error)throw new Error("SUPABASE_TABLE_CHECK_FAILED:"+table);
  }
  const {data,error}=await db.storage.getBucket(bucket);
  if(error||!data||data.public)throw new Error("PRIVATE_BUCKET_CHECK_FAILED");
}
async function runConnectionCheck(){
  const db=makeDb();
  await checkConnection(db);
  process.stdout.write("STUDIO_WORKER_PREFLIGHT_OK: FFmpeg, FFprobe, tables and private bucket verified; queue disabled.\n");
  const server=createServer((req,res)=>{
    if(req.method!=="GET"||req.url!=="/health"){res.writeHead(404);res.end();return;}
    res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});
    res.end(JSON.stringify({ok:true,mode:"preflight",queueEnabled:false}));
  });
  server.listen(Number(process.env.PORT||8080),"0.0.0.0");
  for(const signal of ["SIGTERM","SIGINT"])process.once(signal,()=>server.close(()=>process.exit(0)));
}
export async function runWorker({once=false}={}) {
  const db=makeDb();
  process.stdout.write("Studio MP4 worker running; server-side jobs only.\n");
  do{
    await recoverExpired(db);
    const job=await claimNext(db);
    if(job)await processJob(db,job);
    else if(!once)await wait(8000);
  }while(!once);
}
if(process.argv[1] && path.resolve(process.argv[1])===new URL(import.meta.url).pathname){
  (process.argv.includes("--preflight")?runConnectionCheck():runWorker({once:process.argv.includes("--once")})).catch(error=>{
    process.stderr.write("Worker cannot start: "+(error instanceof Error?error.message:"unknown")+"\n");
    process.exitCode=1;
  });
}
