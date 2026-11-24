// Dedicated Studio V2 MP4 worker media engine. Does not run in Vercel serverless.
import { spawn } from "node:child_process";
import { writeFile, stat } from "node:fs/promises";
import path from "node:path";

export async function runFfmpeg(binary, args, timeoutMs = 900_000) {
  return new Promise((resolve,reject)=>{
    const proc=spawn(binary,args,{shell:false,windowsHide:true,stdio:["ignore","ignore","pipe"]});
    let stderr="";
    const timer=setTimeout(()=>{proc.kill("SIGKILL")},timeoutMs);
    proc.stderr.on("data", chunk=>{stderr=(stderr+String(chunk)).slice(-8000)});
    proc.once("error", error=>{clearTimeout(timer);reject(error)});
    proc.once("close", code=>{
      clearTimeout(timer);
      if(code===0)resolve();
      else reject(new Error("FFmpeg exited with "+code+": "+stderr.slice(-1200)));
    });
  });
}
export async function mediaHasAudio(ffprobe, filename) {
  try {
    const output=await new Promise((resolve,reject)=>{
      const proc=spawn(ffprobe,["-v","error","-select_streams","a:0","-show_entries","stream=index","-of","csv=p=0",filename],{shell:false});
      let value="";
      proc.stdout.on("data",c=>{value+=String(c)});
      proc.once("error",reject);
      proc.once("close",code=>code===0?resolve(value):reject(new Error("ffprobe failed")));
    });
    return String(output).trim().length>0;
  }catch{return false}
}
export function validateTimeline(timeline, userId, projectId) {
  if(!timeline||typeof timeline!=="object"||!Array.isArray(timeline.clips)
    ||timeline.clips.length<1||timeline.clips.length>30)
    throw new Error("TIMELINE_CLIPS_INVALID");
  const ratio=["16:9","9:16","1:1"].includes(timeline.ratio)?timeline.ratio:"16:9";
  const resolution=[480,720,1080].includes(timeline.resolution)?timeline.resolution:720;
  const width=ratio==="9:16"?Math.round(resolution*9/16/2)*2:
    ratio==="1:1"?resolution:Math.round(resolution*16/9/2)*2;
  const height=ratio==="9:16"?resolution:ratio==="1:1"?resolution:resolution;
  // The first MP4 renderer supports source audio and soundtrack, not text
  // overlays. Explicitly reject unsupported options rather than discarding them.
  if((Array.isArray(timeline.captionCues)&&timeline.captionCues.length)
    ||(typeof timeline.titleOverlay==="string"&&timeline.titleOverlay.trim()))
    throw new Error("MP4_TEXT_OVERLAYS_NOT_SUPPORTED_YET");
  const root=userId+"/"+projectId+"/";
  const clips=timeline.clips.map((item,index)=>{
    if(!item||typeof item.path!=="string"||!item.path.startsWith(root)
      ||!/^[-\w/]+\.(?:mp4|webm|mov|m4v)$/i.test(item.path))
      throw new Error("CLIP_PATH_INVALID_"+index);
    const start=Number(item.start),end=Number(item.end),duration=Number(item.duration);
    if(!Number.isFinite(start)||!Number.isFinite(end)||!Number.isFinite(duration)
      ||start<0||end<=start||duration<=0||end>duration+0.05||end-start>600)
      throw new Error("CLIP_TRIM_INVALID_"+index);
    const rotation=item.rotation??0, speed=item.speed??1, zoom=item.zoom??1, gain=item.gain??1;
    if(![0,90,180,270].includes(rotation)||![.5,.75,1,1.25,1.5,2].includes(speed)
      ||!Number.isFinite(zoom)||zoom<1||zoom>3||!Number.isFinite(gain)||gain<0||gain>1
      ||(item.flipX!==undefined&&typeof item.flipX!=="boolean")||(item.flipY!==undefined&&typeof item.flipY!=="boolean"))
      throw new Error("CLIP_ADJUSTMENTS_INVALID_"+index);
    return {path:item.path,start,end,rotation,speed,zoom,gain,flipX:item.flipX===true,flipY:item.flipY===true,
      seconds:Math.round((end-start)/speed*1000)/1000};
  });
  if(clips.reduce((n,c)=>n+c.seconds,0)>1200)throw new Error("TIMELINE_TOO_LONG");
  const musicPath=typeof timeline.musicPath==="string"?timeline.musicPath:null;
  if(musicPath&&(!musicPath.startsWith(root)||!/^[-\w/]+\.(?:mp3|m4a|wav|ogg)$/i.test(musicPath)))
    throw new Error("MUSIC_PATH_INVALID");
  return {clips,musicPath,width,height,framing:timeline.framing==="blur"?"blur":timeline.framing==="cover"?"cover":"contain",includeAudio:timeline.includeAudio!==false,
    musicVolume:Math.max(0,Math.min(1,Number(timeline.musicVolume)||0)),
    fadeBetweenClips:Boolean(timeline.fadeBetweenClips)};
}
/** sourceFiles must have the same order as validated clips and be worker-owned temp files. */
export async function composeMp4({ffmpeg="ffmpeg",ffprobe="ffprobe",timeline,sourceFiles,musicFile=null,dir,output}) {
  if(sourceFiles.length!==timeline.clips.length)throw new Error("INPUT_COUNT_MISMATCH");
  const segments=[];
  for(let index=0;index<timeline.clips.length;index++){
    const c=timeline.clips[index],input=sourceFiles[index];
    const hasAudio=timeline.includeAudio&&await mediaHasAudio(ffprobe,input);
    const segment=path.join(dir,"segment-"+index+".mp4");
    const speed=c.speed??1,zoom=c.zoom??1,gain=c.gain??1;
    const transforms=["trim=duration="+(c.end-c.start),"setpts=(PTS-STARTPTS)/"+speed];
    if(c.flipX)transforms.push("hflip");
    if(c.flipY)transforms.push("vflip");
    if(c.rotation===90)transforms.push("transpose=clock");
    if(c.rotation===180)transforms.push("hflip","vflip");
    if(c.rotation===270)transforms.push("transpose=cclock");
    const vf=(timeline.framing!=="cover"
      ?["scale="+timeline.width+":"+timeline.height+":force_original_aspect_ratio=decrease",
        "pad="+timeline.width+":"+timeline.height+":(ow-iw)/2:(oh-ih)/2"]
      :["scale="+timeline.width+":"+timeline.height+":force_original_aspect_ratio=increase",
        "crop="+timeline.width+":"+timeline.height]).concat(["setsar=1","fps=30"]);
    // Zoom after fitting the foreground; crop only the zoomed central region.
    const foregroundZoom=zoom===1?[]:["scale=trunc(iw*"+zoom+"/2)*2:trunc(ih*"+zoom+"/2)*2",
      "crop=min(iw\\,"+timeline.width+"):min(ih\\,"+timeline.height+")"];
    const fit=timeline.framing==="cover"?vf.slice(0,2):vf.slice(0,1);
    const finish=["setsar=1","fps=30"];
    const fadeSeconds=Math.min(0.2,c.seconds/4);
    if(timeline.fadeBetweenClips&&c.seconds>0.8){
      if(index>0)finish.push("fade=t=in:st=0:d="+fadeSeconds);
      if(index<timeline.clips.length-1)finish.push("fade=t=out:st="+(c.seconds-fadeSeconds)+":d="+fadeSeconds);
    }
    const args=["-hide_banner","-loglevel","error","-nostdin","-y",
      "-ss",String(c.start),"-i",input];
    if(!hasAudio)args.push("-f","lavfi","-i","anullsrc=r=48000:cl=stereo");
    if(timeline.framing==="blur"){
      const w=timeline.width,h=timeline.height;
      const graph="[0:v:0]"+transforms.slice(0,2).join(",")+",split=2[bg][fg];[bg]scale="+w+":"+h+":force_original_aspect_ratio=increase,crop="+w+":"+h+",boxblur=luma_radius=12:luma_power=2,setsar=1[back];[fg]"+transforms.slice(2).concat(["scale="+w+":"+h+":force_original_aspect_ratio=decrease:force_divisible_by=2"],foregroundZoom,["setsar=1"]).join(",")+"[front];[back][front]overlay=(W-w)/2:(H-h)/2:shortest=1,"+finish.join(",")+"[v]";
      args.push("-filter_complex",graph,"-map","[v]");
    }else{
      const filters=transforms.concat(fit,foregroundZoom,timeline.framing==="cover"?[]:[vf[1]],finish);
      args.push("-map","0:v:0","-vf",filters.join(","));
    }
    args.push("-map",hasAudio?"0:a:0":"1:a:0",
      "-af",(hasAudio?"atrim=duration="+(c.end-c.start)+",asetpts=PTS-STARTPTS,atempo="+speed+",volume="+gain+",":"")+"aresample=48000,apad,atrim=0:"+c.seconds+",asetpts=PTS-STARTPTS",
      "-c:v","libx264","-preset","veryfast","-crf","23","-pix_fmt","yuv420p",
      "-r","30","-c:a","aac","-b:a","128k","-ar","48000","-ac","2",
      "-t",String(c.seconds),"-movflags","+faststart",segment);
    await runFfmpeg(ffmpeg,args);
    segments.push(segment);
  }
  const concat=path.join(dir,"concat.txt");
  await writeFile(concat,segments.map(x=>"file '"+x.replaceAll("'","'\\''")+"'").join("\n")+"\n");
  const merged=path.join(dir,"merged-video.mp4");
  await runFfmpeg(ffmpeg,["-hide_banner","-loglevel","error","-nostdin","-y",
    "-f","concat","-safe","0","-i",concat,"-c","copy","-movflags","+faststart",merged]);
  if(musicFile) {
    await runFfmpeg(ffmpeg,["-hide_banner","-loglevel","error","-nostdin","-y",
      "-i",merged,"-stream_loop","-1","-i",musicFile,
      "-filter_complex","[1:a]volume="+timeline.musicVolume+",aresample=48000[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]",
      "-map","0:v:0","-map","[a]","-c:v","copy","-c:a","aac","-b:a","160k",
      "-movflags","+faststart",output]);
  }else{
    await runFfmpeg(ffmpeg,["-hide_banner","-loglevel","error","-nostdin","-y","-i",merged,
      "-c","copy","-movflags","+faststart",output]);
  }
  const size=(await stat(output)).size;
  if(!size||size>100_000_000)throw new Error("MP4_OUTPUT_SIZE_INVALID");
  return {bytes:size,durationSeconds:timeline.clips.reduce((n,c)=>n+c.seconds,0)};
}
