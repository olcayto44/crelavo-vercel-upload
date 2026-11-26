import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { composeMp4, validateTimeline, runFfmpeg } from "./studio-ffmpeg-compose.mjs";
const dir=await mkdtemp(path.join(os.tmpdir(),"studio-test-"));
const ffmpeg=process.env.FFMPEG_PATH||"ffmpeg",ffprobe=process.env.FFPROBE_PATH||"ffprobe";
const file=n=>path.join(dir,n);
const gen=(args)=>runFfmpeg(ffmpeg,["-hide_banner","-loglevel","error","-y",...args]);
try {
 for(const [name,color,freq] of [["a","red",440],["b","blue",660]]){
  await gen(["-f","lavfi","-i","color=c="+color+":s=320x240:r=30:d=2","-f","lavfi","-i","sine=frequency="+freq+":sample_rate=48000:duration=2","-c:v","libx264","-threads","1","-pix_fmt","yuv420p","-c:a","aac","-shortest",file(name+".mp4")]);
 }
 await gen(["-f","lavfi","-i","sine=frequency=880:duration=1:sample_rate=48000",file("voice.wav")]);
 await gen(["-f","lavfi","-i","sine=frequency=220:duration=1:sample_rate=48000",file("music.wav")]);
 await gen(["-f","lavfi","-i","color=c=yellow@0.8:s=64x64,format=rgba","-frames:v","1","-threads","1",file("logo.png")]);
 const clips=["a","b"].map(n=>({path:"u/p/"+n+".mp4",start:0,end:2,duration:2}));
 const basic={clips,ratio:"16:9",resolution:480,includeAudio:true};
 const cases=[
  ["baseline",basic],
  ["portrait-text",{...basic,ratio:"9:16",fps:25,quality:"high",titleOverlay:"Crelavo Türkçe başlık",captionCues:[{start:.5,end:1.5,text:"Altyazı: şğü % : \\ {}"}]}],
  ["square-60",{...basic,ratio:"1:1",fps:60,quality:"low"}],
  ["crossfade",{...basic,fadeBetweenClips:true,transitionStyle:"crossfade",transitionDuration:.4}],
  ["audio",{...basic,musicPath:"u/p/music.wav",musicVolume:.2,voicePath:"u/p/voice.wav",voiceStart:.5,voiceVolume:.7,audioDucking:true,duckLevel:.25,audioCompressor:true,lowCut:true,noiseReduction:true}],
  ["animation",{...basic,imageLayers:[{path:"u/p/logo.png",start:0,end:3,x:.2,y:.2,size:.2,opacity:.5,keyframes:[{at:2,x:.8,y:.8,size:.35,opacity:1}]}]}]
 ];
 if(process.env.STUDIO_RNNOISE_MODEL)cases.push(["neural",{...basic,aiDenoise:true}]);
 let failures=0;
 for(const [name,raw] of cases){
  try{
   const {mkdir}=await import("node:fs/promises");const work=file(name);await mkdir(work);
   const timeline=validateTimeline(raw,"u","p"),output=path.join(work,"output.mp4"),start=performance.now();
   assert.equal(timeline.crf,raw.quality==="high"?18:raw.quality==="low"?28:23);
   const result=await composeMp4({ffmpeg,ffprobe,timeline,sourceFiles:[file("a.mp4"),file("b.mp4")],musicFile:raw.musicPath?file("music.wav"):null,voiceFile:raw.voicePath?file("voice.wav"):null,imageFiles:raw.imageLayers?[file("logo.png")]:[],dir:work,output});
   const probe=JSON.parse(execFileSync(ffprobe,["-v","error","-show_streams","-show_format","-of","json",output],{encoding:"utf8"}));
   assert(probe.streams.some(s=>s.codec_type==="video"&&s.codec_name==="h264"&&s.width===timeline.width&&s.height===timeline.height&&Math.abs(Number(s.r_frame_rate.split("/")[0])/Number(s.r_frame_rate.split("/")[1])-timeline.fps)<.01));
   assert(probe.streams.some(s=>s.codec_type==="audio"&&s.codec_name==="aac"));
   assert(Math.abs(Number(probe.format.duration)-(name==="crossfade"?3.6:4))<.25,"duration mismatch");
   if(name==="portrait-text"){
    const pixels=execFileSync(ffmpeg,["-v","error","-ss","1","-i",output,"-frames:v","1","-f","rawvideo","-pix_fmt","rgb24","-"],{maxBuffer:8_000_000});
    let brightTop=0,brightBottom=0;for(let y=0;y<timeline.height;y++)for(let x=0;x<timeline.width;x++){const j=(y*timeline.width+x)*3;if(pixels[j]>210&&pixels[j+1]>210&&pixels[j+2]>210){if(y<timeline.height*.25)brightTop++;if(y>timeline.height*.65)brightBottom++;}}
    assert(brightTop>30&&brightBottom>30,"title and subtitle must be visibly burned into output");
   }
   console.log(JSON.stringify({case:name,pass:true,bytes:result.bytes,seconds:Number(probe.format.duration),renderMs:Math.round(performance.now()-start)}));
  }catch(e){failures++;console.error(JSON.stringify({case:name,pass:false,error:String(e)}));}
 }
 if(!process.env.STUDIO_RNNOISE_MODEL)console.log("SKIP neural: model not configured");
 if(failures)process.exitCode=1;
}finally{await rm(dir,{recursive:true,force:true});}
