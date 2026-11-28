"use strict";
const assert=require("node:assert/strict"),{execFileSync}=require("node:child_process");
const {enabled,inspect,digest}=require("./model-media-worker.cjs");
const owner="11111111-1111-4111-8111-111111111111",id="22222222-2222-4222-8222-222222222222";
function row(b,kind,mime){return {id,user_id:owner,model_id:"magi-2",kind,mime,bytes:b.length,object_key:owner+"/"+id+"/original",state:"quarantined",sha256:digest(b)}}
(async()=>{
 assert.equal(enabled({}),false);
 assert.equal(enabled({MODEL_MEDIA_WORKER_ENABLED:"true",MODEL_MEDIA_TEST_DATABASE_URL:"https://wrong.example"}),false);
 const audio=execFileSync("ffmpeg",["-v","error","-f","lavfi","-i","sine=frequency=440:duration=3","-c:a","pcm_s16le","-f","wav","pipe:1"],{maxBuffer:3000000});
 // A pipe-written WAV has indefinite length metadata; produce a seekable fixture instead.
 const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"model-media-smoke-"));
 try{
 const wav=path.join(dir,"sample.wav"),mp4=path.join(dir,"sample.mp4");
 execFileSync("ffmpeg",["-v","error","-f","lavfi","-i","sine=frequency=440:duration=3","-c:a","pcm_s16le",wav]);
 execFileSync("ffmpeg",["-v","error","-f","lavfi","-i","color=c=blue:s=320x240:d=3","-c:v","libx264",mp4]);
 for(const [b,kind,mime] of [[fs.readFileSync(wav),"audio","audio/wav"],[fs.readFileSync(mp4),"video","video/mp4"]]){
 assert.equal((await inspect(row(b,kind,mime),b,owner)).duration_ms,3000);
 await assert.rejects(inspect({...row(b,kind,mime),sha256:"0".repeat(64)},b,owner));
 }
 const image=await require("sharp")({create:{width:64,height:64,channels:3,background:"#224488"}}).jpeg().toBuffer();
 assert.equal((await inspect(row(image,"image","image/jpeg"),image,owner)).duration_ms,null);
 await assert.rejects(inspect(row(image,"image","image/png"),image,owner));
 await assert.rejects(inspect({...row(image,"image","image/jpeg"),user_id:id},image,owner));
 assert(audio.length>0);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
 console.log("PASS isolated media worker fixture validation; no network or billing");
})().catch(e=>{console.error(e.message);process.exitCode=1});
