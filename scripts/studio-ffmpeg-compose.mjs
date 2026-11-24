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
    const geometry={};
    for(const key of ["cropLeft","cropRight","cropTop","cropBottom","panX","panY"]){
      const value=item[key]??0,pan=key.startsWith("pan");
      if(!Number.isFinite(value)||value<(pan?-1:0)||value>(pan?1:.4))throw new Error("CLIP_GEOMETRY_INVALID_"+index);
      geometry[key]=value;
    }
    return {path:item.path,start,end,rotation,speed,zoom,gain,...geometry,flipX:item.flipX===true,flipY:item.flipY===true,
      seconds:Math.round((end-start)/speed*1000)/1000};
  });
  if(clips.reduce((n,c)=>n+c.seconds,0)>1200)throw new Error("TIMELINE_TOO_LONG");
  const musicPath=typeof timeline.musicPath==="string"?timeline.musicPath:null;
  if(musicPath&&(!musicPath.startsWith(root)||!/^[-\w/]+\.(?:mp3|m4a|wav|ogg)$/i.test(musicPath)))
    throw new Error("MUSIC_PATH_INVALID");
  const transitionStyle=timeline.transitionStyle??"black",transitionDuration=timeline.transitionDuration??.4;
  if(!["black","crossfade"].includes(transitionStyle)||!Number.isFinite(transitionDuration)||transitionDuration<.1||transitionDuration>2)throw new Error("MP4_TRANSITION_NOT_SUPPORTED");
  const voicePath=typeof timeline.voicePath==="string"?timeline.voicePath:null;
  if(voicePath&&(!voicePath.startsWith(root)||!/^[-\w/]+\.(?:mp3|m4a|wav|ogg|webm)$/i.test(voicePath)))throw new Error("VOICE_PATH_INVALID");
  const voiceStart=timeline.voiceStart??0,voiceVolume=timeline.voiceVolume??1;
  if(!Number.isFinite(voiceStart)||voiceStart<0||voiceStart>1200||!Number.isFinite(voiceVolume)||voiceVolume<0||voiceVolume>1)throw new Error("VOICE_SETTINGS_INVALID");
  const imageLayers=timeline.imageLayers??[];
  if(!Array.isArray(imageLayers)||imageLayers.length>8)throw new Error("IMAGE_LAYERS_INVALID");
  const total=clips.reduce((n,c)=>n+c.seconds,0);
  const validGeometry=k=>k&&["x","y","size","opacity"].every(axis=>Number.isFinite(k[axis])&&k[axis]>=(axis==="size"?.05:0)&&k[axis]<=1);
  const images=imageLayers.map((l,i)=>{
    if(!l||typeof l.path!=="string"||!l.path.startsWith(root)||!/^[-\w/]+\.(png|jpe?g|webp)$/i.test(l.path)||!validGeometry(l)||!Number.isFinite(l.start)||!Number.isFinite(l.end)||l.start<0||l.end<=l.start||l.end>total+.05)throw new Error("IMAGE_LAYER_INVALID_"+i);
    const keys=l.keyframes??[];
    if(!Array.isArray(keys)||keys.length>32||keys.some(k=>!validGeometry(k)||!Number.isFinite(k.at)||k.at<0||k.at>l.end-l.start+.05))throw new Error("IMAGE_KEYFRAMES_INVALID_"+i);
    return {...l,keyframes:keys};
  });
  const duckLevel=timeline.duckLevel??.25;
  if(!Number.isFinite(duckLevel)||duckLevel<0||duckLevel>1)throw new Error("DUCK_LEVEL_INVALID");
  const aiDenoise=timeline.aiDenoise===true;
  return {clips,musicPath,voicePath,voiceStart,voiceVolume,images,width,height,aiDenoise,audioDucking:timeline.audioDucking===true,duckLevel,audioCompressor:timeline.audioCompressor===true,lowCut:timeline.lowCut===true,transitionStyle,transitionDuration,noiseReduction:timeline.noiseReduction===true,framing:timeline.framing==="blur"?"blur":timeline.framing==="cover"?"cover":"contain",includeAudio:timeline.includeAudio!==false,
    musicVolume:Math.max(0,Math.min(1,Number(timeline.musicVolume)||0)),
    fadeBetweenClips:Boolean(timeline.fadeBetweenClips)};
}
/** sourceFiles must have the same order as validated clips and be worker-owned temp files. */
export async function composeMp4({ffmpeg="ffmpeg",ffprobe="ffprobe",timeline,sourceFiles,musicFile=null,voiceFile=null,imageFiles=[],dir,output}) {
  if(sourceFiles.length!==timeline.clips.length||Boolean(timeline.voicePath)!==Boolean(voiceFile))throw new Error("INPUT_COUNT_MISMATCH");
  let neuralFilter="";
  if(timeline.aiDenoise){
    const model=process.env.STUDIO_RNNOISE_MODEL;
    if(!model||!/^\/[a-zA-Z0-9_./-]+$/.test(model))throw new Error("AI_DENOISE_MODEL_NOT_CONFIGURED");
    try{const info=await stat(model);if(!info.isFile()||info.size===0)throw Error("invalid");}catch{throw new Error("AI_DENOISE_MODEL_NOT_CONFIGURED");}
    neuralFilter="aresample=48000,arnndn=m="+model+",";
  }
  const cleanAudio=(timeline.lowCut?"highpass=f=80,":"")+(neuralFilter||(timeline.noiseReduction?"afftdn=nr=12:nf=-40,":""))+(timeline.audioCompressor?"acompressor=threshold=0.1:ratio=4:attack=5:release=200,":"");
  const segments=[];
  for(let index=0;index<timeline.clips.length;index++){
    const c=timeline.clips[index],input=sourceFiles[index];
    const hasAudio=timeline.includeAudio&&await mediaHasAudio(ffprobe,input);
    const segment=path.join(dir,"segment-"+index+".mp4");
    const speed=c.speed??1,zoom=c.zoom??1,gain=c.gain??1;
    const transforms=["trim=duration="+(c.end-c.start),"setpts=(PTS-STARTPTS)/"+speed];
    const left=c.cropLeft??0,right=c.cropRight??0,top=c.cropTop??0,bottom=c.cropBottom??0;
    const panX=c.panX??0,panY=c.panY??0;
    if(left||right||top||bottom)transforms.push("crop=w=max(2\\,trunc(iw*"+(1-left-right)+"/2)*2):h=max(2\\,trunc(ih*"+(1-top-bottom)+"/2)*2):x=trunc(iw*"+left+"/2)*2:y=trunc(ih*"+top+"/2)*2");
    if(c.flipX)transforms.push("hflip");
    if(c.flipY)transforms.push("vflip");
    if(c.rotation===90)transforms.push("transpose=clock");
    if(c.rotation===180)transforms.push("hflip","vflip");
    if(c.rotation===270)transforms.push("transpose=cclock");
    const w=timeline.width,h=timeline.height;
    const fit=["scale="+w+":"+h+":force_original_aspect_ratio="+(timeline.framing==="cover"?"increase":"decrease")+":force_divisible_by=2"];
    const foregroundZoom=zoom===1?[]:["scale=max(2\\,trunc(iw*"+zoom+"/2)*2):max(2\\,trunc(ih*"+zoom+"/2)*2)"];
    const x="(W-w)/2+"+(panX*w/2),y="(H-h)/2+"+(panY*h/2);
    const finish=["setsar=1","fps=30"];
    const fadeSeconds=Math.min(0.2,c.seconds/4);
    if(timeline.fadeBetweenClips&&timeline.transitionStyle!=="crossfade"&&c.seconds>0.8){
      if(index>0)finish.push("fade=t=in:st=0:d="+fadeSeconds);
      if(index<timeline.clips.length-1)finish.push("fade=t=out:st="+(c.seconds-fadeSeconds)+":d="+fadeSeconds);
    }
    const args=["-hide_banner","-loglevel","error","-nostdin","-y",
      "-ss",String(c.start),"-i",input];
    if(!hasAudio)args.push("-f","lavfi","-i","anullsrc=r=48000:cl=stereo");
    // Both background and foreground derive from the trimmed stream, so
    // positioning can expose background without changing the output dimensions.
    const background=timeline.framing==="blur"
      ?"scale="+w+":"+h+":force_original_aspect_ratio=increase,crop="+w+":"+h+",boxblur=luma_radius=12:luma_power=2,setsar=1"
      :"scale="+w+":"+h+",setsar=1,drawbox=x=0:y=0:w=iw:h=ih:color=black:t=fill";
    const graph="[0:v:0]"+transforms.slice(0,2).join(",")+",split=2[bg][fg];[bg]"+background+"[back];[fg]"+transforms.slice(2).concat(fit,foregroundZoom,["setsar=1"]).join(",")+"[front];[back][front]overlay=x="+x+":y="+y+":shortest=1,"+finish.join(",")+"[v]";
    args.push("-filter_complex_threads","1","-filter_complex",graph,"-map","[v]");
    args.push("-map",hasAudio?"0:a:0":"1:a:0",
      "-af",(hasAudio?"atrim=duration="+(c.end-c.start)+",asetpts=PTS-STARTPTS,"+cleanAudio+"atempo="+speed+",volume="+gain+",":"")+"aresample=48000,apad,atrim=0:"+c.seconds+",asetpts=PTS-STARTPTS",
      "-c:v","libx264","-preset","veryfast","-crf","23","-pix_fmt","yuv420p",
      "-r","30","-c:a","aac","-b:a","128k","-ar","48000","-ac","2",
      "-t",String(c.seconds),"-movflags","+faststart",segment);
    await runFfmpeg(ffmpeg,args);
    segments.push(segment);
  }
  const concat=path.join(dir,"concat.txt");
  await writeFile(concat,segments.map(x=>"file '"+x.replaceAll("'","'\\''")+"'").join("\n")+"\n");
  const merged=path.join(dir,"merged-video.mp4");
  let outputDuration=timeline.clips.reduce((n,c)=>n+c.seconds,0);
  if(timeline.fadeBetweenClips&&timeline.transitionStyle==="crossfade"&&segments.length>1){
    let previous=segments[0],elapsed=timeline.clips[0].seconds;
    for(let i=1;i<segments.length;i++){
      const overlap=Math.min(timeline.transitionDuration??.4,timeline.clips[i-1].seconds/3,timeline.clips[i].seconds/3);
      const next=i===segments.length-1?merged:path.join(dir,"crossfade-"+i+".mp4");
      const graph="[0:v]settb=AVTB,setpts=PTS-STARTPTS[a];[1:v]settb=AVTB,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration="+overlap+":offset="+(elapsed-overlap)+"[v];[0:a][1:a]acrossfade=d="+overlap+":c1=tri:c2=tri[audio]";
      await runFfmpeg(ffmpeg,["-hide_banner","-loglevel","error","-nostdin","-y","-i",previous,"-i",segments[i],"-filter_complex_threads","1","-filter_complex",graph,"-map","[v]","-map","[audio]","-c:v","libx264","-pix_fmt","yuv420p","-c:a","aac","-movflags","+faststart",next]);
      previous=next;elapsed+=timeline.clips[i].seconds-overlap;
    }
    outputDuration=elapsed;
  }else await runFfmpeg(ffmpeg,["-hide_banner","-loglevel","error","-nostdin","-y",
    "-f","concat","-safe","0","-i",concat,"-c","copy","-movflags","+faststart",merged]);
  if(imageFiles.length!==(timeline.images||[]).length)throw new Error("IMAGE_INPUT_COUNT_MISMATCH");
  let visual=merged;
  if(imageFiles.length){
    visual=path.join(dir,"layered-video.mp4");
    await renderImageLayers({ffmpeg,ffprobe,timeline,input:merged,imageFiles,output:visual,duration:outputDuration});
  }
  if(musicFile||voiceFile){
    const args=["-hide_banner","-loglevel","error","-nostdin","-y","-i",visual];
    const graph=["[0:a]aresample=48000,aformat=channel_layouts=stereo[base]"];
    const streams=["[base]"];let index=1;
    const duck=timeline.audioDucking&&musicFile&&voiceFile&&timeline.voiceVolume>0;
    if(musicFile){
      args.push("-stream_loop","-1","-i",musicFile);
      graph.push("["+(index++)+":a]aresample=48000,aformat=channel_layouts=stereo,volume="+timeline.musicVolume+"[music]");
      if(!duck)streams.push("[music]");
    }
    if(voiceFile){
      args.push("-i",voiceFile);
      const delay=Math.round(timeline.voiceStart*1000);
      graph.push("["+(index++)+":a]aresample=48000,aformat=channel_layouts=stereo,"+cleanAudio+"volume="+timeline.voiceVolume+",adelay="+delay+":all=1,apad[voice]");
      if(duck){graph.push("[voice]asplit=2[side][spoken]");graph.push("[music][side]sidechaincompress=threshold=0.025:ratio="+(1+19*(1-timeline.duckLevel))+":attack=20:release=250[ducked]");streams.push("[ducked]","[spoken]");}else streams.push("[voice]");
    }
    graph.push(streams.join("")+"amix=inputs="+streams.length+":duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[a]");
    args.push("-filter_complex_threads","1","-filter_complex",graph.join(";"),"-map","0:v:0","-map","[a]","-c:v","copy","-c:a","aac","-b:a","160k","-t",String(outputDuration),"-movflags","+faststart",output);
    await runFfmpeg(ffmpeg,args);
  }else{
    await runFfmpeg(ffmpeg,["-hide_banner","-loglevel","error","-nostdin","-y","-i",visual,
      "-c","copy","-movflags","+faststart",output]);
  }
  const size=(await stat(output)).size;
  if(!size||size>100_000_000)throw new Error("MP4_OUTPUT_SIZE_INVALID");
  return {bytes:size,durationSeconds:outputDuration};
}

// Overlay position and size are interpolated in output timeline seconds.
// A full-frame transparent RGBA layer preserves the PNG alpha channel.
function keyExpression(layer,axis,time){
  const byTime=new Map([[0,layer[axis]]]);
  for(const k of layer.keyframes||[])byTime.set(k.at,k[axis]);
  const keys=[...byTime].sort((a,b)=>a[0]-b[0]);
  let expr=String(keys.at(-1)[1]);
  for(let i=keys.length-2;i>=0;i--){
    const [a,p]=keys[i],[b,q]=keys[i+1];
    expr="if(lt("+time+","+b+"),"+p+"+("+q+"-"+p+")*clip(("+time+"-"+a+")/"+(b-a)+",0,1),"+expr+")";
  }
  return expr;
}
async function renderImageLayers({ffmpeg,ffprobe,timeline,input,imageFiles,output,duration}){
  const args=["-hide_banner","-loglevel","error","-nostdin","-y","-i",input];
  for(const file of imageFiles)args.push("-loop","1","-framerate","30","-i",file);
  const graph=[];
  let prev="[0:v]";
  for(let i=0;i<imageFiles.length;i++){
    const l=timeline.images[i],w=timeline.width,h=timeline.height;
    const local="(t-"+l.start+")";
    const size=keyExpression(l,"size",local),x=keyExpression(l,"x",local),y=keyExpression(l,"y",local);
    // geq evaluates alpha per frame using T (seconds), retaining source transparency.
    const alpha=keyExpression(l,"opacity","(T-"+l.start+")");
    graph.push("["+(i+1)+":v]format=rgba,scale=w='max(2,trunc(min("+w+"*("+size+"),"+h+"*("+size+")*iw/ih)/2)*2)':h=-2:eval=frame,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='alpha(X,Y)*("+alpha+")'[layer"+i+"]");
    graph.push(prev+"[layer"+i+"]overlay=x='W*("+x+")-w/2':y='H*("+y+")-h/2':enable='gte(t,"+l.start+")*lt(t,"+Math.min(l.end,duration)+")':eval=frame:shortest=1[v"+i+"]");
    prev="[v"+i+"]";
  }
  args.push("-filter_complex_threads","1","-filter_complex",graph.join(";"),"-map",prev,"-map","0:a:0","-c:v","libx264","-preset","veryfast","-pix_fmt","yuv420p","-c:a","copy","-t",String(duration),"-movflags","+faststart",output);
  await runFfmpeg(ffmpeg,args);
}
