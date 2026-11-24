"use client";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase";
import { saveCloudTimeline, loadCloudTimeline } from "@/lib/studio-cloud-timeline";
import { addMediaRecorderWebmDuration } from "@/lib/studio-webm-duration";

type Clip = { id: string; file: File; name: string; url: string; duration: number; start: number; end: number; rotation?: number; flipX?: boolean; flipY?: boolean; zoom?: number; gain?: number; speed?: number; cropLeft?:number; cropRight?:number; cropTop?:number; cropBottom?:number; panX?:number; panY?:number };
const accept = "video/mp4,video/webm,video/quicktime,video/x-m4v";
const sec = (n: number) => Number.isFinite(n) ? n.toFixed(1) + "s" : "—";
const timecode=(n:number)=>{const s=Math.max(0,Math.floor(Number.isFinite(n)?n:0));return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(v=>String(v).padStart(2,"0")).join(":")};
function StudioIcon({name}:{name:string}){const paths:Record<string,string>={Media:"M3 7h6l2 2h10v11H3z M3 7V4h7l2 3",Text:"M4 5h16 M12 5v14 M8 19h8",Images:"M3 4h18v16H3z M3 16l5-5 4 4 3-3 6 6 M16 8h.01",Transitions:"M3 5l9 7-9 7z M21 5l-9 7 9 7z",Audio:"M9 18V5l11-2v13 M9 18a3 2 0 1 1-6 0 3 2 0 0 1 6 0 M20 16a3 2 0 1 1-6 0 3 2 0 0 1 6 0",Layers:"M12 3l10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5",Upload:"M12 16V3 M7 8l5-5 5 5 M4 15v6h16v-6",Play:"M8 4l13 8-13 8z",Pause:"M8 5v14 M16 5v14",Previous:"M5 5v14 M19 5L7 12l12 7z",Next:"M19 5v14 M5 5l12 7-12 7z",Fullscreen:"M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5"};return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]||paths.Media}/></svg>}

const VIDEO_PROJECT_DB = "crelavo-studio-local-video-project-v1";
type CaptionCue = { start: number; end: number; text: string };
type ImageKeyframe={at:number;x:number;y:number;size:number;opacity:number};
type ImageLayer={keyframes?:ImageKeyframe[];id:string;file:File;start:number;end:number;x:number;y:number;size:number;opacity:number};
type TransitionStyle="black"|"white"|"wipe-left"|"wipe-right"|"zoom"|"slide"|"dissolve"|"crossfade";
type SavedVideoProject = { aiDenoise?:boolean; noiseReduction?:boolean; audioDucking?:boolean; duckLevel?:number; audioCompressor?:boolean; lowCut?:boolean; transitionStyle?:TransitionStyle; transitionDuration?:number; imageLayers?:ImageLayer[]; voiceover?:File|null; voiceStart?:number; voiceVolume?:number; voiceLength?:number; id: string; owner: string; savedAt: number; clips: Array<Omit<Clip, "url">>; ratio: "16:9" | "9:16" | "1:1"; resolution: number; fps?:number; quality?:string; includeAudio: boolean; captionCues?: CaptionCue[]; titleOverlay?: string; backgroundMusic?: File | null; musicVolume?: number; fadeBetweenClips?: boolean; framing?: "cover" | "contain" | "blur" };
async function projectDb() {
 return await new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open(VIDEO_PROJECT_DB,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains("projects"))db.createObjectStore("projects",{keyPath:"id"});};
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
}
async function saveProjectLocally(value: SavedVideoProject) {
 const db=await projectDb();
 await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction("projects","readwrite");
  tx.objectStore("projects").put(value);
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
 });db.close();
}
async function openProjectLocally(id: string) {
 const db=await projectDb();
 const item=await new Promise<SavedVideoProject|undefined>((resolve,reject)=>{
  const tx=db.transaction("projects","readonly");const result=tx.objectStore("projects").get(id);
  result.onsuccess=()=>resolve(result.result as SavedVideoProject|undefined);
  result.onerror=()=>reject(result.error);
 });db.close();return item;
}
/** Actual video-frame thumbnails; no fake placeholder imagery. */
function ClipThumbnail({url,start,name}:{url:string;start:number;name:string}) {
  const [frame,setFrame]=useState<string|null>(null);
  useEffect(()=>{
    let live=true;
    const video=document.createElement("video");
    video.preload="auto";video.muted=true;video.playsInline=true;
    const draw=()=>{
      if(!live||!video.videoWidth||!video.videoHeight)return;
      try{
        const canvas=document.createElement("canvas");
        canvas.width=176;canvas.height=100;
        const ctx=canvas.getContext("2d");
        if(!ctx)return;
        ctx.fillStyle="#0c0913";ctx.fillRect(0,0,canvas.width,canvas.height);
        const scale=Math.min(canvas.width/video.videoWidth,canvas.height/video.videoHeight);
        const w=video.videoWidth*scale,h=video.videoHeight*scale;
        ctx.drawImage(video,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
        setFrame(canvas.toDataURL("image/jpeg",.72));
      }catch{/* Browser codec or canvas may be unsupported; keep fallback. */}
    };
    video.onloadedmetadata=()=>{
      const at=Math.min(Math.max(0,start+.15),Math.max(0,(video.duration||1)-.05));
      if(Math.abs(video.currentTime-at)<.03)draw();
      else try{video.currentTime=at;}catch{draw();}
    };
    video.onseeked=draw;
    video.onloadeddata=draw;
    video.src=url;
    video.load();
    return()=>{live=false;video.pause();video.removeAttribute("src");video.load();};
  },[url,start]);
  return <div className="studio-timeline-thumb" aria-label={"Thumbnail for "+name}>
    {frame?<img src={frame} alt={"Frame from "+name} draggable={false}/>:<span aria-hidden="true">▶</span>}
  </div>;
}
function ClipFilmstrip({clip}:{clip:Clip}){
 const [frames,setFrames]=useState<string[]>([]);
 useEffect(()=>{
  let live=true;const video=document.createElement("video");video.muted=true;video.preload="auto";video.playsInline=true;
  const samples=Math.min(5,Math.max(2,Math.ceil((clip.end-clip.start)/3)));let index=0;const collected:string[]=[];
  const capture=()=>{if(!live||!video.videoWidth||!video.videoHeight||video.seeking||index>=samples)return;
   try{const canvas=document.createElement("canvas");canvas.width=96;canvas.height=54;const ctx=canvas.getContext("2d");if(!ctx)return;const scale=Math.min(96/video.videoWidth,54/video.videoHeight);ctx.fillStyle="#090a10";ctx.fillRect(0,0,96,54);ctx.drawImage(video,(96-video.videoWidth*scale)/2,(54-video.videoHeight*scale)/2,video.videoWidth*scale,video.videoHeight*scale);collected.push(canvas.toDataURL("image/jpeg",.65));setFrames([...collected]);index++;if(index<samples)seek();}catch{/* unsupported media remains blank */}
  };
  const seek=()=>{if(!live)return;const at=Math.min(Math.max(0,video.duration-.04),clip.start+(clip.end-clip.start)*(index+.5)/samples);if(Math.abs(video.currentTime-at)<.02&&video.readyState>=2)capture();else video.currentTime=at;};
  setFrames([]);video.onloadedmetadata=seek;video.onseeked=capture;video.src=clip.url;video.load();
  return()=>{live=false;video.onloadedmetadata=null;video.onseeked=null;video.removeAttribute("src");video.load()};
 },[clip.url,clip.start,clip.end]);
 return <span className="studio-film-frames" aria-hidden="true">{frames.map((frame,i)=><img key={i} src={frame} alt="" draggable={false}/>)}</span>;
}
function parseSrt(source: string): CaptionCue[] {
  // Strict bounded parsing: do not interpret markup or run HTML from subtitles.
  const cues: CaptionCue[] = [];
  const time = (value: string) => {
    const match = value.trim().match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/);
    if (!match) return NaN;
    return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
  };
  for (const block of source.replace(/\r/g, "").trim().split(/\n\s*\n/)) {
    const lines = block.split("\n");
    const lineIndex = lines.findIndex(line => line.includes("-->"));
    if (lineIndex < 0) continue;
    const parts = lines[lineIndex].split("-->");
    const start = time(parts[0] || ""), end = time(parts[1] || "");
    const text = lines.slice(lineIndex + 1).join(" ").replace(/<[^>]*>/g, "").trim().slice(0, 240);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end > 7200 || !text) continue;
    cues.push({ start, end, text });
    if (cues.length >= 500) break;
  }
  return cues.sort((a,b) => a.start - b.start);
}
function captionAt(cues: CaptionCue[], at: number) {
  return cues.find(cue => at >= cue.start && at < cue.end)?.text || "";
}
function paintTransition(ctx:CanvasRenderingContext2D,w:number,h:number,style:TransitionStyle,seconds:number,local:number,length:number,index:number,count:number){
  const fade=Math.min(seconds,length/3);if(fade<=0)return;
  const entering=index>0&&local<fade;
  const exiting=index<count-1&&length-local<fade;
  const amount=entering?1-Math.max(0,local)/fade:exiting?1-Math.max(0,length-local)/fade:0;
  if(amount<=0)return;
  ctx.save();
  if(style==="zoom"||style==="slide"){
    const frame=document.createElement("canvas");frame.width=w;frame.height=h;frame.getContext("2d")?.drawImage(ctx.canvas,0,0);
    ctx.fillStyle="#000";ctx.fillRect(0,0,w,h);
    if(style==="zoom"){const scale=1+amount*.2;ctx.globalAlpha=1-amount;ctx.drawImage(frame,(w-w*scale)/2,(h-h*scale)/2,w*scale,h*scale);}
    else ctx.drawImage(frame,(entering?1:-1)*w*amount,0);
  }else if(style==="dissolve"){
    ctx.fillStyle="#000";const cell=Math.max(4,Math.round(w/48));
    for(let y=0;y<h;y+=cell)for(let x=0;x<w;x+=cell){const hash=((Math.imul(x+17,73856093)^Math.imul(y+29,19349663))>>>0)/4294967296;if(hash<amount)ctx.fillRect(x,y,cell,cell);}
  }else if(style==="wipe-left"||style==="wipe-right"){
    ctx.fillStyle="#000";const revealFromLeft=style==="wipe-left"?entering:!entering;
    ctx.fillRect(revealFromLeft?w*(1-amount):0,0,w*amount,h);
  }else{ctx.globalAlpha=Math.min(1,amount);ctx.fillStyle=style==="white"?"#fff":"#000";ctx.fillRect(0,0,w,h);}
  ctx.restore();
}
function paintImageLayers(ctx:CanvasRenderingContext2D,w:number,h:number,at:number,layers:ImageLayer[],images:Map<string,ImageBitmap>){
  for(const layer of layers){
    const image=images.get(layer.id);if(!image||at<layer.start||at>=layer.end)continue;
    const keys=[{at:0,x:layer.x,y:layer.y,size:layer.size,opacity:layer.opacity},...(layer.keyframes||[])].sort((a,b)=>a.at-b.at);
    const local=at-layer.start;
    const next=keys.findIndex(k=>k.at>local),a=next<0?keys[keys.length-1]:keys[Math.max(0,next-1)],b=next<0?a:keys[next];
    const t=b.at>a.at?Math.max(0,Math.min(1,(local-a.at)/(b.at-a.at))):0;
    const lerp=(p:number,q:number)=>p+(q-p)*t;
    const size=lerp(a.size,b.size),width=Math.min(w*size,h*size*image.width/image.height),height=width*image.height/image.width;
    ctx.save();ctx.globalAlpha=lerp(a.opacity,b.opacity);ctx.drawImage(image,w*lerp(a.x,b.x)-width/2,h*lerp(a.y,b.y)-height/2,width,height);ctx.restore();
  }
}
function paintOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, text: string, bottom: boolean) {
  if (!text) return;
  ctx.save();
  const size = Math.max(15, Math.round(width / (bottom ? 28 : 25)));
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = Math.max(3, size / 7);
  ctx.strokeStyle = "rgba(0,0,0,.88)";
  ctx.fillStyle = "white";
  const words = text.split(/\s+/);
  const rows: string[] = [];
  let row = "";
  for (const word of words) {
    const next = row ? row + " " + word : word;
    if (row && ctx.measureText(next).width > width * .83) { rows.push(row); row = word; } else row = next;
  }
  if (row) rows.push(row);
  const shown = rows.slice(0,3);
  const offset = bottom ? height - size * (shown.length + 1) : size * 2;
  shown.forEach((line,i) => {
    const y = offset + i * size * 1.25;
    ctx.strokeText(line, width / 2, y, width * .9);
    ctx.fillText(line, width / 2, y, width * .9);
  });
  ctx.restore();
}
function paintBlurBackground(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, width: number, height: number) {
  const vw=video.videoWidth,vh=video.videoHeight;
  if(!vw||!vh)return;
  ctx.save();
  ctx.fillStyle="#000";ctx.fillRect(0,0,width,height);
  const scale=Math.max(width/vw,height/vh)*1.15;
  ctx.filter="blur("+Math.max(8,Math.round(height*.025))+"px)";
  ctx.drawImage(video,(width-vw*scale)/2,(height-vh*scale)/2,vw*scale,vh*scale);
  ctx.restore();
}
function cropRect(clip:Clip,w:number,h:number){
  const left=Math.max(0,Math.min(.4,clip.cropLeft||0)),right=Math.max(0,Math.min(.4,clip.cropRight||0));
  const top=Math.max(0,Math.min(.4,clip.cropTop||0)),bottom=Math.max(0,Math.min(.4,clip.cropBottom||0));
  return {x:w*left,y:h*top,w:w*(1-left-right),h:h*(1-top-bottom)};
}
function paintClip(ctx:CanvasRenderingContext2D,video:HTMLVideoElement,clip:Clip,width:number,height:number,framing:"cover"|"contain"|"blur"){
  const vw=video.videoWidth,vh=video.videoHeight;if(!vw||!vh)return;
  ctx.fillStyle="#000";ctx.fillRect(0,0,width,height);
  if(framing==="blur")paintBlurBackground(ctx,video,width,height);
  const crop=cropRect(clip,vw,vh),turn=(clip.rotation||0)%360,swap=Math.abs(turn)%180===90;
  const bw=swap?crop.h:crop.w,bh=swap?crop.w:crop.h;
  const scale = framing === "cover" ? Math.max(width / bw, height / bh) : Math.min(width / bw, height / bh);
  const renderedWidth=crop.w*scale*(clip.zoom||1),renderedHeight=crop.h*scale*(clip.zoom||1);
  ctx.save();ctx.translate(width/2+(clip.panX||0)*width/2,height/2+(clip.panY||0)*height/2);ctx.rotate(turn*Math.PI/180);
  ctx.scale(clip.flipX?-1:1,clip.flipY?-1:1);
  ctx.drawImage(video,crop.x,crop.y,crop.w,crop.h,-renderedWidth/2,-renderedHeight/2,renderedWidth,renderedHeight);ctx.restore();
}
function supportedMime() {
  if (typeof MediaRecorder === "undefined") return "";
  return ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(type => MediaRecorder.isTypeSupported(type)) || "";
}
function metadata(file: File, url: string) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    const timeout = window.setTimeout(() => { video.removeAttribute("src"); video.load(); reject(new Error("Could not read video metadata.")); }, 15000);
    video.preload = "metadata";
    video.onloadedmetadata = () => { window.clearTimeout(timeout); resolve(video.duration); video.removeAttribute("src"); video.load(); };
    video.onerror = () => { window.clearTimeout(timeout); reject(new Error("Unsupported or damaged video: " + file.name)); };
    video.src = url;
  });
}
async function seek(video: HTMLVideoElement, at: number) {
  if (Math.abs(video.currentTime - at) < .08) return;
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error("Could not seek this video.")); }, 16000);
    const cleanup = () => { window.clearTimeout(timeout); video.removeEventListener("seeked", done); video.removeEventListener("error", fail); };
    const done = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new Error("Source video failed while seeking.")); };
    video.addEventListener("seeked", done, { once: true });
    video.addEventListener("error", fail, { once: true });
    video.currentTime = at;
  });
}
export default function LocalVideoEditor({allowAnonymousLocalSave=false}:{allowAnonymousLocalSave?:boolean}={}) {
  const [studioReturnCategory,setStudioReturnCategory]=useState("video");
  useEffect(()=>{
    const candidate=new URLSearchParams(window.location.search).get("studioCategory");
    if(candidate&&/^[a-z0-9_]{1,40}$/.test(candidate))setStudioReturnCategory(candidate);
  },[]);
  const {user:authUser,openAuth}=useAuth();
  const [projectOwner,setProjectOwner] = useState("");
  const [signedIn,setSignedIn] = useState(false);
  const [projectSaving,setProjectSaving] = useState(false);
  const [inspectorTab,setInspectorTab]=useState<"clip"|"audio"|"layers"|"effects"|"export">("clip");
  const [mediaFilter,setMediaFilter]=useState<"all"|"video"|"audio"|"image">("all");
  const [mediaSearch,setMediaSearch]=useState("");
  const exportDialog=useRef<HTMLDialogElement>(null);
  const [exportFormat,setExportFormat]=useState<"mp4"|"webm">("mp4");
  const [mp4Busy,setMp4Busy]=useState(false);
  const [mp4Jobs,setMp4Jobs]=useState<Array<{id:string;status:string;error_code?:string;created_at?:string}>>([]);
  const [mp4Message,setMp4Message]=useState("");
  async function mp4Request(query="",body?:object){
    const {data}=await supabaseBrowser().auth.getSession();
    if(!data.session?.access_token)throw Error("Sign in to use MP4 rendering.");
    const res=await fetch("/api/studio/render-jobs"+query,{method:body?"POST":"GET",headers:{Authorization:"Bearer "+data.session.access_token,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:"no-store"});
    const result=await res.json();
    if(!res.ok||!result.ok)throw Error(result.error||"MP4 request failed.");
    return result;
  }
  async function refreshMp4Jobs(){
    try{const result=await mp4Request();setMp4Jobs(Array.isArray(result.jobs)?result.jobs:[]);}
    catch(e){setMp4Message(e instanceof Error?e.message:"Could not load render jobs.");}
  }
  useEffect(()=>{
    if(!signedIn){setMp4Jobs([]);return;}
    let live=true;
    const refresh=async()=>{try{const result=await mp4Request();if(live)setMp4Jobs(Array.isArray(result.jobs)?result.jobs:[]);}catch(e){if(live)setMp4Message(e instanceof Error?e.message:"Render status unavailable.");}};
    void refresh();const timer=window.setInterval(()=>void refresh(),8000);
    return()=>{live=false;window.clearInterval(timer);};
  },[signedIn]);
  async function downloadMp4(id:string){
    try{const result=await mp4Request("?job="+encodeURIComponent(id)+"&download=1");if(typeof result.downloadUrl!=="string")throw Error("Download not available.");const a=document.createElement("a");a.href=result.downloadUrl;a.rel="noopener noreferrer";a.click();}
    catch(e){setMp4Message(e instanceof Error?e.message:"Download failed.");}
  }
  const [autoSave,setAutoSave]=useState(false);
  const [autoSaveStatus,setAutoSaveStatus]=useState("");
  const [clips, setClips] = useState<Clip[]>([]);
  const [sourceWaves,setSourceWaves]=useState<Record<string,number[]>>({});
  const [waveStatus,setWaveStatus]=useState("");
  const waveformAttempts=useRef(new Set<string>());
  useEffect(()=>{const next=clips.find(c=>!waveformAttempts.current.has(c.id));if(!next)return;let live=true;const timer=window.setTimeout(async()=>{for(const clip of clips){if(!live)break;if(waveformAttempts.current.has(clip.id))continue;waveformAttempts.current.add(clip.id);await decodeSourceWave(clip);}},250);return()=>{live=false;window.clearTimeout(timer)};},[clips]);
  async function decodeSourceWave(clip:Clip){
    if(clip.file.size>50_000_000){setWaveStatus("Waveform decoding limit: 50 MB per source.");return;}
    setWaveStatus("Decoding source audio…");let audio:AudioContext|null=null;
    try{audio=new AudioContext();const buffer=await audio.decodeAudioData(await clip.file.arrayBuffer());const data=buffer.getChannelData(0);
      const peaks=Array.from({length:96},(_,i)=>{const a=Math.floor(i*data.length/96),b=Math.floor((i+1)*data.length/96);let p=0;for(let j=a;j<b;j+=Math.max(1,Math.floor((b-a)/1024)))p=Math.max(p,Math.abs(data[j]));return p;});
      setSourceWaves(old=>({...old,[clip.id]:peaks}));setWaveStatus("Source waveform decoded.");
    }catch{setWaveStatus("This browser cannot decode the audio in this video container.");}finally{if(audio)void audio.close().catch(()=>{});}
  }
  const [history,setHistory]=useState<{past:Clip[][];future:Clip[][]}>({past:[],future:[]});
  const historyRef=useRef(history);
  const retainedUrls=useRef(new Set<string>());
  function changeHistory(next:{past:Clip[][];future:Clip[][]}){
    historyRef.current=next;setHistory(next);
  }
  function rememberClips(){
    changeHistory({past:[...historyRef.current.past,clips].slice(-40),future:[]});
  }
  function restoreClips(direction:"undo"|"redo"){
    if(busy||projectSaving)return;
    const h=historyRef.current;
    const stack=direction==="undo"?h.past:h.future;
    if(!stack.length)return;
    const next=stack[stack.length-1];
    changeHistory(direction==="undo"?{past:h.past.slice(0,-1),future:[...h.future,clips].slice(-40)}:{past:[...h.past,clips].slice(-40),future:h.future.slice(0,-1)});
    cleanupOutput();setClips(next);
    setActive(current=>next.some(c=>c.id===current)?current:next[0]?.id||null);
    setState(direction==="undo"?"Timeline edit undone.":"Timeline edit redone.");
  }
  const [active, setActive] = useState<string | null>(null);
  const [state, setState] = useState("Add local clips to start. Videos remain on your device.");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ratio, setRatio] = useState<"16:9" | "9:16" | "1:1">("9:16");
  const [framing,setFraming] = useState<"cover"|"contain"|"blur">("contain");
  const [resolution, setResolution] = useState(720);
  const [webmFps,setWebmFps]=useState(30);
  const [webmQuality,setWebmQuality]=useState("standard");
  const [exportName,setExportName]=useState("crelavo-studio-merged");
  const [exportPhase,setExportPhase]=useState("");
  const [exportEta,setExportEta]=useState<number|null>(null);
  const [exportResult,setExportResult]=useState("");
  const videoBitrate=Math.round((resolution<=480?2:resolution<=720?4:8)*1_000_000*(webmQuality==="low"?.6:webmQuality==="high"?1.6:1));
  const fileBase=exportName.trim().replace(/[^\p{L}\p{N} _.-]/gu,"_").replace(/\.+$/,"").slice(0,100)||"crelavo-studio-merged";

  const [includeAudio, setIncludeAudio] = useState(true);
  const [titleOverlay, setTitleOverlay] = useState("");
  const [captionCues, setCaptionCues] = useState<CaptionCue[]>([]);
  const [selectedCue,setSelectedCue]=useState<number|null>(null);
  const [subtitleName,setSubtitleName] = useState("");
  const musicPicker=useRef<HTMLInputElement>(null);
  const subtitlePicker=useRef<HTMLInputElement>(null);
  const [backgroundMusic,setBackgroundMusic] = useState<File|null>(null);
  const [imageLayers,setImageLayers]=useState<ImageLayer[]>([]);
  const [selectedImage,setSelectedImage]=useState<string|null>(null);
  const imagePicker=useRef<HTMLInputElement>(null);
  const imageBitmaps=useRef(new Map<string,ImageBitmap>());
  useEffect(()=>{
    let live=true;const ids=new Set(imageLayers.map(l=>l.id));
    for(const [id,bitmap] of imageBitmaps.current){if(!ids.has(id)){bitmap.close();imageBitmaps.current.delete(id);}}
    for(const layer of imageLayers){if(imageBitmaps.current.has(layer.id))continue;
      void createImageBitmap(layer.file).then(bitmap=>{if(!live){bitmap.close();return;}imageBitmaps.current.get(layer.id)?.close();imageBitmaps.current.set(layer.id,bitmap);}).catch(()=>{if(live)setState("Image layer could not be decoded.");});
    }
    return()=>{live=false;};
  },[imageLayers]);
  useEffect(()=>()=>{for(const bitmap of imageBitmaps.current.values())bitmap.close();imageBitmaps.current.clear();},[]);
  const [voiceover,setVoiceover]=useState<File|null>(null);
  const [voiceStart,setVoiceStart]=useState(0);
  const [voiceVolume,setVoiceVolume]=useState(1);
  const [voiceLength,setVoiceLength]=useState(0);
  const [voicePeaks,setVoicePeaks]=useState<number[]>([]);
  const voicePicker=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    if(!voiceover){setVoicePeaks([]);return;}
    let current=true;
    const audio=new AudioContext();
    void voiceover.arrayBuffer().then(b=>audio.decodeAudioData(b)).then(buffer=>{
      if(!current)return;
      setVoiceLength(buffer.duration);
      const samples=buffer.getChannelData(0),peaks=Array.from({length:96},(_,i)=>{
        const start=Math.floor(i*samples.length/96),end=Math.floor((i+1)*samples.length/96);
        let peak=0;for(let j=start;j<end;j+=Math.max(1,Math.floor((end-start)/512)))peak=Math.max(peak,Math.abs(samples[j]));
        return peak;
      });setVoicePeaks(peaks);
    }).catch(()=>{if(current){setVoicePeaks([]);setState("Voiceover could not be decoded.");}}).finally(()=>{void audio.close().catch(()=>{});});
    return()=>{current=false;};
  },[voiceover]);
  const [musicVolume,setMusicVolume] = useState(0.3);
  const [audioDucking,setAudioDucking]=useState(false);
  const [duckLevel,setDuckLevel]=useState(.25);
  const [audioCompressor,setAudioCompressor]=useState(false);
  const [lowCut,setLowCut]=useState(false);
  const [noiseReduction,setNoiseReduction]=useState(false);
  const [aiDenoise,setAiDenoise]=useState(false);
  const [musicPeaks,setMusicPeaks]=useState<number[]>([]);
  const [musicLength,setMusicLength]=useState(0);
  useEffect(()=>{
    setMusicPeaks([]);setMusicLength(0);
    if(!backgroundMusic)return;
    let current=true;const audio=new AudioContext();
    void backgroundMusic.arrayBuffer().then(b=>audio.decodeAudioData(b)).then(buffer=>{
      if(!current)return;setMusicLength(buffer.duration);
      const samples=buffer.getChannelData(0);
      setMusicPeaks(Array.from({length:128},(_,i)=>{
        const a=Math.floor(i*samples.length/128),b=Math.floor((i+1)*samples.length/128);
        let peak=0;for(let j=a;j<b;j+=Math.max(1,Math.floor((b-a)/512)))peak=Math.max(peak,Math.abs(samples[j]));return peak;
      }));
    }).catch(()=>{if(current)setState("Soundtrack waveform could not be decoded.");}).finally(()=>{void audio.close().catch(()=>{});});
    return()=>{current=false;};
  },[backgroundMusic]);
  const [fadeBetweenClips,setFadeBetweenClips] = useState(false);
  const [transitionStyle,setTransitionStyle]=useState<TransitionStyle>("black");
  const [transitionDuration,setTransitionDuration]=useState(.4);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [editorLanguage, setEditorLanguage] = useState<"en" | "tr">("en");
  useEffect(() => {
    try { setEditorLanguage(localStorage.getItem("clipora_language") === "tr" ? "tr" : "en"); } catch {}
  }, []);
  const t = (english: string, turkish: string) => editorLanguage === "tr" ? turkish : english;
  const files = useRef<Clip[]>([]);
  const output = useRef<string | null>(null);
  const cancel = useRef(false);
  const preview = useRef<HTMLVideoElement>(null);
  const draggingClipId=useRef<string|null>(null);
  const [dragTargetId,setDragTargetId]=useState<string|null>(null);
  useEffect(()=>{
    let live=true;
    void supabaseBrowser().auth.getUser().then(({data,error})=>{
      if(!live)return;
      if(!error&&data.user){setProjectOwner(data.user.id);setSignedIn(true)}
      else if(allowAnonymousLocalSave){setProjectOwner("preview-local");setSignedIn(false)}
    }).catch(()=>{if(live&&allowAnonymousLocalSave){setProjectOwner("preview-local");setSignedIn(false)}});
    return()=>{live=false};
  },[allowAnonymousLocalSave,authUser?.id]);
  useEffect(() => {
    files.current=clips;
    const live=new Set([...clips,...history.past.flat(),...history.future.flat()].map(c=>c.url));
    for(const url of retainedUrls.current)if(!live.has(url)){URL.revokeObjectURL(url);retainedUrls.current.delete(url);}
    for(const url of live)retainedUrls.current.add(url);
  }, [clips,history]);
  useEffect(() => () => { for(const url of retainedUrls.current)URL.revokeObjectURL(url); if (output.current) URL.revokeObjectURL(output.current); }, []);
  // Separate recovery record: autosave never overwrites an explicit manual save.
  useEffect(()=>{
    if(!autoSave||!projectOwner||busy||projectSaving||!clips.length)return;
    const size=clips.reduce((sum,c)=>sum+c.file.size,0)+(backgroundMusic?.size||0)+(voiceover?.size||0)+imageLayers.reduce((n,l)=>n+l.file.size,0);
    if(size>150_000_000){setAutoSaveStatus("Recovery unavailable: project exceeds 150 MB.");return;}
    let current=true;
    setAutoSaveStatus("Unsaved recovery changes");
    const timer=window.setTimeout(()=>{
      const project:SavedVideoProject={id:projectOwner+":recovery",owner:projectOwner,savedAt:Date.now(),clips:clips.map(({url,...data})=>data),ratio,resolution,fps:webmFps,quality:webmQuality,includeAudio,captionCues,titleOverlay:titleOverlay.slice(0,120),backgroundMusic,musicVolume,fadeBetweenClips,framing,voiceover,voiceStart,voiceVolume,voiceLength,imageLayers,transitionStyle,transitionDuration,audioDucking,duckLevel,audioCompressor,lowCut,noiseReduction,aiDenoise};
      setAutoSaveStatus("Saving recovery copy…");
      void saveProjectLocally(project).then(()=>{if(current)setAutoSaveStatus("Recovery saved at "+new Date(project.savedAt).toLocaleTimeString());}).catch(()=>{if(current)setAutoSaveStatus("Recovery save failed. Check browser storage.");});
    },2500);
    return()=>{current=false;window.clearTimeout(timer);};
  },[autoSave,projectOwner,busy,projectSaving,clips,ratio,resolution,webmFps,webmQuality,includeAudio,captionCues,titleOverlay,backgroundMusic,musicVolume,fadeBetweenClips,framing,voiceover,voiceStart,voiceVolume,voiceLength,imageLayers,transitionStyle,transitionDuration,audioDucking,duckLevel,audioCompressor,lowCut,noiseReduction,aiDenoise]);
  async function signInForMp4(){
    if(busy||projectSaving||mp4Busy)return;
    // Keep the current editor mounted during the account modal. Save a separate guest recovery copy before any redirect.
    if(clips.length){
      const size=clips.reduce((sum,clip)=>sum+clip.file.size,0)+(backgroundMusic?.size||0)+(voiceover?.size||0)+imageLayers.reduce((n,l)=>n+l.file.size,0);
      if(size>150_000_000){setMp4Message(t("Project exceeds local recovery limit (150 MB). Export WebM or reduce media before signing in.","Proje yerel kurtarma sınırını (150 MB) aşıyor. Girişten önce WebM üretin veya dosyaları küçültün."));return;}
      setProjectSaving(true);
      try{await saveProjectLocally({id:"preview-local:mp4-handoff",owner:"preview-local",savedAt:Date.now(),clips:clips.map(({url,...data})=>data),ratio,resolution,fps:webmFps,quality:webmQuality,includeAudio,captionCues,titleOverlay,backgroundMusic,musicVolume,fadeBetweenClips,framing,voiceover,voiceStart,voiceVolume,voiceLength,imageLayers,transitionStyle,transitionDuration,audioDucking,duckLevel,audioCompressor,lowCut,noiseReduction,aiDenoise});sessionStorage.setItem("crelavo-mp4-handoff","1");}
      catch{setMp4Message(t("Could not save recovery copy. Sign-in cancelled to protect your project.","Kurtarma kopyası kaydedilemedi. Projenizi korumak için giriş iptal edildi."));return;}
      finally{setProjectSaving(false);}
    }
    exportDialog.current?.close();openAuth("login",{next:window.location.pathname+window.location.search});
  }
  useEffect(()=>{if(!signedIn||!projectOwner||sessionStorage.getItem("crelavo-mp4-handoff")!=="1")return;if(clips.length){sessionStorage.removeItem("crelavo-mp4-handoff");return;}void reopenTimeline(false,true);},[signedIn,projectOwner]);
  async function saveTimeline(){
    if(!projectOwner||!clips.length||busy||projectSaving)return;
    const size=clips.reduce((sum,clip)=>sum+clip.file.size,0)+(backgroundMusic?.size||0)+(voiceover?.size||0)+imageLayers.reduce((n,l)=>n+l.file.size,0);
    if(size>150_000_000){setState("Local project save supports up to 150 MB of source clips. Export or reduce source size.");return;}
    setProjectSaving(true);
    try{
      const project: SavedVideoProject={
        id:projectOwner,owner:projectOwner,savedAt:Date.now(),
        clips:clips.map(({url,...data})=>data),
        ratio,resolution,fps:webmFps,quality:webmQuality,includeAudio,captionCues,titleOverlay:titleOverlay.slice(0,120),backgroundMusic,musicVolume,fadeBetweenClips,framing,voiceover,voiceStart,voiceVolume,voiceLength,imageLayers,transitionStyle,transitionDuration,audioDucking,duckLevel,audioCompressor,lowCut,noiseReduction,aiDenoise
      };
      await saveProjectLocally(project);
      setState("Timeline saved to this browser for your Crelavo account. Other devices cannot access this copy.");
    }catch{setState("Could not save locally. Check available browser storage space.");}
    finally{setProjectSaving(false)}
  }
  async function reopenTimeline(recovery=false,handoff=false){
    if(!projectOwner||busy||projectSaving)return;
    setProjectSaving(true);
    try{
      const project=await openProjectLocally(handoff?"preview-local:mp4-handoff":recovery?projectOwner+":recovery":projectOwner);
      if(!project||project.owner!==(handoff?"preview-local":projectOwner)){setState("No locally saved video timeline found for this account.");return;}
      const restored: Clip[]=project.clips.map(clip=>({...clip,url:URL.createObjectURL(clip.file)}));
      changeHistory({past:[],future:[]});
      files.current=restored;
      setClips(restored);setActive(restored[0]?.id||null);
      setRatio(project.ratio);setResolution(project.resolution);setWebmFps(project.fps??30);setWebmQuality(project.quality??"standard");setIncludeAudio(project.includeAudio);
      setCaptionCues(Array.isArray(project.captionCues)?project.captionCues:[]);setTitleOverlay(project.titleOverlay||'');
      setBackgroundMusic(project.backgroundMusic instanceof File?project.backgroundMusic:null);
      setImageLayers(Array.isArray(project.imageLayers)?project.imageLayers:[]);setSelectedImage(null);
      setVoiceover(project.voiceover instanceof File?project.voiceover:null);setVoiceStart(project.voiceStart||0);setVoiceVolume(project.voiceVolume??1);setVoiceLength(project.voiceLength||0);
      setMusicVolume(typeof project.musicVolume==='number'&&Number.isFinite(project.musicVolume)?Math.min(1,Math.max(0,project.musicVolume)):0.3);
      setAiDenoise(!!project.aiDenoise);setNoiseReduction(Boolean(project.noiseReduction));setAudioDucking(Boolean(project.audioDucking));setDuckLevel(project.duckLevel??.25);setAudioCompressor(Boolean(project.audioCompressor));setLowCut(Boolean(project.lowCut));
      setTransitionStyle(project.transitionStyle??"black");setTransitionDuration(project.transitionDuration??.4);
      setFadeBetweenClips(Boolean(project.fadeBetweenClips));setFraming(project.framing==="blur"?"blur":project.framing==="cover"?"cover":"contain");
      cleanupOutput();
      if(handoff){sessionStorage.removeItem("crelavo-mp4-handoff");setExportFormat("mp4");setMp4Message(t("Guest project restored. Ready for cloud export.","Misafir projesi geri yüklendi. Bulut çıktısına hazır."));exportDialog.current?.showModal();}
      setState("Local timeline reopened. You can continue editing and exporting.");
    }catch{setState("Could not reopen this timeline in the current browser.");}
    finally{setProjectSaving(false)}
  }
  async function saveTimelineCloud(){
    if(!projectOwner||!signedIn||!clips.length||busy||projectSaving)return;
    setProjectSaving(true);setState("Uploading source clips to your private cloud…");
    try{
      const savedVersion=await saveCloudTimeline(clips,{
       ratio,resolution,fps:webmFps,quality:webmQuality,includeAudio,captionCues,titleOverlay,backgroundMusic,musicVolume,fadeBetweenClips,framing,voiceover,voiceStart,voiceVolume,voiceLength,imageLayers,transitionStyle,transitionDuration,audioDucking,duckLevel,audioCompressor,lowCut,noiseReduction,aiDenoise
      });
      setState("Cloud timeline version "+savedVersion.version+" saved with its source files. You can reopen it on another device.");return savedVersion;
    }catch(error){setState("Cloud save failed: "+(error instanceof Error?error.message:"Unknown error"));}
    finally{setProjectSaving(false)}
  }
  async function submitMp4(){
    if(mp4Busy||projectSaving||busy||!signedIn||!clips.length)return;

    if(fadeBetweenClips&&!["black","crossfade"].includes(transitionStyle)){setMp4Message("This transition currently supports WebM only.");return;}
    setMp4Busy(true);setMp4Message("Saving an exact cloud snapshot for MP4...");
    try{
      const saved=await saveTimelineCloud();
      if(!saved)throw Error("Cloud snapshot could not be saved; no render was requested.");
      const result=await mp4Request("",{projectId:saved.projectId,timelineVersionId:saved.timelineVersionId,requestId:crypto.randomUUID()});
      setMp4Message("MP4 job accepted: "+result.job.status+". Rendering is not complete yet.");
      await refreshMp4Jobs();
    }catch(e){setMp4Message(e instanceof Error?e.message:"MP4 request failed.");}
    finally{setMp4Busy(false);}
  }
  async function reopenTimelineCloud(){
    if(!projectOwner||!signedIn||busy||projectSaving)return;
    setProjectSaving(true);setState("Downloading your latest cloud timeline…");
    try{
      const saved=await loadCloudTimeline();
      const restored: Clip[]=saved.clips.map(clip=>({...clip,url:URL.createObjectURL(clip.file)}));
      changeHistory({past:[],future:[]});
      files.current=restored;setClips(restored);setActive(restored[0]?.id||null);
      setRatio(saved.ratio);setResolution(saved.resolution);setWebmFps(saved.fps??30);setWebmQuality(saved.quality??"standard");setIncludeAudio(saved.includeAudio);
      setCaptionCues(saved.captionCues);setTitleOverlay(saved.titleOverlay);
      setImageLayers(saved.imageLayers||[]);setSelectedImage(null);
      setBackgroundMusic(saved.backgroundMusic);setMusicVolume(saved.musicVolume);setVoiceover(saved.voiceover||null);setVoiceStart(saved.voiceStart??0);setVoiceLength(saved.voiceLength??0);setVoiceVolume(saved.voiceVolume??1);
      setAudioDucking(!!saved.audioDucking);setDuckLevel(saved.duckLevel??.25);setAudioCompressor(!!saved.audioCompressor);setLowCut(!!saved.lowCut);setAiDenoise(!!saved.aiDenoise);setNoiseReduction(!!saved.noiseReduction);
      setTransitionStyle((["black","white","wipe-left","wipe-right","zoom","slide","dissolve","crossfade"].includes(saved.transitionStyle||"")?saved.transitionStyle:"black") as TransitionStyle);setTransitionDuration(saved.transitionDuration??.4);
      setFadeBetweenClips(saved.fadeBetweenClips);setFraming(saved.framing==="blur"?"blur":saved.framing==="cover"?"cover":"contain");cleanupOutput();
      setState("Cloud timeline version "+saved.version+" reopened with playable source media.");
    }catch(error){setState("Cloud reopen failed: "+(error instanceof Error?error.message:"Unknown error"));}
    finally{setProjectSaving(false)}
  }
  const chosen = clips.find(c => c.id === active);
  const blurCanvas=useRef<HTMLCanvasElement>(null);
  const [sourceAspect,setSourceAspect]=useState(0);
  const [timelineZoom,setTimelineZoom]=useState(1);
  const [previewZoom,setPreviewZoom]=useState<"fit"|"50"|"75"|"100">("fit");
  const [snap,setSnap]=useState(true);
  const [mediaCollapsed,setMediaCollapsed]=useState(false);
  const [inspectorCollapsed,setInspectorCollapsed]=useState(false);
  const [timelineHeight,setTimelineHeight]=useState(330);
  const timelineResize=useRef<{y:number;height:number}|null>(null);
  const [playhead,setPlayhead]=useState(0);
  const [previewPlaying,setPreviewPlaying]=useState(false);
  const pendingSeek=useRef<{id:string;time:number;play?:boolean}|null>(null);
  const timelinePlaying=useRef(false);
  const advancingClip=useRef(false);
  const playRequest=useRef(0);
  const resumeReady=useRef<{id:string;url:string;time:number}|null>(null);
  useEffect(()=>{
    if(!chosen)return;
    const video=preview.current, canvas=blurCanvas.current;
    if(!video||!canvas)return;
    const ctx=canvas.getContext("2d");if(!ctx)return;
    let frame=0;
    const draw=()=>{
      if(video.readyState>=2&&video.videoWidth&&video.videoHeight){
        const aspect=ratio==="9:16"?9/16:ratio==="1:1"?1:16/9;
        const w=Math.round(360*aspect),h=360;
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
        paintClip(ctx,video,chosen,w,h,framing);
        const at=clips.slice(0,clips.findIndex(c=>c.id===chosen.id)).reduce((n,c)=>n+(c.end-c.start)/(c.speed||1),0)+Math.max(0,Math.min((chosen.end-chosen.start)/(chosen.speed||1),(video.currentTime-chosen.start)/(chosen.speed||1)));
        paintImageLayers(ctx,w,h,at,imageLayers,imageBitmaps.current);
        paintOverlay(ctx,w,h,titleOverlay.slice(0,120),false);paintOverlay(ctx,w,h,captionAt(captionCues,at),true);
        if(fadeBetweenClips&&transitionStyle!=="crossfade")paintTransition(ctx,w,h,transitionStyle,transitionDuration,Math.max(0,(video.currentTime-chosen.start)/(chosen.speed||1)),(chosen.end-chosen.start)/(chosen.speed||1),clips.findIndex(c=>c.id===chosen.id),clips.length);
      }
      frame=requestAnimationFrame(draw);
    };draw();return()=>cancelAnimationFrame(frame);
  },[framing,chosen,ratio,clips,titleOverlay,captionCues,imageLayers,fadeBetweenClips,transitionStyle,transitionDuration]);
  const shortEdge=resolution,longEdge=Math.round(resolution*16/9/2)*2;
  const outputWidth=ratio==="1:1"?shortEdge:ratio==="9:16"?shortEdge:longEdge;
  const outputHeight=ratio==="9:16"?longEdge:shortEdge;
  const duration = clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start)/(clip.speed||1), 0);
  useEffect(()=>{if(preview.current&&chosen){preview.current.playbackRate=chosen.speed||1;preview.current.volume=Math.min(1,Math.max(0,chosen.gain??1));preview.current.muted=!includeAudio;}},[chosen,includeAudio]);
  const segments=clips.map((clip,index)=>({clip,index,start:clips.slice(0,index).reduce((n,c)=>n+(c.end-c.start)/(c.speed||1),0),length:(clip.end-clip.start)/(clip.speed||1)}));
  const layerDrag=useRef<{pointer:number;x:number;width:number;start:number;length:number;move:(start:number)=>void;changed:boolean}|null>(null);
  const suppressLayerClick=useRef(false);
  function beginLayerDrag(event:ReactPointerEvent<HTMLButtonElement>,start:number,length:number,move:(start:number)=>void){
    if(busy||projectSaving||event.button!==0||duration<=0)return;
    const width=event.currentTarget.parentElement?.getBoundingClientRect().width||0;
    if(width<=0)return;
    suppressLayerClick.current=false;
    layerDrag.current={pointer:event.pointerId,x:event.clientX,width,start,length,move,changed:false};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveLayerDrag(event:ReactPointerEvent<HTMLButtonElement>){
    const drag=layerDrag.current;if(!drag||drag.pointer!==event.pointerId)return;
    const dx=event.clientX-drag.x;
    if(!drag.changed&&Math.abs(dx)<4)return;
    drag.changed=true;suppressLayerClick.current=true;
    const max=Math.max(0,duration-drag.length);
    let at=Math.max(0,Math.min(max,Math.round((drag.start+dx/drag.width*duration)*100)/100));
    if(snap){const points=[0,max,playhead,...segments.map(s=>s.start),duration];const targets=points.flatMap(p=>[p,p-drag.length]).filter(p=>p>=0&&p<=max);const nearest=targets.reduce((best,p)=>Math.abs(p-at)<Math.abs(best-at)?p:best,at+duration+1);if(Math.abs(nearest-at)<=8/drag.width*duration)at=nearest;}
    drag.move(at);
  }
  function endLayerDrag(event:ReactPointerEvent<HTMLButtonElement>){
    if(layerDrag.current?.pointer!==event.pointerId)return;
    layerDrag.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function layerClick(action:()=>void){if(suppressLayerClick.current){suppressLayerClick.current=false;return;}action();}
  function seekTimeline(at:number){
    if(busy||!segments.length)return;
    const time=Math.max(0,Math.min(duration,at));
    const segment=segments.find(s=>time<s.start+s.length)||segments[segments.length-1];
    const sourceTime=Math.min(segment.clip.end,segment.clip.start+(time-segment.start)*(segment.clip.speed||1));
    setPlayhead(time);
    if(active===segment.clip.id&&preview.current){preview.current.currentTime=sourceTime;}
    else{playRequest.current++;resumeReady.current=null;advancingClip.current=timelinePlaying.current;pendingSeek.current={id:segment.clip.id,time:sourceTime,play:timelinePlaying.current};setActive(segment.clip.id);}
  }
  function advancePreview(video:HTMLVideoElement){
    if(!timelinePlaying.current||advancingClip.current||video!==preview.current)return;
    const index=segments.findIndex(s=>s.clip.id===active);if(index<0)return;
    const next=segments[index+1];
    if(!next){timelinePlaying.current=false;video.pause();setPreviewPlaying(false);setPlayhead(duration);return;}
    advancingClip.current=true;playRequest.current++;resumeReady.current=null;
    pendingSeek.current={id:next.clip.id,time:next.clip.start,play:true};
    setPlayhead(next.start);setActive(next.clip.id);
  }
  function syncPlayhead(video:HTMLVideoElement){
    if(video!==preview.current||advancingClip.current)return;
    const segment=segments.find(s=>s.clip.id===active);
    if(segment){setPlayhead(segment.start+Math.max(0,Math.min(segment.length,(video.currentTime-segment.clip.start)/(segment.clip.speed||1))));
      if(timelinePlaying.current&&video.currentTime>=segment.clip.end-.025)advancePreview(video);
    }
  }
  function stopPreview(){playRequest.current++;resumeReady.current=null;timelinePlaying.current=false;advancingClip.current=false;if(pendingSeek.current)pendingSeek.current.play=false;preview.current?.pause();setPreviewPlaying(false);}
  function requestPreviewPlay(video:HTMLVideoElement){
    const request=++playRequest.current;
    void video.play().then(()=>{if(request===playRequest.current&&timelinePlaying.current)setState("Playing timeline.");}).catch(error=>{
      if(request!==playRequest.current||!timelinePlaying.current||video!==preview.current)return;
      if(error instanceof DOMException&&error.name==="AbortError"){stopPreview();setState("Playback interrupted. Press Play to resume.");return;}
      stopPreview();setState(error instanceof DOMException&&error.name==="NotAllowedError"?"Browser blocked autoplay. Press Play to continue.":"Playback failed: "+(error instanceof Error?error.name+" — "+error.message:"Unknown media error"));
    });
  }
  useEffect(()=>{const v=preview.current,p=pendingSeek.current;if(!chosen||!v||!p||p.id!==chosen.id||v.currentSrc!==chosen.url||v.readyState<1)return;pendingSeek.current=null;if(p.play&&timelinePlaying.current)resumeReady.current={id:chosen.id,url:chosen.url,time:p.time};else advancingClip.current=false;v.currentTime=p.time;resumePreviewWhenReady(v);},[chosen?.id]);
  function resumePreviewWhenReady(video:HTMLVideoElement){
    const target=resumeReady.current;
    if(!target||!timelinePlaying.current||video!==preview.current||target.id!==chosen?.id||video.currentSrc!==target.url||video.seeking||video.readyState<2||Math.abs(video.currentTime-target.time)>.15)return;
    resumeReady.current=null;advancingClip.current=false;requestPreviewPlay(video);
  }
  function toggleTimelinePlayback(){
    const video=preview.current;if(!video||!chosen)return;
    if(timelinePlaying.current){stopPreview();return;}
    timelinePlaying.current=true;
    if(video.currentTime<chosen.start||video.currentTime>=chosen.end-.025)video.currentTime=chosen.start;
    requestPreviewPlay(video);
  }
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      const target=event.target;
      if(event.defaultPrevented||event.repeat||event.ctrlKey||event.metaKey||event.altKey||busy||mp4Busy||projectSaving||exportDialog.current?.open)return;
      if(target instanceof HTMLElement&&target.closest("input,textarea,select,button,a,summary,[contenteditable=true],[role=separator]"))return;
      if(event.code==="Space"&&chosen){event.preventDefault();toggleTimelinePlayback();}
      if(event.key==="Delete"&&chosen&&inspectorTab==="clip"){event.preventDefault();stopPreview();remove(chosen.id);}
    };
    window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);
  });
  function editCue(index:number,patch:Partial<CaptionCue>){
    if(busy||projectSaving)return;
    const cue=captionCues[index];if(!cue)return;
    const next={...cue,...patch};
    if(!Number.isFinite(next.start)||!Number.isFinite(next.end)||next.start<0||next.end<=next.start||next.end>duration+.01)return;
    setCaptionCues(old=>old.map((c,i)=>i===index?next:c));cleanupOutput();
  }
  function addCue(){
    if(busy||projectSaving||duration<.1||captionCues.length>=500)return;
    const start=Math.min(playhead,Math.max(0,duration-.1));
    setCaptionCues(old=>[...old,{start,end:Math.min(duration,start+2),text:"New subtitle"}]);setSelectedCue(captionCues.length);cleanupOutput();
  }
  function cleanupOutput() {
    setExportResult("");
    if (output.current) URL.revokeObjectURL(output.current);
    output.current = null;
    setDownloadUrl(null);
  }
  async function addFiles(list: FileList | null) {
    if (!list?.length || busy) return;
    const incoming: Clip[] = [];
    for (const file of Array.from(list).slice(0, Math.max(0, 30 - clips.length))) {
      if ((!file.type.startsWith("video/") && !/\.(mp4|webm|mov|m4v)$/i.test(file.name)) || file.size > 2_000_000_000) {
        setState("Skipped an unsupported video or a file larger than 2 GB."); continue;
      }
      const url = URL.createObjectURL(file);
      try {
        const length = await metadata(file, url);
        if (!Number.isFinite(length) || length <= 0 || length > 7200) throw new Error("Each video must be between 0 and 120 minutes.");
        incoming.push({ id: crypto.randomUUID(), file, name: file.name.slice(0, 130), url, duration: length, start: 0, end: length });
      } catch (error) { URL.revokeObjectURL(url); setState(error instanceof Error ? error.message : "Video unavailable."); }
    }
    if (incoming.length) {
      rememberClips(); cleanupOutput(); setClips(existing => [...existing, ...incoming]); setActive(current => current || incoming[0].id);
      setState(incoming.length + " new clip(s) added · " + (clips.length + incoming.length) + " clips in timeline. Rearrange, trim, or remove before exporting.");
    }
  }
  function update(id: string, patch: Partial<Clip>) {
    if (busy||projectSaving) return; rememberClips(); cleanupOutput();
    setClips(existing => existing.map(clip => clip.id !== id ? clip : { ...clip, ...patch }));
  }
  function move(id: string, delta: number) {
    if (busy||projectSaving) return; rememberClips(); cleanupOutput();
    setClips(existing => { const next = [...existing]; const i = next.findIndex(c => c.id === id); const j = i + delta; if (i < 0 || j < 0 || j >= next.length) return existing; [next[i], next[j]] = [next[j], next[i]]; return next; });
  }
  function reorderByDrop(targetId:string){
    const sourceId=draggingClipId.current;draggingClipId.current=null;setDragTargetId(null);
    if(busy||projectSaving||mp4Busy||!sourceId||sourceId===targetId)return;
    stopPreview();
    const sourceIndex=clips.findIndex(c=>c.id===sourceId),targetIndex=clips.findIndex(c=>c.id===targetId);
    if(sourceIndex<0||targetIndex<0)return;
    rememberClips();cleanupOutput();
    setClips(existing=>{
      const from=existing.findIndex(c=>c.id===sourceId),to=existing.findIndex(c=>c.id===targetId);
      if(from<0||to<0||from===to)return existing;
      const next=[...existing];const [item]=next.splice(from,1);next.splice(to,0,item);
      return next;
    });
    setState("Timeline reordered. Export uses the new clip order.");
  }
  function remove(id: string) {
    if (busy||projectSaving) return; rememberClips();cleanupOutput();
    const next=clips.filter(c=>c.id!==id);setClips(next);setActive(current=>current===id?(next[0]?.id||null):current);
  }
  function duplicate(id:string){
    if(busy)return;
    if(clips.length>=30){setState("Timeline supports up to 30 clips.");return;}
    const item=clips.find(c=>c.id===id);if(!item)return;
    const copy:Clip={...item,id:crypto.randomUUID(),name:(item.name+" (copy)").slice(0,130)};
    rememberClips();cleanupOutput();
    setClips(existing=>{
      if(existing.length>=30)return existing;
      const index=existing.findIndex(c=>c.id===id);if(index<0)return existing;
      const next=[...existing];next.splice(index+1,0,copy);return next;
    });
    setActive(copy.id);setState("Clip duplicated with its trim range.");
  }
  function setTrimAtPlayhead(edge:"start"|"end"){
    const item=clips.find(c=>c.id===active), video=preview.current;
    if(!item||!video||busy)return;
    const at=Math.max(0,Math.min(item.duration,video.currentTime));
    if(!Number.isFinite(at)||(edge==="start"?at>=item.end-.05:at<=item.start+.05)){
      setState("Seek to a valid position before setting the trim boundary.");return;
    }
    update(item.id,edge==="start"?{start:at}:{end:at});
  }
  function split(id: string) {
    const item = clips.find(c => c.id === id);
    if (!item || busy || !preview.current) return;
    if(clips.length>=30){setState("Timeline supports up to 30 clips.");return;}
    const at = preview.current.currentTime;
    if (at <= item.start + .15 || at >= item.end - .15) { setState("Play or seek inside the selected trim range before splitting."); return; }
    rememberClips();cleanupOutput();
    const second: Clip = { ...item, id: crypto.randomUUID(), name: item.name + " (part 2)", start: at };
    setClips(existing => { const i = existing.findIndex(c => c.id === id); if (i < 0) return existing; const next = [...existing]; next.splice(i, 1, { ...item, end: at }, second); return next; });
    setState("Clip split at " + sec(at) + ". Both parts reference your original local file.");
  }
  async function exportVideo() {
    if (busy || !clips.length || !duration) return;
    if((fadeBetweenClips&&transitionStyle==="crossfade")||aiDenoise||noiseReduction){setState("Selected effects require the separate MP4 worker. Save your cloud timeline; disable MP4-only effects for browser WebM export.");return;}
    const mime = supportedMime();
    if (!mime || typeof HTMLCanvasElement.prototype.captureStream !== "function") {
      setState("This browser cannot record the edited timeline. Use a current Chrome or Edge browser."); return;
    }
    setBusy(true); cancel.current = false; setProgress(0); cleanupOutput();setExportResult("");setExportEta(null);setExportPhase("Preparing media…");
    const width = ratio==="9:16"?resolution:ratio==="1:1"?resolution:Math.round(resolution*16/9/2)*2;
    const height = ratio==="9:16"?Math.round(resolution*16/9/2)*2:resolution;
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) { setBusy(false); setState("Canvas unavailable."); return; }
    const stream = canvas.captureStream(webmFps);
    const AudioContextConstructor = window.AudioContext;
    let audio: AudioContext | null = null;
    const exportImages=new Map<string,ImageBitmap>();
    let musicSource: AudioBufferSourceNode | null = null;
    let voiceSource: AudioBufferSourceNode | null=null;
    let musicGainNode: GainNode | null = null;
    let recorder: MediaRecorder | null = null;
    let currentVideo: HTMLVideoElement | null = null;
    let raf = 0;
    const chunks: BlobPart[] = [];
    let recordDone: Promise<void> | undefined;
    try {
      for(const layer of imageLayers)exportImages.set(layer.id,await createImageBitmap(layer.file));
      if (includeAudio || backgroundMusic || voiceover) {
        audio = new AudioContextConstructor();
        await audio.resume();
        const destination = audio.createMediaStreamDestination();
        destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
        // The same destination is used for every clip. Its gain is connected
        // to the captured stream only, avoiding unexpected speaker playback.
        (canvas as HTMLCanvasElement & { __audioDestination?: MediaStreamAudioDestinationNode }).__audioDestination = destination;
        if(voiceover){
          if(voiceover.size>25_000_000||!voiceover.type.startsWith("audio/"))throw new Error("Voiceover must be audio under 25 MB.");
          const buffer=await audio.decodeAudioData(await voiceover.arrayBuffer());
          voiceSource=audio.createBufferSource();voiceSource.buffer=buffer;
          const gain=audio.createGain();gain.gain.value=Math.max(0,Math.min(1,voiceVolume));voiceSource.connect(gain);gain.connect(destination);
        }
        if(backgroundMusic){
          if(backgroundMusic.size>25_000_000 || !backgroundMusic.type.startsWith('audio/'))
            throw new Error('Background music must be an audio file smaller than 25 MB.');
          const musicBuffer=await audio.decodeAudioData(await backgroundMusic.arrayBuffer());
          if(musicBuffer.duration<0.1 || musicBuffer.duration>7200)throw new Error('Background track duration is invalid.');
          const source=audio.createBufferSource();source.buffer=musicBuffer;source.loop=true;
          const volume=audio.createGain();
          volume.gain.value=0;
          source.connect(volume);volume.connect(destination);
          musicSource=source;
          musicGainNode=volume;
        }
      }
      // Register all intended tracks before constructing MediaRecorder:
      // a recorder created with a video-only stream may omit later audio.
      recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: videoBitrate });
      const configuredRecorder = recorder;
      recordDone = new Promise<void>((resolve, reject) => {
        configuredRecorder.ondataavailable = event => { if(event.data.size)chunks.push(event.data); };
        configuredRecorder.onerror = () => reject(new Error("Video recorder failed."));
        configuredRecorder.onstop = () => resolve();
      });
      recorder.start(750);
      const recordingStartedAt=performance.now();
      let elapsed = 0;
      for (let clipIndex=0;clipIndex<clips.length;clipIndex++) {
        const clip=clips[clipIndex];
        setExportPhase("Rendering clip "+(clipIndex+1)+" / "+clips.length);
        if (cancel.current) throw new Error("Export cancelled.");
        const video = document.createElement("video"); currentVideo = video;
        video.preload = "auto"; video.playsInline = true; video.src = clip.url;
        video.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          if (video.readyState >= 2) { resolve(); return; }
          const timer = window.setTimeout(() => reject(new Error("Clip timed out: " + clip.name)), 30000);
          video.onloadeddata = () => { clearTimeout(timer); resolve(); };
          video.onerror = () => { clearTimeout(timer); reject(new Error("Cannot decode clip: " + clip.name)); };
        });
        await seek(video, clip.start);
        const speed=clip.speed||1, gain=clip.gain??1;
        video.playbackRate=speed;
        let source: MediaElementAudioSourceNode | null = null;
        if (audio && includeAudio) {
          source = audio.createMediaElementSource(video);
          const inputGain=audio.createGain();
          inputGain.gain.value=gain;
          if(lowCut){const filter=audio.createBiquadFilter();filter.type="highpass";filter.frequency.value=80;source.connect(filter);filter.connect(inputGain);}else source.connect(inputGain);
          const destination=(canvas as HTMLCanvasElement & { __audioDestination?: MediaStreamAudioDestinationNode }).__audioDestination!;
          if(audioCompressor){const compressor=audio.createDynamicsCompressor();compressor.threshold.value=-20;compressor.knee.value=18;compressor.ratio.value=4;compressor.attack.value=.005;compressor.release.value=.2;inputGain.connect(compressor);compressor.connect(destination);}else inputGain.connect(destination);
          if(fadeBetweenClips&&clips.length>1){
            const now=audio.currentTime;
            const segmentLength=(clip.end-clip.start)/speed;
            const fade=Math.min(transitionDuration,segmentLength/3);
            inputGain.gain.setValueAtTime(clipIndex===0?gain:0,now);
            if(clipIndex>0)inputGain.gain.linearRampToValueAtTime(gain,now+fade);
            if(clipIndex<clips.length-1){
              inputGain.gain.setValueAtTime(gain,now+Math.max(fade,segmentLength-fade));
              inputGain.gain.linearRampToValueAtTime(0,now+segmentLength);
            }
          }
        } else video.muted = true;
        const segment = (clip.end - clip.start)/speed;
        if (segment <= .05) throw new Error("Invalid trim range for " + clip.name);
        await video.play();
        if(clipIndex===0&&voiceSource&&audio&&voiceStart<duration){voiceSource.start(audio.currentTime+Math.max(0,voiceStart),0,Math.min(voiceSource.buffer!.duration,duration-voiceStart));}
        if(clipIndex===0&&musicSource&&audio&&musicGainNode){
          const now=audio.currentTime,level=Math.max(0,Math.min(1,musicVolume));
          const fadeIn=Math.min(.6,duration/4),fadeOut=Math.min(.7,duration/4);
          const duckStart=Math.max(0,Math.min(duration,voiceStart)),duckEnd=Math.min(duration,duckStart+(voiceSource?.buffer?.duration||0));
          const duck=audioDucking&&voiceover&&voiceVolume>0&&duckEnd>duckStart;
          const points=[0,fadeIn,Math.max(0,duration-fadeOut),duration];
          if(duck)points.push(Math.max(0,duckStart-.15),duckStart,duckEnd,Math.min(duration,duckEnd+.25));
          const envelope=(t:number)=>{
            const fade=Math.min(1,t/Math.max(.001,fadeIn),(duration-t)/Math.max(.001,fadeOut));
            let factor=1;
            if(duck){
              if(t>=duckStart&&t<=duckEnd)factor=duckLevel;
              else if(t<duckStart&&t>duckStart-.15)factor=duckLevel+(1-duckLevel)*(duckStart-t)/.15;
              else if(t>duckEnd&&t<duckEnd+.25)factor=duckLevel+(1-duckLevel)*(t-duckEnd)/.25;
            }
            return level*Math.max(0,fade)*factor;
          };
          for(const t of [...new Set(points)].sort((a,b)=>a-b))musicGainNode.gain.linearRampToValueAtTime(envelope(t),now+t);
          musicSource.start();
        }
        await new Promise<void>((resolve, reject) => {
          const begin = performance.now();
          const render = () => {
            if (cancel.current) { reject(new Error("Export cancelled.")); return; }
            if (video.error) { reject(new Error("Decode failed during " + clip.name)); return; }
            const vw = video.videoWidth, vh = video.videoHeight;
            if (vw && vh && video.readyState >= 2) {
              paintClip(ctx,video,clip,width,height,framing);
              const at=elapsed+Math.min(segment,Math.max(0,(video.currentTime-clip.start)/speed));
              paintImageLayers(ctx,width,height,at,imageLayers,exportImages);
              paintOverlay(ctx,width,height,titleOverlay.slice(0,120),false);
              paintOverlay(ctx,width,height,captionAt(captionCues,at),true);
              if(fadeBetweenClips)paintTransition(ctx,width,height,transitionStyle,transitionDuration,Math.max(0,(video.currentTime-clip.start)/speed),segment,clipIndex,clips.length);
            }
            const completed=elapsed+Math.min(segment,Math.max(0,(video.currentTime-clip.start)/speed));
            setProgress(Math.min(99,Math.round(100*completed/duration)));
            if(completed>1)setExportEta(Math.max(0,Math.ceil((performance.now()-recordingStartedAt)/1000*(duration-completed)/completed)));
            if (video.currentTime >= clip.end - .04 || video.ended || performance.now() - begin > (segment + 6) * 1000) { resolve(); return; }
            raf = requestAnimationFrame(render);
          }; render();
        });
        cancelAnimationFrame(raf); video.pause(); source?.disconnect();
        video.removeAttribute("src"); video.load(); currentVideo = null;
        elapsed += segment;
      }
      setExportPhase("Finalizing video…");setExportEta(null);
      recorder!.stop();
      if(!recordDone)throw new Error("Recording was not initialized.");
      await recordDone;
      if (cancel.current) throw new Error("Export cancelled.");
      const rawBlob = new Blob(chunks, { type: "video/webm" });
      if (rawBlob.size < 1000) throw new Error("The exported video is empty.");
      // MediaRecorder usually omits the WebM Duration element. The player
      // may show changing video frames but a frozen/unseekable time slider.
      // Use actual recording elapsed time (not nominal trim sum), because
      // decode/seek delays and hardware may extend the recording.
      const recordedMs=Math.max(1,performance.now()-recordingStartedAt);
      const fixed=await addMediaRecorderWebmDuration(rawBlob,recordedMs);
      const blob=fixed.blob;
      const url = URL.createObjectURL(blob); output.current = url; setDownloadUrl(url);setExportResult("Video ready · "+(blob.size/1048576).toFixed(1)+" MB");setExportPhase("Complete");
      setProgress(100);
      setState(fixed.fixed
        ?"Merged video ready ("+(blob.size/1048576).toFixed(1)+" MB) · duration metadata added. Download the WebM file."
        :"Merged video ready ("+(blob.size/1048576).toFixed(1)+" MB), but seekable duration metadata could not be added ("+fixed.reason+"). Player timeline/scrubbing may be limited.");
    } catch (error) {
      const activeRecorder = recorder as MediaRecorder | null;
      if (activeRecorder && activeRecorder.state === "recording") activeRecorder.stop();
      setState(error instanceof Error ? error.message : "Could not export the video.");
    } finally {
      cancelAnimationFrame(raf);
      currentVideo?.pause();
      stream.getTracks().forEach(track => track.stop());
      if(musicSource){try{musicSource.stop()}catch{}}
      if(voiceSource){try{voiceSource.stop()}catch{}}
      for(const bitmap of exportImages.values())bitmap.close();
      if (audio) await audio.close().catch(() => {});
      setBusy(false);
    }
  }
  return <section className="studio-compact-video-editor" style={{ color: "#f4f0ff", background: "#110e1b", padding: "12px 16px 22px", minHeight: "100%", maxWidth: "none", margin: "0 auto", fontFamily: "Inter,system-ui,sans-serif" }}>

    <header className="studio-workspace-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div className="studio-brand"><a className="editor-back" aria-label="Back to Studio V2" href={"/dashboard/studio-v2?category="+encodeURIComponent(studioReturnCategory)+"&uiLang=en"}>‹</a><h1><span className="studio-brand-mark" aria-hidden="true">▷</span> Crelavo Studio</h1><span className="studio-project-label">Video project</span><small>{projectSaving?"Saving…":autoSaveStatus|| (autoSave?"Local auto-save enabled":"Local workspace")}</small></div>
      <div className="studio-header-actions">
       <button type="button" aria-pressed={!mediaCollapsed} onClick={()=>setMediaCollapsed(v=>!v)} title="Show or hide media library">{mediaCollapsed?"Show media":"Hide media"}</button><button type="button" aria-pressed={!inspectorCollapsed} onClick={()=>setInspectorCollapsed(v=>!v)} title="Show or hide inspector">{inspectorCollapsed?"Show inspector":"Hide inspector"}</button>
       <button type="button" aria-label="Undo" disabled={busy||projectSaving||!history.past.length} onClick={()=>restoreClips("undo")}>↶</button><button type="button" aria-label="Redo" disabled={busy||projectSaving||!history.future.length} onClick={()=>restoreClips("redo")}>↷</button>
       <details style={{position:"relative",border:"1px solid #4c355d",borderRadius:8,padding:"6px 9px"}}><summary style={{cursor:"pointer",fontSize:12}}>Save / reopen project</summary><div style={{display:"flex",flexWrap:"wrap",gap:6,maxWidth:410,marginTop:8}}>
       <button type="button" disabled={!projectOwner||!clips.length||busy||projectSaving} onClick={()=>{void saveTimeline()}} style={{background:"#38254d",border:"1px solid #74518b",color:"#fff",padding:"6px 9px",borderRadius:8}}>Save local timeline</button>
       <button type="button" disabled={!projectOwner||busy||projectSaving} onClick={()=>{void reopenTimeline()}} style={{background:"#281d36",border:"1px solid #74518b",color:"#fff",padding:"9px 12px",borderRadius:9}}>Reopen timeline</button>
       <button type="button" disabled={!signedIn||!clips.length||busy||projectSaving} onClick={()=>{void saveTimelineCloud()}} style={{background:"#38254d",border:"1px solid #74518b",color:"#fff",padding:"9px 12px",borderRadius:9}}>Save cloud timeline (≤90 MB)</button>
       <button type="button" disabled={!signedIn||busy||projectSaving} onClick={()=>{void reopenTimelineCloud()}} style={{background:"#281d36",border:"1px solid #74518b",color:"#fff",padding:"9px 12px",borderRadius:9}}>Reopen cloud timeline</button>
       <label style={{display:"flex",gap:6,alignItems:"center",fontSize:12}}><input type="checkbox" checked={autoSave} disabled={!projectOwner||busy||projectSaving} onChange={e=>{setAutoSave(e.target.checked);if(!e.target.checked)setAutoSaveStatus("");}}/>Auto-save recovery copy (this browser)</label>
       <button type="button" disabled={!projectOwner||busy||projectSaving} onClick={()=>{void reopenTimeline(true)}}>Recover auto-saved timeline</button>
       {autoSaveStatus&&<small role="status">{autoSaveStatus}</small>}
       </div></details>
      <div className="studio-format-preset" role="group" aria-label="Choose video orientation before uploading">
        <span className="studio-format-label">{t("Video format", "Video biçimi")}</span>
        {([
          ["9:16",t("↕ Vertical · Shorts","↕ Dikey · Shorts")],
          ["16:9",t("↔ Horizontal","↔ Yatay")],
          ["1:1",t("□ Square","□ Kare")]
        ] as const).map(([value,label])=>
          <button type="button" key={value} aria-pressed={ratio===value} disabled={busy}
            className={"studio-format-button"+(ratio===value?" is-active":"")}
            onClick={()=>{setRatio(value);cleanupOutput();}}>{label}</button>
        )}
      </div>
      <select aria-label="Output resolution" value={resolution} disabled={busy||mp4Busy||projectSaving} onChange={e=>{setResolution(Number(e.target.value));cleanupOutput()}}><option value={480}>480p</option><option value={720}>720p</option><option value={1080}>1080p</option></select>
      <button type="button" className="studio-top-export" onClick={()=>{stopPreview();exportDialog.current?.showModal()}}>Export · {exportFormat.toUpperCase()}</button>
      </div>
    <div className="studio-status-bar"><details className="studio-preview-info"><summary aria-label="Preview information" title={state}>ⓘ Info</summary><div className="studio-preview-info-body">{!signedIn&&allowAnonymousLocalSave&&<p>Preview mode: local timeline saves stay in this browser. Sign in for private cloud backup.</p>}<p role="status" aria-live="polite">{state}</p>        <p className="studio-video-framing-note" role="status">{framing==="cover"
          ?"Crop mode: side or top/bottom content can be removed. Switch to Show full video to keep all edges."
          :framing==="blur"?"Full video preserved with a blurred background.":"Full video preserved. Borders may appear when the source and output ratios differ."}</p>
        {chosen && <p className="studio-selected-clip-note">Preview: selected clip only when paused; Play advances through the timeline. Transition mixing and external audio are not previewed.</p>}</div></details></div></header>


    <div className={"editor-main-grid studio-workspace-grid"+(mediaCollapsed?" is-media-collapsed":"")+(inspectorCollapsed?" is-inspector-collapsed":"")} style={{gridTemplateRows:`minmax(220px,1fr) min(${timelineHeight}px, 52%)`}}>
      <div className="studio-left-workspace"><nav className="studio-tool-rail" aria-label="Editing tools">{([["▣","Media","clip","all"],["T","Text","layers","all"],["▧","Images","layers","image"],["◇","Transitions","effects","all"],["♫","Audio","audio","audio"],["▱","Layers","layers","all"]] as const).map(([glyph,label,tab,filter])=><button key={label} type="button" onClick={()=>{setInspectorTab(tab);setMediaFilter(filter);setMediaSearch("")}}><StudioIcon name={label}/><small>{label}</small></button>)}</nav><aside className="studio-media-library"><h2>Media library · {clips.length}</h2>      <label className="studio-media-drop" onDragOver={e=>{if(!busy&&e.dataTransfer.types.includes("Files"))e.preventDefault()}} onDrop={e=>{if(e.dataTransfer.files.length){e.preventDefault();if(!busy)void addFiles(e.dataTransfer.files)}}}><StudioIcon name="Upload"/><strong>{t("+ Add videos", "+ Video ekle")}</strong><small>Drop video files here · local max 2 GB/file</small><input aria-label="Add local video clips" disabled={busy} type="file" multiple accept={accept} onChange={e => { void addFiles(e.target.files); e.currentTarget.value = ""; }} hidden /></label>
        <div className="studio-media-imports"><button type="button" disabled={busy} onClick={()=>{setInspectorTab("audio");musicPicker.current?.click()}}>+ Music</button><button type="button" disabled={busy} onClick={()=>{setInspectorTab("audio");voicePicker.current?.click()}}>+ Voice</button><button type="button" disabled={busy||!duration||imageLayers.length>=8} onClick={()=>{setInspectorTab("layers");imagePicker.current?.click()}}>+ Image</button></div><div className="studio-media-filters">{(["all","video","audio","image"] as const).map(f=><button key={f} type="button" aria-pressed={mediaFilter===f} onClick={()=>setMediaFilter(f)}>{f==="all"?"All":f[0].toUpperCase()+f.slice(1)}</button>)}</div><input className="studio-media-search" aria-label="Search media" placeholder="Search media…" value={mediaSearch} onChange={e=>setMediaSearch(e.target.value)}/>
        <div className="studio-media-cards">
          {clips.map((clip, index) => (mediaFilter==="all"||mediaFilter==="video")&&clip.name.toLowerCase().includes(mediaSearch.toLowerCase())&&<div key={clip.id}
            draggable={!busy}
            onDragStart={e=>{if(busy){e.preventDefault();return;} draggingClipId.current=clip.id;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",clip.id);}}
            onDragOver={e=>{if(busy)return;e.preventDefault();e.dataTransfer.dropEffect="move";setDragTargetId(clip.id);}}
            onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setDragTargetId(null);}}
            onDrop={e=>{e.preventDefault();reorderByDrop(clip.id);}}
            onDragEnd={()=>{draggingClipId.current=null;setDragTargetId(null);}}
            className={"studio-timeline-clip"+(active===clip.id?" is-active":"")+(dragTargetId===clip.id?" is-drop-target":"")}
            style={{ flex: "0 0 155px", background: active === clip.id ? "#382049" : "#21182e", border: "1px solid #5a3670", borderRadius: 9, padding: 9 }}>
            <ClipThumbnail url={clip.url} start={clip.start} name={clip.name}/>
            <button type="button" disabled={busy} onClick={() => {stopPreview();setActive(clip.id);setInspectorTab("clip");}} className="studio-media-filename" title={clip.name} style={{ display: "block", width: "100%", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#fff", background: "transparent", border: 0 }}>{index + 1}. {clip.name}</button>
            <small style={{ color: "#c2b4d5" }}>{sec((clip.end - clip.start)/(clip.speed||1))}</small>
            <div className="studio-timeline-actions" style={{ display: "flex", gap: 5, marginTop: 10 }}>
              <button disabled={busy || index === 0} onClick={() => move(clip.id, -1)} title="Move clip earlier" aria-label="Move clip left">←</button>
              <button disabled={busy || index === clips.length - 1} onClick={() => move(clip.id, 1)} title="Move clip later" aria-label="Move clip right">→</button>
              <button disabled={busy} onClick={() => remove(clip.id)} title="Remove clip from timeline" aria-label="Remove clip">×</button>
            </div>
          </div>)}
          {(mediaFilter==="all"||mediaFilter==="audio")&&[backgroundMusic,voiceover].filter((f):f is File=>!!f).filter(f=>f.name.toLowerCase().includes(mediaSearch.toLowerCase())).map((f,i)=><button type="button" key={f.name+i} className="studio-asset-card" onClick={()=>setInspectorTab("audio")}><span>♫</span>{f.name}</button>)}
          {(mediaFilter==="all"||mediaFilter==="image")&&imageLayers.filter(l=>l.file.name.toLowerCase().includes(mediaSearch.toLowerCase())).map(l=><button type="button" key={l.id} className="studio-asset-card" onClick={()=>{setSelectedImage(l.id);setInspectorTab("layers")}}><span>▧</span>{l.file.name}</button>)}
        </div></aside></div>
      <div className="studio-preview-pane" style={{ minWidth: 0 }}>
        <div className={"studio-video-preview-stage"+(ratio==="9:16"?" is-portrait":ratio==="1:1"?" is-square":" is-landscape")} data-preview-zoom={previewZoom}> 
          <div className={"studio-video-preview-frame"+(ratio==="9:16"?" is-portrait":ratio==="1:1"?" is-square":" is-landscape")}
               style={{aspectRatio:ratio==="9:16"?"9 / 16":ratio==="1:1"?"1 / 1":"16 / 9"}}>
            {chosen ? <>{<canvas ref={blurCanvas} aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:1}}/>}<video ref={preview} src={chosen.url} playsInline preload="auto"
              style={{width:"100%",height:"100%",objectFit:framing==="blur"?"contain":framing,display:"block",opacity:0,position:"relative",transform:`rotate(${chosen.rotation||0}deg) scale(${(chosen.flipX?-1:1)*(chosen.zoom||1)},${(chosen.flipY?-1:1)*(chosen.zoom||1)})`,...(framing==="blur"&&sourceAspect>0?{maxWidth:`${Math.min(1,sourceAspect/(ratio==="9:16"?9/16:ratio==="1:1"?1:16/9))*100}%`,maxHeight:`${Math.min(1,(ratio==="9:16"?9/16:ratio==="1:1"?1:16/9)/sourceAspect)*100}%`}: {})}}
              onLoadedMetadata={e=>{const v=e.currentTarget;if(v.currentSrc!==chosen.url)return;const pending=pendingSeek.current?.id===chosen.id?pendingSeek.current:null;const at=pending?.time??chosen.start;setSourceAspect(v.videoWidth/v.videoHeight);pendingSeek.current=null;v.playbackRate=chosen.speed||1;v.volume=Math.min(1,Math.max(0,chosen.gain??1));v.muted=!includeAudio;if(pending?.play&&timelinePlaying.current){resumeReady.current={id:chosen.id,url:chosen.url,time:at};setState("Loading next clip…");}else{advancingClip.current=false;timelinePlaying.current=false;setPreviewPlaying(false)}if(Math.abs(v.currentTime-at)>.01)v.currentTime=at;resumePreviewWhenReady(v);}} onCanPlay={e=>resumePreviewWhenReady(e.currentTarget)} onSeeked={e=>resumePreviewWhenReady(e.currentTarget)} onTimeUpdate={e=>syncPlayhead(e.currentTarget)} onPlay={()=>setPreviewPlaying(true)} onPause={()=>{if(!advancingClip.current)setPreviewPlaying(false)}} onEnded={e=>advancePreview(e.currentTarget)} onError={e=>{const v=e.currentTarget;if(v.currentSrc!==chosen.url)return;stopPreview();setState("Media could not be loaded (code "+(v.error?.code??"unknown")+"). Check the source file or codec.");}} />
              </>
              : <div className="studio-video-no-clips">Add video files to begin editing</div>}
          </div>
        </div>
        <div className="studio-preview-transport">
          <input className="studio-preview-seek" aria-label="Preview timeline position" type="range" min={0} max={duration||1} step={.01} value={Math.min(playhead,duration)} disabled={busy||!chosen} onChange={e=>seekTimeline(Number(e.target.value))}/>
          <div className="studio-preview-transport-row" role="group" aria-label="Preview playback">
            <button type="button" aria-label="Go to timeline start" title="Go to timeline start" disabled={busy||!chosen} onClick={()=>{stopPreview();seekTimeline(0)}}><StudioIcon name="Previous"/></button>
            <button type="button" aria-label={previewPlaying?"Pause":"Play timeline"} disabled={busy||!chosen} onClick={toggleTimelinePlayback}><StudioIcon name={previewPlaying?"Pause":"Play"}/></button>
            <button type="button" aria-label="Go to timeline end" title="Go to timeline end" disabled={busy||!chosen} onClick={()=>{stopPreview();seekTimeline(duration)}}><StudioIcon name="Next"/></button>
            <span className="studio-preview-time">{timecode(Math.min(playhead,duration))} / {timecode(duration)}</span><select aria-label="Preview magnification" value={previewZoom} onChange={e=>setPreviewZoom(e.target.value as typeof previewZoom)}><option value="fit">Fit</option><option value="50">50%</option><option value="75">75%</option><option value="100">100%</option></select>
            <button type="button" disabled={!chosen||busy} onClick={()=>{if(preview.current&&chosen){stopPreview();preview.current.currentTime=chosen.start;}}}>Restart clip</button>
            <button type="button" className="studio-preview-fullscreen" aria-label="Fullscreen preview" title="Fullscreen preview" disabled={!chosen} onClick={()=>{const frame=preview.current?.closest(".studio-video-preview-frame");if(document.fullscreenElement)void document.exitFullscreen().catch(()=>setState("Fullscreen unavailable."));else if(frame?.requestFullscreen)void frame.requestFullscreen().catch(()=>setState("Fullscreen unavailable."));}}><StudioIcon name="Fullscreen"/></button>
          </div>
        </div>
        <div className="studio-video-preview-controls" role="group" aria-label="Preview fit controls">
          <span>{ratio==="9:16"?"9:16 Shorts / Reels":ratio==="1:1"?"1:1 Square":"16:9 Landscape"}</span>
          <button type="button" disabled={busy} aria-pressed={framing==="contain"}
            className={framing==="contain"?"is-active":""}
            onClick={()=>{setFraming("contain");cleanupOutput();}}>Show full video</button>
          <button type="button" disabled={busy} aria-pressed={framing==="cover"}
            className={framing==="cover"?"is-active":""}
            onClick={()=>{setFraming("cover");cleanupOutput();}}>Fill screen · crop edges</button>
          <button type="button" disabled={busy} aria-pressed={framing==="blur"} className={framing==="blur"?"is-active":""} onClick={()=>{setFraming("blur");cleanupOutput();}}>Blur background</button>
        </div>

      </div>
      <section className="studio-workspace-timeline">
        <div className="studio-timeline-resizer" role="separator" aria-label="Resize timeline height" aria-orientation="horizontal" aria-valuemin={300} aria-valuemax={650} aria-valuenow={timelineHeight} tabIndex={0} onKeyDown={e=>{if(e.key==="ArrowUp"||e.key==="ArrowDown"){e.preventDefault();setTimelineHeight(h=>Math.max(300,Math.min(650,h+(e.key==="ArrowUp"?20:-20))))}}} onPointerDown={e=>{timelineResize.current={y:e.clientY,height:timelineHeight};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const resize=timelineResize.current;if(resize)setTimelineHeight(Math.max(300,Math.min(650,resize.height+resize.y-e.clientY)))}} onPointerUp={()=>{timelineResize.current=null}} onPointerCancel={()=>{timelineResize.current=null}} onLostPointerCapture={()=>{timelineResize.current=null}}/>
        <h2 className="studio-timeline-heading">Timeline <small>{clips.length} clips · {timecode(duration)} total</small><button className="studio-merge-button" type="button" disabled={clips.length<2||busy||mp4Busy||projectSaving} onClick={()=>{stopPreview();exportDialog.current?.showModal()}}>Merge videos · {clips.length}</button></h2>
        <div className="studio-timeline-toolbar" role="group" aria-label="Timeline history"><button type="button" disabled={busy||!chosen||clips.length>=30} onClick={()=>{if(chosen)split(chosen.id)}}>✂ Split</button><button type="button" disabled={busy||!chosen} onClick={()=>{if(chosen)remove(chosen.id)}}>× Delete</button><button type="button" onClick={()=>setInspectorTab("effects")}>◇ Transitions</button><button type="button" disabled={busy||!chosen} onClick={()=>setInspectorTab("clip")}>Trim</button><button type="button" disabled={busy||!duration||captionCues.length>=500} onClick={()=>{addCue();setInspectorTab("layers")}}>+ Subtitle</button><button type="button" disabled={busy||projectSaving||!history.past.length} onClick={()=>restoreClips("undo")}>↶ Undo</button><button type="button" disabled={busy||projectSaving||!history.future.length} onClick={()=>restoreClips("redo")}>↷ Redo</button></div>
        {duration>0&&<section className="studio-track-section" aria-label="Time-based timeline">
          <div className="studio-track-toolbar"><button type="button" title="Move selected video earlier" disabled={busy||projectSaving||mp4Busy||!chosen||clips[0]?.id===active} onClick={()=>{if(chosen){stopPreview();move(chosen.id,-1)}}}>← Move earlier</button><button type="button" title="Move selected video later" disabled={busy||projectSaving||mp4Busy||!chosen||clips[clips.length-1]?.id===active} onClick={()=>{if(chosen){stopPreview();move(chosen.id,1)}}}>Move later →</button><strong>{timecode(Math.min(playhead,duration))} / {timecode(duration)}</strong><button type="button" onClick={()=>setTimelineZoom(1)}>Fit timeline</button><button type="button" aria-pressed={snap} onClick={()=>setSnap(v=>!v)}>Snap {snap?"on":"off"}</button><label style={{fontSize:11}}>Zoom {timelineZoom}× <input aria-label="Timeline zoom" type="range" min={1} max={4} step={1} value={timelineZoom} onChange={e=>setTimelineZoom(Number(e.target.value))}/></label></div>
          <div className="studio-track-actions">
            <button type="button" disabled={busy||projectSaving||captionCues.length>=500} onClick={()=>{addCue();setInspectorTab("layers")}}>+ Subtitle</button>
            <button type="button" disabled={busy} onClick={()=>{setIncludeAudio(v=>!v);cleanupOutput()}}>{includeAudio?"Mute source track":"Unmute source track"}</button>
            <button type="button" disabled={busy||!backgroundMusic} onClick={()=>{setMusicVolume(v=>v===0?.3:0);cleanupOutput()}}>{musicVolume===0?"Unmute music":"Mute music"}</button>
          </div>
          <div className="studio-track-scroll">
            <div className="studio-track-grid" style={{width:`${timelineZoom*100}%`,minWidth:0}}>
              <div className="studio-playhead-overlay" aria-hidden="true"><span style={{left:(Math.min(playhead,duration)/duration*100)+"%"}}/></div>
              <span>Playhead</span><input aria-label="Timeline playhead" type="range" min={0} max={duration} step={.01} value={Math.min(playhead,duration)} disabled={busy} onChange={e=>seekTimeline(Number(e.target.value))} style={{width:"100%"}}/>
              <span>Time</span><div style={{display:"flex",justifyContent:"space-between",color:"#b8a8c9"}}>{Array.from({length:5},(_,i)=><span key={i}>{timecode(duration*i/4)}</span>)}</div>
              <span>Video</span><div style={{display:"flex",height:46,overflow:"hidden",background:"#241a32",borderRadius:4}}>{segments.map(({clip,index,length,start})=><button type="button" key={clip.id} disabled={busy} title={"Drag to reorder · "+clip.name+" · "+sec(length)} draggable={!busy&&!projectSaving&&!mp4Busy} onDragStart={e=>{if(busy||projectSaving||mp4Busy){e.preventDefault();return;}stopPreview();draggingClipId.current=clip.id;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",clip.id);}} onDragOver={e=>{if(!draggingClipId.current||busy||projectSaving||mp4Busy)return;e.preventDefault();e.dataTransfer.dropEffect="move";setDragTargetId(clip.id);}} onDragLeave={()=>setDragTargetId(current=>current===clip.id?null:current)} onDrop={e=>{e.preventDefault();reorderByDrop(clip.id);}} onDragEnd={()=>{draggingClipId.current=null;setDragTargetId(null);}} onClick={()=>{setInspectorCollapsed(false);setInspectorTab("clip");seekTimeline(start)}} aria-pressed={active===clip.id} className={"studio-video-track-clip"+(dragTargetId===clip.id?" is-drop-target":"")} style={{flex:"0 0 "+(length/duration*100)+"%",minWidth:0,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",background:active===clip.id?"#7544b0":"#44315e",color:"#fff",border:"1px solid #9277b5",fontSize:10}}><span className="studio-timeline-film"><ClipFilmstrip clip={clip}/><span className="studio-film-label"><span aria-hidden="true">⠿ </span>{index+1}. {clip.name}</span></span></button>)}</div>
              <span>Source audio</span><div style={{display:"flex",height:24,overflow:"hidden",background:"#241a32",borderRadius:4}}>{segments.map(({clip,length,start})=><button type="button" key={clip.id} disabled={busy} onClick={()=>seekTimeline(start)} title={clip.name+" source audio"} style={{flex:"0 0 "+(length/duration*100)+"%",minWidth:0,overflow:"hidden",background:includeAudio&&(clip.gain??1)>0?"#265749":"#352c42",color:"#fff",border:"1px solid #4d786d",fontSize:10}}>{!includeAudio?"Muted":sourceWaves[clip.id]?<svg viewBox="0 0 96 20" preserveAspectRatio="none" width="100%" height="100%" aria-label="Decoded source audio waveform">{sourceWaves[clip.id].slice(Math.floor(clip.start/clip.duration*96),Math.max(1,Math.ceil(clip.end/clip.duration*96))).map((p,i,arr)=><line key={i} x1={(i+.5)*96/arr.length} x2={(i+.5)*96/arr.length} y1={10-p*9} y2={10+p*9} stroke="#b9e8ce" strokeWidth=".8"/>)}</svg>:Math.round((clip.gain??1)*100)+"%"}</button>)}</div>
              <span>Music</span><div style={{height:backgroundMusic?24:16,background:backgroundMusic?"#304d75":"#241a32",borderRadius:4,overflow:"hidden",padding:3}}>{backgroundMusic?(musicPeaks.length?<svg viewBox="0 0 128 20" preserveAspectRatio="none" width="100%" height="100%" aria-label="Decoded music waveform"><title>{backgroundMusic.name+" · "+sec(musicLength)}</title>{musicPeaks.map((p,i)=><line key={i} x1={i+.5} x2={i+.5} y1={10-p*9} y2={10+p*9} stroke="#b9dcff" strokeWidth=".8"/>)}</svg>:backgroundMusic.name+" · loop"):"No soundtrack"}</div>
              <span>Voiceover</span><div style={{position:"relative",height:voiceover?28:16,background:"#241a32",overflow:"hidden",borderRadius:4}}>{voiceover&&voiceStart<duration&&<button type="button" disabled={busy} onPointerDown={e=>beginLayerDrag(e,voiceStart,Math.min(voiceLength,duration),start=>{setVoiceStart(start);cleanupOutput()})} onPointerMove={moveLayerDrag} onPointerUp={endLayerDrag} onPointerCancel={endLayerDrag} onClick={()=>layerClick(()=>seekTimeline(voiceStart))} title={voiceover.name+" · Drag to move"} style={{position:"absolute",left:(voiceStart/duration*100)+"%",width:(Math.min(voiceLength,duration-voiceStart)/duration*100)+"%",height:28,background:"#71458c",color:"#fff",overflow:"hidden",padding:0,touchAction:"none",cursor:"grab"}}>{voicePeaks.length>0?<svg viewBox="0 0 96 28" preserveAspectRatio="none" width="100%" height="100%" aria-label="Decoded voice waveform">{voicePeaks.map((p,i)=><line key={i} x1={i+.5} x2={i+.5} y1={14-p*13} y2={14+p*13} stroke="#e8d3ff" strokeWidth=".8"/>)}</svg>:voiceover.name}</button>}</div>
              <span>Images</span><div style={{height:Math.max(16,imageLayers.length*22),position:"relative",background:"#241a32",overflow:"hidden"}}>{imageLayers.filter(l=>l.start<duration).map((l,i)=><button type="button" key={l.id} disabled={busy} onPointerDown={e=>beginLayerDrag(e,l.start,l.end-l.start,start=>{setSelectedImage(l.id);setImageLayers(old=>old.map(a=>a.id===l.id?{...a,start,end:start+(l.end-l.start)}:a));cleanupOutput()})} onPointerMove={moveLayerDrag} onPointerUp={endLayerDrag} onPointerCancel={endLayerDrag} onClick={()=>layerClick(()=>{setInspectorTab("layers");setSelectedImage(l.id);seekTimeline(l.start)})} title="Drag image layer to move" style={{touchAction:"none",cursor:"grab",position:"absolute",left:(l.start/duration*100)+"%",width:((Math.min(l.end,duration)-l.start)/duration*100)+"%",top:i*22,height:21,background:selectedImage===l.id?"#a66b40":"#644436",color:"#fff",overflow:"hidden"}}>{l.file.name}</button>)}</div>
              <span>Title</span><div style={{height:titleOverlay?24:16,background:titleOverlay?"#69482b":"#241a32",borderRadius:4,overflow:"hidden",padding:3}}>{titleOverlay||"No title overlay"}</div>
              <span>Subtitles</span><div style={{height:captionCues.length?28:16,position:"relative",overflow:"hidden",background:"#241a32",borderRadius:4}}>{captionCues.map((c,i)=>({c,i})).filter(({c})=>c.start<duration).map(({c,i})=><button key={i} type="button" disabled={busy} title={c.text+" · "+sec(c.start)+"–"+sec(c.end)} onPointerDown={e=>beginLayerDrag(e,c.start,c.end-c.start,start=>{setSelectedCue(i);setCaptionCues(old=>old.map((cue,index)=>index===i?{...cue,start,end:start+(c.end-c.start)}:cue));cleanupOutput()})} onPointerMove={moveLayerDrag} onPointerUp={endLayerDrag} onPointerCancel={endLayerDrag} onClick={()=>layerClick(()=>{setInspectorTab("layers");setSelectedCue(i);seekTimeline(c.start)})} style={{touchAction:"none",cursor:"grab",position:"absolute",left:(c.start/duration*100)+"%",width:((Math.min(c.end,duration)-c.start)/duration*100)+"%",height:26,overflow:"hidden",whiteSpace:"nowrap",background:selectedCue===i?"#b1842f":"#795b22",border:"1px solid #bc9343",color:"#fff",fontSize:10}}>{c.text}</button>)}</div>
            </div>
          </div>



        </section>}

      </section>
      <aside className="studio-inspector">
        <div className="studio-inspector-tabs" role="group" aria-label="Inspector panels">{([["clip","Video"],["audio","Audio"],["effects","Effects"],["layers","Layers"],["export","Export"]] as const).map(([id,label])=><button type="button" key={id} aria-pressed={inspectorTab===id} onClick={()=>{if(id==="export"){stopPreview();exportDialog.current?.showModal()}else setInspectorTab(id)}}>{label}</button>)}</div>
        <div hidden={inspectorTab!=="clip"} className="studio-inspector-content">
        <h2 style={{ fontSize: 14, marginTop: 0 }}>Selected clip</h2>
        {chosen ? <>
          <div style={{ fontSize: 11, overflowWrap: "anywhere", marginBottom: 10 }}>{chosen.name}</div>
          <details className="studio-property-group"><summary>Trim & duration</summary><div className="studio-property-body"><label style={{ display: "block", fontSize: 11 }}>Start (seconds)<input aria-label="Trim start" type="number" min={0} max={chosen.end - .1} step=".1" disabled={busy} value={Number(chosen.start.toFixed(1))} onChange={e => { const start = Number(e.target.value); if (Number.isFinite(start) && start >= 0 && start < chosen.end - .05) update(chosen.id, { start }); }} style={{ width: "100%" }} /></label>
          <label style={{ display: "block", fontSize: 11, marginTop: 10 }}>End (seconds)<input aria-label="Trim end" type="number" min={chosen.start + .1} max={chosen.duration} step=".1" disabled={busy} value={Number(chosen.end.toFixed(1))} onChange={e => { const end = Number(e.target.value); if (Number.isFinite(end) && end <= chosen.duration && end > chosen.start + .05) update(chosen.id, { end }); }} style={{ width: "100%" }} /></label>
          </div></details><div style={{display:"grid",gap:6}}><details className="studio-property-group" open><summary>Transform</summary><div className="studio-property-body">
            <label>Rotation<select disabled={busy} value={chosen.rotation||0} onChange={e=>update(chosen.id,{rotation:Number(e.target.value)})}><option value={0}>0°</option><option value={90}>90°</option><option value={180}>180°</option><option value={270}>270°</option></select></label>
            <button type="button" disabled={busy} aria-pressed={!!chosen.flipX} onClick={()=>update(chosen.id,{flipX:!chosen.flipX})}>Flip horizontal</button>
            <button type="button" disabled={busy} aria-pressed={!!chosen.flipY} onClick={()=>update(chosen.id,{flipY:!chosen.flipY})}>Flip vertical</button>
            <label>Zoom · {(chosen.zoom||1).toFixed(2)}×<input type="range" min={1} max={3} step={.05} disabled={busy} value={chosen.zoom||1} onChange={e=>update(chosen.id,{zoom:Number(e.target.value)})}/></label>
            </div></details><details className="studio-property-group"><summary>Crop & position</summary><div className="studio-property-body">
            {(["cropLeft","cropRight","cropTop","cropBottom"] as const).map(edge=><label key={edge}>{edge.replace("crop","Crop ")} · {Math.round((chosen[edge]||0)*100)}%<input aria-label={edge} type="range" min={0} max={.4} step={.01} disabled={busy} value={chosen[edge]||0} onChange={e=>update(chosen.id,{[edge]:Number(e.target.value)})}/></label>)}
            {(["panX","panY"] as const).map(axis=><label key={axis}>{axis==="panX"?"Horizontal position":"Vertical position"} · {Math.round((chosen[axis]||0)*100)}%<input aria-label={axis} type="range" min={-1} max={1} step={.02} disabled={busy} value={chosen[axis]||0} onChange={e=>update(chosen.id,{[axis]:Number(e.target.value)})}/></label>)}
            </div></details><details className="studio-property-group"><summary>Speed & source audio</summary><div className="studio-property-body">
            <button type="button" disabled={busy} onClick={()=>void decodeSourceWave(chosen)}>Decode source audio waveform</button>{waveStatus&&<small role="status">{waveStatus}</small>}
            <label>Speed<select disabled={busy} value={chosen.speed||1} onChange={e=>update(chosen.id,{speed:Number(e.target.value)})}>{[.5,.75,1,1.25,1.5,2].map(v=><option key={v} value={v}>{v}×</option>)}</select></label>
            <label>Source volume · {Math.round((chosen.gain??1)*100)}%<input type="range" min={0} max={1} step={.05} disabled={busy} value={chosen.gain??1} onChange={e=>update(chosen.id,{gain:Number(e.target.value)})}/></label>
            </div></details><details className="studio-property-group"><summary>Trim tools & reset</summary><div className="studio-property-body"><button type="button" disabled={busy} onClick={()=>update(chosen.id,{rotation:0,flipX:false,flipY:false,zoom:1,speed:1,gain:1,cropLeft:0,cropRight:0,cropTop:0,cropBottom:0,panX:0,panY:0})}>Reset clip adjustments</button>
            <label style={{fontSize:11}}>Trim start · {sec(chosen.start)}
              <input aria-label="Drag trim start" type="range" min={0} max={Math.max(0,chosen.end-.05)} step=".01" value={chosen.start} disabled={busy} onChange={e=>{const start=Number(e.target.value);if(start<chosen.end-.049){update(chosen.id,{start});if(preview.current)preview.current.currentTime=start;}}} style={{width:"100%"}}/>
            </label>
            <label style={{fontSize:11}}>Trim end · {sec(chosen.end)}
              <input aria-label="Drag trim end" type="range" min={Math.min(chosen.duration,chosen.start+.05)} max={chosen.duration} step=".01" value={chosen.end} disabled={busy} onChange={e=>{const end=Number(e.target.value);if(end>chosen.start+.049){update(chosen.id,{end});if(preview.current)preview.current.currentTime=end;}}} style={{width:"100%"}}/>
            </label>
            <button type="button" disabled={busy} onClick={()=>setTrimAtPlayhead("start")}>Set start at playhead</button>
            <button type="button" disabled={busy} onClick={()=>setTrimAtPlayhead("end")}>Set end at playhead</button>
            <button type="button" disabled={busy||clips.length>=30} onClick={()=>duplicate(chosen.id)}>Duplicate clip</button>
            <button type="button" disabled={busy} onClick={()=>{update(chosen.id,{start:0,end:chosen.duration});if(preview.current)preview.current.currentTime=0;}}>Reset trim</button>
          </div></details></div>
          <button type="button" disabled={busy||clips.length>=30} onClick={() => split(chosen.id)} style={{ width: "100%", marginTop: 10 }}>✂ Split at playhead</button>
        </> : <small>Choose a clip from the timeline.</small>}
        </div>
    <section className="studio-export-settings" aria-label="Video export settings">
      <div hidden={inspectorTab!=="effects"}><h2>Transitions</h2><div className="studio-export-basics">
        <label className="studio-setting-toggle">
          <input disabled={busy} type="checkbox" checked={fadeBetweenClips} onChange={e=>{setFadeBetweenClips(e.target.checked);cleanupOutput()}} />
          <span>Fade between clips</span>
        </label>{fadeBetweenClips&&<div style={{display:"grid",gap:6}}><label>Transition style<select disabled={busy} value={transitionStyle} onChange={e=>{setTransitionStyle(e.target.value as TransitionStyle);cleanupOutput()}}><option value="black">Fade through black</option><option value="white">Fade through white</option><option value="wipe-left">Black wipe left</option><option value="wipe-right">Black wipe right</option><option value="zoom">Zoom through black</option><option value="slide">Slide through black</option><option value="dissolve">Dissolve through black</option><option value="crossfade">True crossfade (MP4 worker only)</option></select></label><label>Transition duration {transitionDuration.toFixed(1)}s<input type="range" min={.1} max={2} step={.1} disabled={busy} value={transitionDuration} onChange={e=>{setTransitionDuration(Number(e.target.value));cleanupOutput()}}/></label><small>{transitionStyle==="crossfade"?"MP4 only. Browser preview does not show overlapping clips. Estimated MP4 duration: "+sec(duration-clips.slice(1).reduce((n,c,i)=>n+Math.min(transitionDuration,(c.end-c.start)/(c.speed||1)/3,(clips[i].end-clips[i].start)/(clips[i].speed||1)/3),0)):"Local/WebM; these transitions pass through a solid color."}</small></div>}
      </div>
      </div>
      <div className="studio-export-extras" hidden={inspectorTab!=="audio"&&inspectorTab!=="layers"}>
        <div className="studio-setting-card" hidden={inspectorTab!=="audio"}>
          <strong>Background music (licensed audio)</strong>
          <input ref={musicPicker} hidden aria-label="Background music file" type="file" accept="audio/*" disabled={busy}
            onChange={e=>{const next=e.target.files?.[0]||null;e.target.value="";
              if(next&&next.size>25_000_000){setState("Background music exceeds 25 MB.");return;}
              setBackgroundMusic(next);cleanupOutput();
            }} />
          <button type="button" className="studio-setting-file-button" disabled={busy} onClick={()=>musicPicker.current?.click()}>
            {backgroundMusic?"Change music":"Choose audio file"}
          </button>
          <small className="studio-setting-file-name" title={backgroundMusic?.name||"No audio selected"}>
            {backgroundMusic?.name||"No audio selected · max 25 MB"}
          </small>
          {backgroundMusic&&<label className="studio-setting-volume">Music level {Math.round(musicVolume*100)}%
            <input aria-label="Music volume" type="range" min="0" max="1" step=".05" disabled={busy}
              value={musicVolume} onChange={e=>{setMusicVolume(Number(e.target.value));cleanupOutput()}} />
          </label>}
          <fieldset disabled={busy||mp4Busy||projectSaving} className="studio-audio-processing"><legend>Audio processing</legend><label><input type="checkbox" checked={aiDenoise} onChange={e=>{setAiDenoise(e.target.checked);if(e.target.checked)setNoiseReduction(false);cleanupOutput()}}/>AI Noise Reduction · MP4</label><label><input type="checkbox" checked={noiseReduction} onChange={e=>{setNoiseReduction(e.target.checked);if(e.target.checked)setAiDenoise(false);cleanupOutput()}}/>Spectral noise reduction · MP4</label>
            <label><input type="checkbox" checked={lowCut} onChange={e=>{setLowCut(e.target.checked);cleanupOutput()}}/>Source low-cut (80 Hz rumble filter)</label>
            <label><input type="checkbox" checked={audioCompressor} onChange={e=>{setAudioCompressor(e.target.checked);cleanupOutput()}}/>Source dynamics compressor</label>
            <label><input type="checkbox" checked={audioDucking} onChange={e=>{setAudioDucking(e.target.checked);cleanupOutput()}}/>Duck music during voiceover</label>
            {audioDucking&&<label>Music level during voice {Math.round(duckLevel*100)}%<input type="range" min={0} max={1} step={.05} value={duckLevel} onChange={e=>{setDuckLevel(Number(e.target.value));cleanupOutput()}}/></label>}
          </fieldset>
          {backgroundMusic&&<button type="button" disabled={busy} className="studio-setting-secondary" onClick={()=>{setBackgroundMusic(null);cleanupOutput()}}>Remove music</button>}
        </div>
        <div className="studio-setting-card" hidden={inspectorTab!=="layers"}>
          <strong>Image & logo layers · MP4 / WebM</strong>
          <input ref={imagePicker} hidden type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(!file||duration<.1)return;if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>10_000_000||imageLayers.length>=8){setState("Use PNG, JPEG or WebP under 10 MB; maximum 8 layers.");return;}const id=crypto.randomUUID(),start=Math.max(0,Math.min(playhead,duration-.1));setImageLayers(old=>[...old,{id,file,start,end:duration,x:.8,y:.2,size:.25,opacity:1}]);setSelectedImage(id);cleanupOutput();}}/>
          <button type="button" className="studio-setting-file-button" disabled={busy||mp4Busy||projectSaving||!duration||imageLayers.length>=8} onClick={()=>imagePicker.current?.click()}>+ Add image / logo</button>
          <small>{imageLayers.length}/8 layers · PNG, JPEG, WebP · max 10 MB each{!duration?" · Add a video first":""}</small>
          {imageLayers.length>0&&<select aria-label="Select image layer" value={selectedImage||""} disabled={busy} onChange={e=>setSelectedImage(e.target.value)}><option value="">Select layer</option>{imageLayers.map(l=><option key={l.id} value={l.id}>{l.file.name}</option>)}</select>}
          {imageLayers.filter(l=>l.id===selectedImage).map(l=><fieldset key={l.id} disabled={busy} style={{display:"grid",gap:6}}><legend>Selected image</legend>
          <label>Start (s)<input type="number" min={0} max={l.end-.01} step={.1} value={l.start} onChange={e=>{const n=Number(e.target.value);if(n>=0&&n<l.end){setImageLayers(old=>old.map(a=>a.id===l.id?{...a,start:n}:a));cleanupOutput();}}}/></label>
          <label>End (s)<input type="number" min={l.start+.01} max={duration} step={.1} value={l.end} onChange={e=>{const n=Number(e.target.value);if(n>l.start&&n<=duration){setImageLayers(old=>old.map(a=>a.id===l.id?{...a,end:n}:a));cleanupOutput();}}}/></label>
          {(["x","y","size","opacity"] as const).map(k=><label key={k}>{k} {Math.round(l[k]*100)}%<input type="range" min={k==="size"?.05:0} max={1} step={.01} value={l[k]} onChange={e=>{setImageLayers(old=>old.map(a=>a.id===l.id?{...a,[k]:Number(e.target.value)}:a));cleanupOutput();}}/></label>)}
          <button type="button" onClick={()=>{const at=Math.max(0,Math.min(l.end-l.start,playhead-l.start));const key={at,x:l.x,y:l.y,size:l.size,opacity:l.opacity};setImageLayers(old=>old.map(a=>a.id===l.id?{...a,keyframes:[...(a.keyframes||[]).filter(k=>Math.abs(k.at-at)>.01),key].sort((a,b)=>a.at-b.at).slice(0,32)}:a));cleanupOutput();}}>Add/update keyframe at playhead</button>
          {(l.keyframes||[]).map((k,i)=><div key={i} style={{display:"grid",gap:4,border:"1px solid #4c355d",padding:5}}><button type="button" onClick={()=>seekTimeline(l.start+k.at)}>Keyframe {i+1} · {sec(k.at)}</button>{(["x","y","size","opacity"] as const).map(axis=><label key={axis}>{axis} {Math.round(k[axis]*100)}%<input type="range" min={axis==="size"?.05:0} max={1} step={.01} value={k[axis]} onChange={e=>{setImageLayers(old=>old.map(a=>a.id===l.id?{...a,keyframes:(a.keyframes||[]).map((f,j)=>j===i?{...f,[axis]:Number(e.target.value)}:f)}:a));cleanupOutput();}}/></label>)}<button type="button" onClick={()=>{setImageLayers(old=>old.map(a=>a.id===l.id?{...a,keyframes:(a.keyframes||[]).filter((_,j)=>j!==i)}:a));cleanupOutput();}}>Delete keyframe</button></div>)}
          <button type="button" onClick={()=>{setImageLayers(old=>old.filter(a=>a.id!==l.id));setSelectedImage(null);cleanupOutput();}}>Remove image layer</button></fieldset>)}
        </div><div className="studio-setting-card" hidden={inspectorTab!=="audio"}>
          <strong>Voiceover · MP4 / WebM</strong>
          <input ref={voicePicker} hidden type="file" accept="audio/*" disabled={busy} onChange={e=>{const f=e.target.files?.[0];e.target.value="";if(!f)return;if(f.size>25_000_000||!f.type.startsWith("audio/")){setState("Choose an audio file under 25 MB.");return;}setVoiceLength(0);setVoicePeaks([]);setVoiceover(f);cleanupOutput();}}/>
          <button type="button" disabled={busy} onClick={()=>voicePicker.current?.click()}>{voiceover?"Replace voiceover":"Choose voiceover file"}</button>
          {voiceover&&<><small>{voiceover.name} · {sec(voiceLength)}</small><label>Start (seconds)<input type="number" min={0} max={duration} step={.1} disabled={busy} value={voiceStart} onChange={e=>{setVoiceStart(Math.max(0,Math.min(duration,Number(e.target.value)||0)));cleanupOutput();}}/></label><label>Voice volume {Math.round(voiceVolume*100)}%<input type="range" min={0} max={1} step={.05} value={voiceVolume} disabled={busy} onChange={e=>{setVoiceVolume(Number(e.target.value));cleanupOutput();}}/></label><button type="button" disabled={busy} onClick={()=>{setVoiceover(null);setVoiceLength(0);cleanupOutput()}}>Remove voiceover</button></>}
        </div><div className="studio-setting-card" hidden={inspectorTab!=="layers"}>
          <label className="studio-setting-field" htmlFor="studio-video-title">Video title
            <input id="studio-video-title" aria-label="Video title overlay" disabled={busy} value={titleOverlay} maxLength={120}
              onChange={e=>{setTitleOverlay(e.target.value);cleanupOutput()}} placeholder="Optional on-screen title" />
          </label>
          <small>Optional on-screen title · WebM only at present.</small>
        </div>
        <div className="studio-setting-card" hidden={inspectorTab!=="layers"}>
          <strong>Subtitles (.srt) · WebM only</strong>
          <input ref={subtitlePicker} hidden type="file" disabled={busy} accept=".srt,text/plain" aria-label="Import SRT subtitles"
            onChange={e=>{
              const file=e.target.files?.[0];e.target.value="";
              if(!file)return;
              if(file.size>250_000){setState("Subtitle file exceeds 250 KB.");return;}
              void file.text().then(source=>{
                const cues=parseSrt(source);setSelectedCue(null);setCaptionCues(cues);setSubtitleName(cues.length?file.name:"");cleanupOutput();
                setState(cues.length?cues.length+" subtitle cues loaded for burn-in export.":"No valid SRT subtitle cues found.");
              }).catch(()=>setState("Could not read subtitles."));
            }} />
          <button type="button" className="studio-setting-file-button" disabled={busy} onClick={()=>subtitlePicker.current?.click()}>
            {captionCues.length?"Replace subtitles":"Choose SRT file"}
          </button>
          <small className="studio-setting-file-name" title={subtitleName||"No subtitle file selected"}>
            {subtitleName||"No subtitle file selected · max 250 KB"}
          </small>
          <button type="button" disabled={busy||!duration||captionCues.length>=500} onClick={addCue}>+ Add subtitle at playhead</button>
          {captionCues.length>0&&<label className="studio-setting-field">Select subtitle<select value={selectedCue===null?"":selectedCue} onChange={e=>{const value=e.target.value;if(value===""){setSelectedCue(null);return;}const index=Number(value);setSelectedCue(index);seekTimeline(captionCues[index].start)}}><option value="">Choose subtitle</option>{captionCues.map((cue,index)=><option key={index} value={index}>{sec(cue.start)} · {cue.text.slice(0,55)}</option>)}</select></label>}
          {selectedCue!==null&&captionCues[selectedCue]&&<fieldset className="studio-caption-inspector"><legend>Edit selected subtitle</legend>
            <label>Text<input disabled={busy} maxLength={500} value={captionCues[selectedCue].text} onChange={e=>editCue(selectedCue,{text:e.target.value})}/></label>
            <label>Start (seconds)<input disabled={busy} type="number" min={0} max={captionCues[selectedCue].end-.01} step={.01} value={captionCues[selectedCue].start} onChange={e=>editCue(selectedCue,{start:Number(e.target.value)})}/></label>
            <label>End (seconds)<input disabled={busy} type="number" min={captionCues[selectedCue].start+.01} max={duration} step={.01} value={captionCues[selectedCue].end} onChange={e=>editCue(selectedCue,{end:Number(e.target.value)})}/></label>
            <button type="button" disabled={busy} onClick={()=>{setCaptionCues(old=>old.filter((_,i)=>i!==selectedCue));setSelectedCue(null);cleanupOutput()}}>Delete selected subtitle</button>
          </fieldset>}
          {captionCues.length>0&&<button type="button" className="studio-setting-secondary" disabled={busy}
            onClick={()=>{setCaptionCues([]);setSelectedCue(null);setSubtitleName("");cleanupOutput()}}>Clear {captionCues.length} subtitles</button>}
        </div>
      </div>
    </section>
    </aside>
    </div>
    <dialog ref={exportDialog} className="studio-export-dialog" aria-labelledby="studio-export-dialog-title" onCancel={e=>{if(busy||mp4Busy||projectSaving)e.preventDefault()}}>
      <div className="studio-export-dialog-header"><h2 id="studio-export-dialog-title">{clips.length>1?"Merge & export videos":"Export video"}</h2><button type="button" aria-label="Close export" disabled={busy||mp4Busy||projectSaving} onClick={()=>exportDialog.current?.close()}>×</button></div>
      <p className="studio-format-help">{t("All clips are combined in timeline order into one output file.","Tüm klipler zaman çizelgesi sırasıyla tek dosyada birleştirilir.")}</p><button type="button" disabled={busy||mp4Busy||!clips.length} onClick={()=>{exportDialog.current?.close();seekTimeline(0);}}>{t("Review timeline preview","Zaman çizelgesi önizlemesini kontrol et")}</button><div className="studio-export-summary"><div><small>Duration</small><strong>{timecode(duration)}</strong></div><div><small>Dimensions</small><strong>{outputWidth} × {outputHeight}</strong></div><div><small>Estimated size</small><strong>{exportFormat==="webm"&&duration?`~${(duration*(videoBitrate/1_000_000+.128)/8).toFixed(1)} MB`:"—"}</strong></div></div><small>{exportFormat==="webm"?`Target video bitrate ${(videoBitrate/1_000_000).toFixed(1)} Mbps; actual file size varies.`:"Cloud encoder determines actual file size."}</small>
      <div className="studio-export-format" role="group" aria-label="Export format">
        <button type="button" aria-pressed={exportFormat==="mp4"} disabled={busy||mp4Busy||projectSaving} onClick={()=>setExportFormat("mp4")}><strong>MP4</strong><small>H.264 + AAC · Cloud rendering</small></button>
        <button type="button" aria-pressed={exportFormat==="webm"} disabled={busy||mp4Busy||projectSaving} onClick={()=>setExportFormat("webm")}><strong>WebM</strong><small>Browser rendering · Local</small></button>
      </div>
      <p className="studio-format-help">{exportFormat==="mp4"?"MP4 is recommended for sharing. Sign in and save up to 90 MB of source files to your private cloud project.":"WebM renders on this device. AI noise removal and true crossfade require MP4."}</p>
      <div className="studio-export-basics">
        <label className="studio-setting-field">Ratio
          <select disabled={busy} value={ratio} onChange={e=>{setRatio(e.target.value as typeof ratio);cleanupOutput()}}>
            <option>16:9</option><option>9:16</option><option>1:1</option>
          </select>
        </label>
        <label className="studio-setting-field">Framing
          <select disabled={busy} aria-label="Video framing mode" value={framing} onChange={e=>{setFraming(e.target.value as "cover"|"contain"|"blur");cleanupOutput()}}>
            <option value="contain">Show full video (no cropping)</option><option value="cover">Fill screen (crop edges)</option><option value="blur">Blur background</option>
          </select>
        </label>
        <label className="studio-setting-field">Resolution
          <select disabled={busy} value={resolution} onChange={e=>{setResolution(Number(e.target.value));cleanupOutput()}}>
            <option value={480}>480p</option><option value={720}>720p</option><option value={1080}>1080p</option>
          </select>
        </label>
        {<><label className="studio-setting-field">Frame rate<select disabled={busy} value={webmFps} onChange={e=>{setWebmFps(Number(e.target.value));cleanupOutput()}}>{[24,25,30,60].map(n=><option key={n} value={n}>{n} FPS</option>)}</select></label><label className="studio-setting-field">Quality<select disabled={busy} value={webmQuality} onChange={e=>{setWebmQuality(e.target.value);cleanupOutput()}}><option value="low">Low</option><option value="standard">Standard</option><option value="high">High</option></select></label><label className="studio-setting-field">File name<input disabled={busy} value={exportName} maxLength={100} onChange={e=>setExportName(e.target.value)}/></label></>}
        <label className="studio-setting-toggle">
          <input disabled={busy} type="checkbox" checked={includeAudio} onChange={e=>{setIncludeAudio(e.target.checked);cleanupOutput()}} />
          <span>Include source audio</span>
        </label>
</div>
      <div className="studio-export-actions">
        {exportFormat==="mp4"&&!signedIn&&<div><small role="status">{t("Sign in for private MP4 rendering. Your current project will be preserved in this browser.","Özel MP4 üretimi için giriş yapın. Mevcut projeniz bu tarayıcıda korunur.")}</small><button type="button" disabled={projectSaving||busy} onClick={()=>void signInForMp4()}>{t("Sign in & continue","Giriş yap ve devam et")}</button></div>}

        {exportFormat==="mp4"&&fadeBetweenClips&&!["black","crossfade"].includes(transitionStyle)&&<small role="status">Choose fade through black or true crossfade for MP4, or use WebM.</small>}
        {exportFormat==="webm"&&((fadeBetweenClips&&transitionStyle==="crossfade")||aiDenoise||noiseReduction)&&<small role="status">Selected effects require MP4. Choose MP4 or turn off these effects.</small>}
        <button type="button" className="studio-export-primary"
          disabled={!clips.length||busy||projectSaving||mp4Busy||(exportFormat==="mp4"?(!signedIn||(fadeBetweenClips&&!["black","crossfade"].includes(transitionStyle))):(!supportedMime()||(fadeBetweenClips&&transitionStyle==="crossfade")||aiDenoise||noiseReduction))}
          onClick={()=>{if(exportFormat==="mp4")void submitMp4();else void exportVideo();}}>
          {mp4Busy?"Preparing MP4…":busy?"Rendering WebM…":exportFormat==="mp4"?t("Export MP4","MP4 dışa aktar"):t("Export WebM","WebM dışa aktar")}
        </button>
        {!clips.length&&<small>Add at least one video clip to enable export.</small>}
        {busy&&<button type="button" onClick={()=>{cancel.current=true;}}>Cancel</button>}
        {busy&&<div className="studio-render-progress" role="status"><strong>{exportPhase} · {progress}%</strong><progress max={100} value={progress}/><small>{exportEta!==null?`Estimated remaining: ${timecode(exportEta)}`:"Preparing or finalizing media…"}</small></div>}
        {downloadUrl&&<div className="studio-render-result"><strong role="status">{exportResult}</strong><video controls playsInline preload="metadata" src={downloadUrl}/><a href={downloadUrl} download={fileBase+".webm"}>↓ Download WebM</a></div>}
        {mp4Message&&<small role="status">{mp4Message}</small>}
        <details className="studio-export-help"><summary>Format & storage limits</summary><small>MP4 uses private cloud rendering (90 MB total source files). WebM renders locally. Titles and subtitles are burned into the output. AI noise reduction and true crossfade require MP4. Use media you have rights to.</small></details>
        {signedIn&&(exportFormat==="mp4"||mp4Jobs.length>0)&&<div className="studio-mp4-jobs">
          <div className="studio-mp4-jobs-heading"><strong>MP4 export history</strong><button type="button" disabled={mp4Busy} onClick={()=>void refreshMp4Jobs()}>Refresh</button></div>
          {!mp4Jobs.length&&<small>No cloud exports yet.</small>}
          {mp4Jobs.map(job=><div key={job.id} className="studio-mp4-job"><span>{job.status==="ready"?"Ready to download":job.status==="queued"?"Queued":job.status==="processing"?"Rendering…":job.status==="failed"?"Failed":job.status} · {job.id.slice(0,8)} {job.error_code||""}</span>{job.status==="ready"&&<button type="button" onClick={()=>void downloadMp4(job.id)}>Download MP4</button>}</div>)}
        </div>}
      </div>
    </dialog>

  </section>;
}
