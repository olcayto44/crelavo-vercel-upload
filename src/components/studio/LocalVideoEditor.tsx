"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { saveCloudTimeline, loadCloudTimeline } from "@/lib/studio-cloud-timeline";
import { addMediaRecorderWebmDuration } from "@/lib/studio-webm-duration";

type Clip = { id: string; file: File; name: string; url: string; duration: number; start: number; end: number; rotation?: number; flipX?: boolean; flipY?: boolean; zoom?: number; gain?: number; speed?: number; cropLeft?:number; cropRight?:number; cropTop?:number; cropBottom?:number; panX?:number; panY?:number };
const accept = "video/mp4,video/webm,video/quicktime,video/x-m4v";
const sec = (n: number) => Number.isFinite(n) ? n.toFixed(1) + "s" : "—";
const VIDEO_PROJECT_DB = "crelavo-studio-local-video-project-v1";
type CaptionCue = { start: number; end: number; text: string };
type ImageLayer={id:string;file:File;start:number;end:number;x:number;y:number;size:number;opacity:number};
type TransitionStyle="black"|"white"|"wipe-left"|"wipe-right";
type SavedVideoProject = { audioDucking?:boolean; duckLevel?:number; audioCompressor?:boolean; lowCut?:boolean; transitionStyle?:TransitionStyle; transitionDuration?:number; imageLayers?:ImageLayer[]; voiceover?:File|null; voiceStart?:number; voiceVolume?:number; voiceLength?:number; id: string; owner: string; savedAt: number; clips: Array<Omit<Clip, "url">>; ratio: "16:9" | "9:16" | "1:1"; resolution: number; includeAudio: boolean; captionCues?: CaptionCue[]; titleOverlay?: string; backgroundMusic?: File | null; musicVolume?: number; fadeBetweenClips?: boolean; framing?: "cover" | "contain" | "blur" };
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
  if(style==="wipe-left"||style==="wipe-right"){
    ctx.fillStyle="#000";const revealFromLeft=style==="wipe-left"?entering:!entering;
    ctx.fillRect(revealFromLeft?w*(1-amount):0,0,w*amount,h);
  }else{ctx.globalAlpha=Math.min(1,amount);ctx.fillStyle=style==="white"?"#fff":"#000";ctx.fillRect(0,0,w,h);}
  ctx.restore();
}
function paintImageLayers(ctx:CanvasRenderingContext2D,w:number,h:number,at:number,layers:ImageLayer[],images:Map<string,ImageBitmap>){
  for(const layer of layers){
    const image=images.get(layer.id);if(!image||at<layer.start||at>=layer.end)continue;
    const width=Math.min(w*layer.size,h*layer.size*image.width/image.height),height=width*image.height/image.width;
    ctx.save();ctx.globalAlpha=layer.opacity;ctx.drawImage(image,w*layer.x-width/2,h*layer.y-height/2,width,height);ctx.restore();
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
  const [projectOwner,setProjectOwner] = useState("");
  const [signedIn,setSignedIn] = useState(false);
  const [projectSaving,setProjectSaving] = useState(false);
  const [autoSave,setAutoSave]=useState(false);
  const [autoSaveStatus,setAutoSaveStatus]=useState("");
  const [clips, setClips] = useState<Clip[]>([]);
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
  },[allowAnonymousLocalSave]);
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
      const project:SavedVideoProject={id:projectOwner+":recovery",owner:projectOwner,savedAt:Date.now(),clips:clips.map(({url,...data})=>data),ratio,resolution,includeAudio,captionCues,titleOverlay:titleOverlay.slice(0,120),backgroundMusic,musicVolume,fadeBetweenClips,framing,voiceover,voiceStart,voiceVolume,voiceLength,imageLayers,transitionStyle,transitionDuration,audioDucking,duckLevel,audioCompressor,lowCut};
      setAutoSaveStatus("Saving recovery copy…");
      void saveProjectLocally(project).then(()=>{if(current)setAutoSaveStatus("Recovery saved at "+new Date(project.savedAt).toLocaleTimeString());}).catch(()=>{if(current)setAutoSaveStatus("Recovery save failed. Check browser storage.");});
    },2500);
    return()=>{current=false;window.clearTimeout(timer);};
  },[autoSave,projectOwner,busy,projectSaving,clips,ratio,resolution,includeAudio,captionCues,titleOverlay,backgroundMusic,musicVolume,fadeBetweenClips,framing,voiceover,voiceStart,voiceVolume,voiceLength,imageLayers,transitionStyle,transitionDuration,audioDucking,duckLevel,audioCompressor,lowCut]);
  async function saveTimeline(){
    if(!projectOwner||!clips.length||busy||projectSaving)return;
    const size=clips.reduce((sum,clip)=>sum+clip.file.size,0)+(backgroundMusic?.size||0)+(voiceover?.size||0)+imageLayers.reduce((n,l)=>n+l.file.size,0);
    if(size>150_000_000){setState("Local project save supports up to 150 MB of source clips. Export or reduce source size.");return;}
    setProjectSaving(true);
    try{
      const project: SavedVideoProject={
        id:projectOwner,owner:projectOwner,savedAt:Date.now(),
        clips:clips.map(({url,...data})=>data),
        ratio,resolution,includeAudio,captionCues,titleOverlay:titleOverlay.slice(0,120),backgroundMusic,musicVolume,fadeBetweenClips,framing,voiceover,voiceStart,voiceVolume,voiceLength,imageLayers,transitionStyle,transitionDuration,audioDucking,duckLevel,audioCompressor,lowCut
      };
      await saveProjectLocally(project);
      setState("Timeline saved to this browser for your Crelavo account. Other devices cannot access this copy.");
    }catch{setState("Could not save locally. Check available browser storage space.");}
    finally{setProjectSaving(false)}
  }
  async function reopenTimeline(recovery=false){
    if(!projectOwner||busy||projectSaving)return;
    setProjectSaving(true);
    try{
      const project=await openProjectLocally(recovery?projectOwner+":recovery":projectOwner);
      if(!project||project.owner!==projectOwner){setState("No locally saved video timeline found for this account.");return;}
      const restored: Clip[]=project.clips.map(clip=>({...clip,url:URL.createObjectURL(clip.file)}));
      changeHistory({past:[],future:[]});
      files.current=restored;
      setClips(restored);setActive(restored[0]?.id||null);
      setRatio(project.ratio);setResolution(project.resolution);setIncludeAudio(project.includeAudio);
      setCaptionCues(Array.isArray(project.captionCues)?project.captionCues:[]);setTitleOverlay(project.titleOverlay||'');
      setBackgroundMusic(project.backgroundMusic instanceof File?project.backgroundMusic:null);
      setImageLayers(Array.isArray(project.imageLayers)?project.imageLayers:[]);setSelectedImage(null);
      setVoiceover(project.voiceover instanceof File?project.voiceover:null);setVoiceStart(project.voiceStart||0);setVoiceVolume(project.voiceVolume??1);setVoiceLength(project.voiceLength||0);
      setMusicVolume(typeof project.musicVolume==='number'&&Number.isFinite(project.musicVolume)?Math.min(1,Math.max(0,project.musicVolume)):0.3);
      setAudioDucking(Boolean(project.audioDucking));setDuckLevel(project.duckLevel??.25);setAudioCompressor(Boolean(project.audioCompressor));setLowCut(Boolean(project.lowCut));
      setTransitionStyle(project.transitionStyle??"black");setTransitionDuration(project.transitionDuration??.4);
      setFadeBetweenClips(Boolean(project.fadeBetweenClips));setFraming(project.framing==="blur"?"blur":project.framing==="cover"?"cover":"contain");
      cleanupOutput();
      setState("Local timeline reopened. You can continue editing and exporting.");
    }catch{setState("Could not reopen this timeline in the current browser.");}
    finally{setProjectSaving(false)}
  }
  async function saveTimelineCloud(){
    if(!projectOwner||!signedIn||!clips.length||busy||projectSaving)return;
    if(audioDucking||audioCompressor||lowCut){setState("Advanced audio processing currently supports local projects and WebM. Disable these options before cloud save.");return;}
    if(fadeBetweenClips&&(transitionStyle!=="black"||transitionDuration!==.4)){setState("Custom transitions currently support local projects and WebM export. Select default black fade (0.4s) before cloud save.");return;}
    if(imageLayers.length){setState("Image layers currently support local save and WebM export. Remove image layers before cloud save.");return;}
    if(voiceover){setState("Voiceover currently supports local project save and WebM export. Remove voiceover before cloud save.");return;}
    setProjectSaving(true);setState("Uploading source clips to your private cloud…");
    try{
      const version=await saveCloudTimeline(clips,{
       ratio,resolution,includeAudio,captionCues,titleOverlay,backgroundMusic,musicVolume,fadeBetweenClips,framing
      });
      setState("Cloud timeline version "+version+" saved with its source files. You can reopen it on another device.");
    }catch(error){setState("Cloud save failed: "+(error instanceof Error?error.message:"Unknown error"));}
    finally{setProjectSaving(false)}
  }
  async function reopenTimelineCloud(){
    if(!projectOwner||!signedIn||busy||projectSaving)return;
    setProjectSaving(true);setState("Downloading your latest cloud timeline…");
    try{
      const saved=await loadCloudTimeline();
      const restored: Clip[]=saved.clips.map(clip=>({...clip,url:URL.createObjectURL(clip.file)}));
      changeHistory({past:[],future:[]});
      files.current=restored;setClips(restored);setActive(restored[0]?.id||null);
      setRatio(saved.ratio);setResolution(saved.resolution);setIncludeAudio(saved.includeAudio);
      setCaptionCues(saved.captionCues);setTitleOverlay(saved.titleOverlay);
      setImageLayers([]);setSelectedImage(null);
      setBackgroundMusic(saved.backgroundMusic);setMusicVolume(saved.musicVolume);setVoiceover(null);setVoiceStart(0);setVoiceLength(0);setVoiceVolume(1);
      setAudioDucking(false);setDuckLevel(.25);setAudioCompressor(false);setLowCut(false);
      setTransitionStyle("black");setTransitionDuration(.4);
      setFadeBetweenClips(saved.fadeBetweenClips);setFraming(saved.framing==="blur"?"blur":saved.framing==="cover"?"cover":"contain");cleanupOutput();
      setState("Cloud timeline version "+saved.version+" reopened with playable source media.");
    }catch(error){setState("Cloud reopen failed: "+(error instanceof Error?error.message:"Unknown error"));}
    finally{setProjectSaving(false)}
  }
  const chosen = clips.find(c => c.id === active);
  const blurCanvas=useRef<HTMLCanvasElement>(null);
  const [sourceAspect,setSourceAspect]=useState(0);
  const [timelineZoom,setTimelineZoom]=useState(1);
  const [playhead,setPlayhead]=useState(0);
  const [previewPlaying,setPreviewPlaying]=useState(false);
  const pendingSeek=useRef<{id:string;time:number}|null>(null);
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
        if(fadeBetweenClips)paintTransition(ctx,w,h,transitionStyle,transitionDuration,Math.max(0,(video.currentTime-chosen.start)/(chosen.speed||1)),(chosen.end-chosen.start)/(chosen.speed||1),clips.findIndex(c=>c.id===chosen.id),clips.length);
      }
      frame=requestAnimationFrame(draw);
    };draw();return()=>cancelAnimationFrame(frame);
  },[framing,chosen,ratio,clips,titleOverlay,captionCues,imageLayers,fadeBetweenClips,transitionStyle,transitionDuration]);
  const duration = clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start)/(clip.speed||1), 0);
  useEffect(()=>{if(preview.current&&chosen){preview.current.playbackRate=chosen.speed||1;preview.current.volume=Math.min(1,Math.max(0,chosen.gain??1));}},[chosen]);
  const segments=clips.map((clip,index)=>({clip,index,start:clips.slice(0,index).reduce((n,c)=>n+(c.end-c.start)/(c.speed||1),0),length:(clip.end-clip.start)/(clip.speed||1)}));
  function seekTimeline(at:number){
    if(busy||!segments.length)return;
    const time=Math.max(0,Math.min(duration,at));
    const segment=segments.find(s=>time<s.start+s.length)||segments[segments.length-1];
    const sourceTime=Math.min(segment.clip.end,segment.clip.start+(time-segment.start)*(segment.clip.speed||1));
    setPlayhead(time);
    if(active===segment.clip.id&&preview.current){preview.current.currentTime=sourceTime;}
    else{pendingSeek.current={id:segment.clip.id,time:sourceTime};setActive(segment.clip.id);}
  }
  function syncPlayhead(video:HTMLVideoElement){
    const segment=segments.find(s=>s.clip.id===active);
    if(segment)setPlayhead(segment.start+Math.max(0,Math.min(segment.length,(video.currentTime-segment.clip.start)/(segment.clip.speed||1))));
  }
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
    if(busy||!sourceId||sourceId===targetId)return;
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
    const mime = supportedMime();
    if (!mime || typeof HTMLCanvasElement.prototype.captureStream !== "function") {
      setState("This browser cannot record the edited timeline. Use a current Chrome or Edge browser."); return;
    }
    setBusy(true); cancel.current = false; setProgress(0); cleanupOutput();
    const width = ratio === "9:16" ? Math.round(resolution * 9 / 16 / 2) * 2 : ratio === "1:1" ? resolution : Math.round(resolution * 16 / 9 / 2) * 2;
    const height = ratio === "9:16" ? resolution : resolution;
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) { setBusy(false); setState("Canvas unavailable."); return; }
    const stream = canvas.captureStream(30);
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
      recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3_000_000 });
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
            setProgress(Math.min(99, Math.round(100 * (elapsed + Math.min(segment, Math.max(0, (video.currentTime - clip.start)/speed))) / duration)));
            if (video.currentTime >= clip.end - .04 || video.ended || performance.now() - begin > (segment + 6) * 1000) { resolve(); return; }
            raf = requestAnimationFrame(render);
          }; render();
        });
        cancelAnimationFrame(raf); video.pause(); source?.disconnect();
        video.removeAttribute("src"); video.load(); currentVideo = null;
        elapsed += segment;
      }
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
      const url = URL.createObjectURL(blob); output.current = url; setDownloadUrl(url);
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
  return <section className="studio-compact-video-editor" style={{ color: "#f4f0ff", background: "#110e1b", padding: "12px 16px 22px", minHeight: "100%", maxWidth: 1320, margin: "0 auto", fontFamily: "Inter,system-ui,sans-serif" }}>

    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div><a className="editor-back" href={"/dashboard/studio-v2?category="+encodeURIComponent(studioReturnCategory)+"&uiLang=en"}>← Back to Studio V2</a><h1 style={{ fontSize: 17, margin: "12px 0 0" }}>{t("Video Editor & Merge", "Video Düzenleme ve Birleştirme")}</h1><p style={{ color: "#b8a8c9", margin: "3px 0 4px", fontSize: 11 }}>{t("Add, remove, split, trim, reorder, and merge local videos. No AI credits or server upload.", "Yerel videoları ekle, çıkar, kes, böl, sırala ve birleştir. AI kredisi veya sunucu yüklemesi yok.")}</p></div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
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
      <label style={{ background: "#7036b5", padding: "7px 12px", borderRadius: 8, cursor: busy ? "not-allowed" : "pointer" }}>{t("+ Add videos", "+ Video ekle")}<input aria-label="Add local video clips" disabled={busy} type="file" multiple accept={accept} onChange={e => { void addFiles(e.target.files); e.currentTarget.value = ""; }} hidden /></label>
      </div>
    </header>
    {!signedIn&&allowAnonymousLocalSave&&<p style={{fontSize:11,color:"#d7c2ed",margin:"3px 0 8px"}}>Preview mode: local timeline saves stay in this browser. Sign in for private cloud backup.</p>}
    <div role="status" aria-live="polite" style={{ color: "#c7bad7", marginBottom: 12 }}>{state}</div>
    <div className="editor-main-grid">
      <div style={{ minWidth: 0 }}>
        <div className={"studio-video-preview-stage"+(ratio==="9:16"?" is-portrait":ratio==="1:1"?" is-square":" is-landscape")}> 
          <div className={"studio-video-preview-frame"+(ratio==="9:16"?" is-portrait":ratio==="1:1"?" is-square":" is-landscape")}
               style={{aspectRatio:ratio==="9:16"?"9 / 16":ratio==="1:1"?"1 / 1":"16 / 9"}}>
            {chosen ? <>{<canvas ref={blurCanvas} aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:1}}/>}<video key={chosen.id} ref={preview} src={chosen.url} playsInline preload="metadata"
              style={{width:"100%",height:"100%",objectFit:framing==="blur"?"contain":framing,display:"block",opacity:0,position:"relative",transform:`rotate(${chosen.rotation||0}deg) scale(${(chosen.flipX?-1:1)*(chosen.zoom||1)},${(chosen.flipY?-1:1)*(chosen.zoom||1)})`,...(framing==="blur"&&sourceAspect>0?{maxWidth:`${Math.min(1,sourceAspect/(ratio==="9:16"?9/16:ratio==="1:1"?1:16/9))*100}%`,maxHeight:`${Math.min(1,(ratio==="9:16"?9/16:ratio==="1:1"?1:16/9)/sourceAspect)*100}%`}: {})}}
              onLoadedMetadata={e => { const v=e.currentTarget;setSourceAspect(v.videoWidth/v.videoHeight);v.currentTime=pendingSeek.current?.id===chosen.id?pendingSeek.current.time:chosen.start;pendingSeek.current=null;v.playbackRate=chosen.speed||1;v.volume=Math.min(1,Math.max(0,chosen.gain??1)); }} onTimeUpdate={e=>syncPlayhead(e.currentTarget)} onPlay={()=>setPreviewPlaying(true)} onPause={()=>setPreviewPlaying(false)} onEnded={()=>setPreviewPlaying(false)} />
              </>
              : <div className="studio-video-no-clips">Add video files to begin editing</div>}
          </div>
        </div>
        {chosen&&<div role="group" aria-label="Preview playback" style={{display:"flex",gap:8,alignItems:"center",justifyContent:"center"}}><button type="button" disabled={busy} onClick={()=>{const v=preview.current;if(v){if(v.paused)void v.play().catch(()=>setState("Could not play clip."));else v.pause();}}}>{previewPlaying?"Pause":"Play"}</button><button type="button" disabled={busy} onClick={()=>{if(preview.current){preview.current.pause();preview.current.currentTime=chosen.start;}}}>Restart clip</button><span>{sec(Math.min(playhead,duration))}</span></div>}
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
        <p className="studio-video-framing-note" role="status">{framing==="cover"
          ?"Crop mode: side or top/bottom content can be removed. Switch to Show full video to keep all edges."
          :framing==="blur"?"Full video preserved with a blurred background.":"Full video preserved. Borders may appear when the source and output ratios differ."}</p>
        {chosen && <p className="studio-selected-clip-note">Preview: selected clip only ({sec(chosen.end-chosen.start)}). Timeline export combines all {clips.length} clip(s), {sec(duration)} total.</p>}
        <h2 style={{ fontSize: 14, marginTop: 10, marginBottom: 5 }}>Clip timeline · {sec(duration)} total</h2>
        <div role="group" aria-label="Timeline history" style={{display:"flex",gap:8,marginBottom:8}}><button type="button" disabled={busy||projectSaving||!history.past.length} onClick={()=>restoreClips("undo")}>↶ Undo</button><button type="button" disabled={busy||projectSaving||!history.future.length} onClick={()=>restoreClips("redo")}>↷ Redo</button></div>
        {duration>0&&<section aria-label="Time-based timeline" style={{border:"1px solid #463458",borderRadius:8,padding:8,marginBottom:10,background:"#171121"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}><strong style={{fontSize:12}}>Timeline · {sec(Math.min(playhead,duration))} / {sec(duration)}</strong><label style={{fontSize:11}}>Zoom {timelineZoom}× <input aria-label="Timeline zoom" type="range" min={1} max={4} step={1} value={timelineZoom} onChange={e=>setTimelineZoom(Number(e.target.value))}/></label></div>
          <div style={{overflowX:"auto",paddingBottom:4}}>
            <div style={{minWidth:Math.max(320,320*timelineZoom),display:"grid",gridTemplateColumns:"78px minmax(0,1fr)",gap:4,alignItems:"center",fontSize:10}}>
              <span>Playhead</span><input aria-label="Timeline playhead" type="range" min={0} max={duration} step={.01} value={Math.min(playhead,duration)} disabled={busy} onChange={e=>seekTimeline(Number(e.target.value))} style={{width:"100%"}}/>
              <span>Time</span><div style={{display:"flex",justifyContent:"space-between",color:"#b8a8c9"}}>{Array.from({length:5},(_,i)=><span key={i}>{sec(duration*i/4)}</span>)}</div>
              <span>Video</span><div style={{display:"flex",height:34,overflow:"hidden",background:"#241a32",borderRadius:4}}>{segments.map(({clip,index,length,start})=><button type="button" key={clip.id} disabled={busy} title={clip.name+" · "+sec(length)} onClick={()=>seekTimeline(start)} aria-pressed={active===clip.id} style={{flex:"0 0 "+(length/duration*100)+"%",minWidth:0,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",background:active===clip.id?"#7544b0":"#44315e",color:"#fff",border:"1px solid #9277b5",fontSize:10}}>{index+1}. {clip.name}</button>)}</div>
              <span>Source audio</span><div style={{display:"flex",height:24,overflow:"hidden",background:"#241a32",borderRadius:4}}>{segments.map(({clip,length,start})=><button type="button" key={clip.id} disabled={busy} onClick={()=>seekTimeline(start)} title={clip.name+" source audio"} style={{flex:"0 0 "+(length/duration*100)+"%",minWidth:0,overflow:"hidden",background:includeAudio&&(clip.gain??1)>0?"#265749":"#352c42",color:"#fff",border:"1px solid #4d786d",fontSize:10}}>{includeAudio?Math.round((clip.gain??1)*100)+"%":"Muted"}</button>)}</div>
              <span>Music</span><div style={{height:24,background:backgroundMusic?"#304d75":"#241a32",borderRadius:4,overflow:"hidden",padding:3}}>{backgroundMusic?(musicPeaks.length?<svg viewBox="0 0 128 20" preserveAspectRatio="none" width="100%" height="100%" aria-label="Decoded music waveform"><title>{backgroundMusic.name+" · "+sec(musicLength)}</title>{musicPeaks.map((p,i)=><line key={i} x1={i+.5} x2={i+.5} y1={10-p*9} y2={10+p*9} stroke="#b9dcff" strokeWidth=".8"/>)}</svg>:backgroundMusic.name+" · loop"):"No soundtrack"}</div>
              <span>Voiceover</span><div style={{position:"relative",height:28,background:"#241a32",overflow:"hidden",borderRadius:4}}>{voiceover&&voiceStart<duration&&<button type="button" disabled={busy} onClick={()=>seekTimeline(voiceStart)} title={voiceover.name} style={{position:"absolute",left:(voiceStart/duration*100)+"%",width:(Math.min(voiceLength,duration-voiceStart)/duration*100)+"%",height:28,background:"#71458c",color:"#fff",overflow:"hidden",padding:0}}>{voicePeaks.length>0?<svg viewBox="0 0 96 28" preserveAspectRatio="none" width="100%" height="100%" aria-label="Decoded voice waveform">{voicePeaks.map((p,i)=><line key={i} x1={i+.5} x2={i+.5} y1={14-p*13} y2={14+p*13} stroke="#e8d3ff" strokeWidth=".8"/>)}</svg>:voiceover.name}</button>}</div>
              <span>Images</span><div style={{height:Math.max(24,imageLayers.length*22),position:"relative",background:"#241a32",overflow:"hidden"}}>{imageLayers.filter(l=>l.start<duration).map((l,i)=><button type="button" key={l.id} disabled={busy} onClick={()=>{setSelectedImage(l.id);seekTimeline(l.start)}} style={{position:"absolute",left:(l.start/duration*100)+"%",width:((Math.min(l.end,duration)-l.start)/duration*100)+"%",top:i*22,height:21,background:selectedImage===l.id?"#a66b40":"#644436",color:"#fff",overflow:"hidden"}}>{l.file.name}</button>)}</div>
              <span>Title</span><div style={{height:24,background:titleOverlay?"#69482b":"#241a32",borderRadius:4,overflow:"hidden",padding:3}}>{titleOverlay||"No title overlay"}</div>
              <span>Subtitles</span><div style={{height:28,position:"relative",overflow:"hidden",background:"#241a32",borderRadius:4}}>{captionCues.map((c,i)=>({c,i})).filter(({c})=>c.start<duration).map(({c,i})=><button key={i} type="button" disabled={busy} title={c.text+" · "+sec(c.start)+"–"+sec(c.end)} onClick={()=>{setSelectedCue(i);seekTimeline(c.start)}} style={{position:"absolute",left:(c.start/duration*100)+"%",width:((Math.min(c.end,duration)-c.start)/duration*100)+"%",height:26,overflow:"hidden",whiteSpace:"nowrap",background:selectedCue===i?"#b1842f":"#795b22",border:"1px solid #bc9343",color:"#fff",fontSize:10}}>{c.text}</button>)}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
            <button type="button" disabled={busy||projectSaving||captionCues.length>=500} onClick={addCue}>+ Add subtitle at playhead</button>
            <button type="button" disabled={busy} onClick={()=>{setIncludeAudio(v=>!v);cleanupOutput()}}>{includeAudio?"Mute source track":"Unmute source track"}</button>
            <button type="button" disabled={busy||!backgroundMusic} onClick={()=>{setMusicVolume(v=>v===0?.3:0);cleanupOutput()}}>{musicVolume===0?"Unmute music":"Mute music"}</button>
          </div>
          {selectedCue!==null&&captionCues[selectedCue]&&<fieldset style={{display:"grid",gap:6,marginTop:8}}><legend>Edit selected subtitle</legend>
            <label>Text<input disabled={busy} maxLength={500} value={captionCues[selectedCue].text} onChange={e=>editCue(selectedCue,{text:e.target.value})}/></label>
            <label>Start (seconds)<input disabled={busy} type="number" min={0} max={captionCues[selectedCue].end-.01} step={.01} value={captionCues[selectedCue].start} onChange={e=>editCue(selectedCue,{start:Number(e.target.value)})}/></label>
            <label>End (seconds)<input disabled={busy} type="number" min={captionCues[selectedCue].start+.01} max={duration} step={.01} value={captionCues[selectedCue].end} onChange={e=>editCue(selectedCue,{end:Number(e.target.value)})}/></label>
            <button type="button" disabled={busy} onClick={()=>{setCaptionCues(old=>old.filter((_,i)=>i!==selectedCue));setSelectedCue(null);cleanupOutput()}}>Delete selected subtitle</button>
          </fieldset>}
          <small style={{color:"#b8a8c9"}}>Click a clip or subtitle to seek to its timeline position. Adjust clip and track settings below.</small>
        </section>}
        <p className="studio-timeline-hint">Drag clips by their thumbnail to reorder. Arrow buttons also work for keyboard users.</p>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
          {clips.map((clip, index) => <div key={clip.id}
            draggable={!busy}
            onDragStart={e=>{if(busy){e.preventDefault();return;} draggingClipId.current=clip.id;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",clip.id);}}
            onDragOver={e=>{if(busy)return;e.preventDefault();e.dataTransfer.dropEffect="move";setDragTargetId(clip.id);}}
            onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setDragTargetId(null);}}
            onDrop={e=>{e.preventDefault();reorderByDrop(clip.id);}}
            onDragEnd={()=>{draggingClipId.current=null;setDragTargetId(null);}}
            className={"studio-timeline-clip"+(active===clip.id?" is-active":"")+(dragTargetId===clip.id?" is-drop-target":"")}
            style={{ flex: "0 0 155px", background: active === clip.id ? "#382049" : "#21182e", border: "1px solid #5a3670", borderRadius: 9, padding: 9 }}>
            <ClipThumbnail url={clip.url} start={clip.start} name={clip.name}/>
            <button type="button" disabled={busy} onClick={() => setActive(clip.id)} style={{ display: "block", width: "100%", textAlign: "left", fontSize: 11, fontWeight: 600, overflowWrap: "anywhere", color: "#fff", background: "transparent", border: 0 }}>{index + 1}. {clip.name}</button>
            <small style={{ color: "#c2b4d5" }}>{sec((clip.end - clip.start)/(clip.speed||1))}</small>
            <div className="studio-timeline-actions" style={{ display: "flex", gap: 5, marginTop: 10 }}>
              <button disabled={busy || index === 0} onClick={() => move(clip.id, -1)} title="Move clip earlier" aria-label="Move clip left">←</button>
              <button disabled={busy || index === clips.length - 1} onClick={() => move(clip.id, 1)} title="Move clip later" aria-label="Move clip right">→</button>
              <button disabled={busy} onClick={() => remove(clip.id)} title="Remove clip from timeline" aria-label="Remove clip">×</button>
            </div>
          </div>)}
        </div>
      </div>
      <aside style={{ border: "1px solid #3e2e4f", borderRadius: 11, padding: 12, alignSelf: "start", background: "#1b1527" }}>
        <h2 style={{ fontSize: 14, marginTop: 0 }}>Selected clip</h2>
        {chosen ? <>
          <div style={{ fontSize: 11, overflowWrap: "anywhere", marginBottom: 10 }}>{chosen.name}</div>
          <label style={{ display: "block", fontSize: 11 }}>Start (seconds)<input aria-label="Trim start" type="number" min={0} max={chosen.end - .1} step=".1" disabled={busy} value={Number(chosen.start.toFixed(1))} onChange={e => { const start = Number(e.target.value); if (Number.isFinite(start) && start >= 0 && start < chosen.end - .05) update(chosen.id, { start }); }} style={{ width: "100%" }} /></label>
          <label style={{ display: "block", fontSize: 11, marginTop: 10 }}>End (seconds)<input aria-label="Trim end" type="number" min={chosen.start + .1} max={chosen.duration} step=".1" disabled={busy} value={Number(chosen.end.toFixed(1))} onChange={e => { const end = Number(e.target.value); if (Number.isFinite(end) && end <= chosen.duration && end > chosen.start + .05) update(chosen.id, { end }); }} style={{ width: "100%" }} /></label>
          <div style={{marginTop:12,display:"grid",gap:6}}>
            <label>Rotation<select disabled={busy} value={chosen.rotation||0} onChange={e=>update(chosen.id,{rotation:Number(e.target.value)})}><option value={0}>0°</option><option value={90}>90°</option><option value={180}>180°</option><option value={270}>270°</option></select></label>
            <button type="button" disabled={busy} aria-pressed={!!chosen.flipX} onClick={()=>update(chosen.id,{flipX:!chosen.flipX})}>Flip horizontal</button>
            <button type="button" disabled={busy} aria-pressed={!!chosen.flipY} onClick={()=>update(chosen.id,{flipY:!chosen.flipY})}>Flip vertical</button>
            <label>Zoom · {(chosen.zoom||1).toFixed(2)}×<input type="range" min={1} max={3} step={.05} disabled={busy} value={chosen.zoom||1} onChange={e=>update(chosen.id,{zoom:Number(e.target.value)})}/></label>
            <fieldset style={{display:"grid",gap:6}}><legend>Manual crop & position</legend>
            {(["cropLeft","cropRight","cropTop","cropBottom"] as const).map(edge=><label key={edge}>{edge.replace("crop","Crop ")} · {Math.round((chosen[edge]||0)*100)}%<input aria-label={edge} type="range" min={0} max={.4} step={.01} disabled={busy} value={chosen[edge]||0} onChange={e=>update(chosen.id,{[edge]:Number(e.target.value)})}/></label>)}
            {(["panX","panY"] as const).map(axis=><label key={axis}>{axis==="panX"?"Horizontal position":"Vertical position"} · {Math.round((chosen[axis]||0)*100)}%<input aria-label={axis} type="range" min={-1} max={1} step={.02} disabled={busy} value={chosen[axis]||0} onChange={e=>update(chosen.id,{[axis]:Number(e.target.value)})}/></label>)}
            </fieldset>
            <label>Speed<select disabled={busy} value={chosen.speed||1} onChange={e=>update(chosen.id,{speed:Number(e.target.value)})}>{[.5,.75,1,1.25,1.5,2].map(v=><option key={v} value={v}>{v}×</option>)}</select></label>
            <label>Source volume · {Math.round((chosen.gain??1)*100)}%<input type="range" min={0} max={1} step={.05} disabled={busy} value={chosen.gain??1} onChange={e=>update(chosen.id,{gain:Number(e.target.value)})}/></label>
            <button type="button" disabled={busy} onClick={()=>update(chosen.id,{rotation:0,flipX:false,flipY:false,zoom:1,speed:1,gain:1,cropLeft:0,cropRight:0,cropTop:0,cropBottom:0,panX:0,panY:0})}>Reset clip adjustments</button>
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
          </div>
          <button type="button" disabled={busy||clips.length>=30} onClick={() => split(chosen.id)} style={{ width: "100%", marginTop: 10 }}>✂ Split at playhead</button>
        </> : <small>Choose a clip from the timeline.</small>}
      </aside>
    </div>
    <section className="studio-export-settings" aria-label="Video export settings">
      <h2>Video output settings</h2>
      <div className="studio-export-basics">
        <label className="studio-setting-field">Ratio
          <select disabled={busy} value={ratio} onChange={e => setRatio(e.target.value as typeof ratio)}>
            <option>16:9</option><option>9:16</option><option>1:1</option>
          </select>
        </label>
        <label className="studio-setting-field">Framing
          <select disabled={busy} aria-label="Video framing mode" value={framing} onChange={e=>{setFraming(e.target.value as "cover"|"contain"|"blur");cleanupOutput()}}>
            <option value="contain">Show full video (no cropping)</option><option value="cover">Fill screen (crop edges)</option><option value="blur">Blur background</option>
          </select>
        </label>
        <label className="studio-setting-field">Height
          <select disabled={busy} value={resolution} onChange={e => setResolution(Number(e.target.value))}>
            <option value={480}>480p</option><option value={720}>720p</option><option value={1080}>1080p</option>
          </select>
        </label>
        <label className="studio-setting-toggle">
          <input disabled={busy} type="checkbox" checked={includeAudio} onChange={e => setIncludeAudio(e.target.checked)} />
          <span>Include source audio</span>
        </label>
        <label className="studio-setting-toggle">
          <input disabled={busy} type="checkbox" checked={fadeBetweenClips} onChange={e=>{setFadeBetweenClips(e.target.checked);cleanupOutput()}} />
          <span>Fade between clips</span>
        </label>{fadeBetweenClips&&<div style={{display:"grid",gap:6}}><label>Transition style<select disabled={busy} value={transitionStyle} onChange={e=>{setTransitionStyle(e.target.value as TransitionStyle);cleanupOutput()}}><option value="black">Fade through black</option><option value="white">Fade through white</option><option value="wipe-left">Black wipe left</option><option value="wipe-right">Black wipe right</option></select></label><label>Transition duration {transitionDuration.toFixed(1)}s<input type="range" min={.1} max={2} step={.1} disabled={busy} value={transitionDuration} onChange={e=>{setTransitionDuration(Number(e.target.value));cleanupOutput()}}/></label><small>Local/WebM; transitions pass through a solid color, not overlapping crossfades.</small></div>}
      </div>
      <div className="studio-export-extras">
        <div className="studio-setting-card">
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
          <fieldset disabled={busy} style={{display:"grid",gap:6}}><legend>Audio processing (local / WebM)</legend>
            <label><input type="checkbox" checked={lowCut} onChange={e=>{setLowCut(e.target.checked);cleanupOutput()}}/>Source low-cut (80 Hz rumble filter)</label>
            <label><input type="checkbox" checked={audioCompressor} onChange={e=>{setAudioCompressor(e.target.checked);cleanupOutput()}}/>Source dynamics compressor</label>
            <label><input type="checkbox" checked={audioDucking} onChange={e=>{setAudioDucking(e.target.checked);cleanupOutput()}}/>Duck music during voiceover</label>
            {audioDucking&&<label>Music level during voice {Math.round(duckLevel*100)}%<input type="range" min={0} max={1} step={.05} value={duckLevel} onChange={e=>{setDuckLevel(Number(e.target.value));cleanupOutput()}}/></label>}
          </fieldset>
          {backgroundMusic&&<button type="button" disabled={busy} className="studio-setting-secondary" onClick={()=>{setBackgroundMusic(null);cleanupOutput()}}>Remove music</button>}
        </div>
        <div className="studio-setting-card">
          <strong>Logo / image / object overlays (local / WebM)</strong>
          <input ref={imagePicker} hidden type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(!file||duration<.1)return;if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>10_000_000||imageLayers.length>=8){setState("Use PNG, JPEG or WebP under 10 MB; maximum 8 layers.");return;}const id=crypto.randomUUID(),start=Math.max(0,Math.min(playhead,duration-.1));setImageLayers(old=>[...old,{id,file,start,end:duration,x:.8,y:.2,size:.25,opacity:1}]);setSelectedImage(id);cleanupOutput();}}/>
          <button type="button" disabled={busy||!duration||imageLayers.length>=8} onClick={()=>imagePicker.current?.click()}>+ Add image / logo</button>
          {imageLayers.length>0&&<select aria-label="Select image layer" value={selectedImage||""} disabled={busy} onChange={e=>setSelectedImage(e.target.value)}><option value="">Select layer</option>{imageLayers.map(l=><option key={l.id} value={l.id}>{l.file.name}</option>)}</select>}
          {imageLayers.filter(l=>l.id===selectedImage).map(l=><fieldset key={l.id} disabled={busy} style={{display:"grid",gap:6}}><legend>Selected image</legend>
          <label>Start (s)<input type="number" min={0} max={l.end-.01} step={.1} value={l.start} onChange={e=>{const n=Number(e.target.value);if(n>=0&&n<l.end){setImageLayers(old=>old.map(a=>a.id===l.id?{...a,start:n}:a));cleanupOutput();}}}/></label>
          <label>End (s)<input type="number" min={l.start+.01} max={duration} step={.1} value={l.end} onChange={e=>{const n=Number(e.target.value);if(n>l.start&&n<=duration){setImageLayers(old=>old.map(a=>a.id===l.id?{...a,end:n}:a));cleanupOutput();}}}/></label>
          {(["x","y","size","opacity"] as const).map(k=><label key={k}>{k} {Math.round(l[k]*100)}%<input type="range" min={k==="size"?.05:0} max={1} step={.01} value={l[k]} onChange={e=>{setImageLayers(old=>old.map(a=>a.id===l.id?{...a,[k]:Number(e.target.value)}:a));cleanupOutput();}}/></label>)}
          <button type="button" onClick={()=>{setImageLayers(old=>old.filter(a=>a.id!==l.id));setSelectedImage(null);cleanupOutput();}}>Remove image layer</button></fieldset>)}
        </div><div className="studio-setting-card">
          <strong>Voiceover (local / WebM)</strong>
          <input ref={voicePicker} hidden type="file" accept="audio/*" disabled={busy} onChange={e=>{const f=e.target.files?.[0];e.target.value="";if(!f)return;if(f.size>25_000_000||!f.type.startsWith("audio/")){setState("Choose an audio file under 25 MB.");return;}setVoiceLength(0);setVoicePeaks([]);setVoiceover(f);cleanupOutput();}}/>
          <button type="button" disabled={busy} onClick={()=>voicePicker.current?.click()}>{voiceover?"Replace voiceover":"Choose voiceover file"}</button>
          {voiceover&&<><small>{voiceover.name} · {sec(voiceLength)}</small><label>Start (seconds)<input type="number" min={0} max={duration} step={.1} disabled={busy} value={voiceStart} onChange={e=>{setVoiceStart(Math.max(0,Math.min(duration,Number(e.target.value)||0)));cleanupOutput();}}/></label><label>Voice volume {Math.round(voiceVolume*100)}%<input type="range" min={0} max={1} step={.05} value={voiceVolume} disabled={busy} onChange={e=>{setVoiceVolume(Number(e.target.value));cleanupOutput();}}/></label><button type="button" disabled={busy} onClick={()=>{setVoiceover(null);setVoiceLength(0);cleanupOutput()}}>Remove voiceover</button></>}
        </div><div className="studio-setting-card">
          <label className="studio-setting-field" htmlFor="studio-video-title">Video title
            <input id="studio-video-title" aria-label="Video title overlay" disabled={busy} value={titleOverlay} maxLength={120}
              onChange={e=>{setTitleOverlay(e.target.value);cleanupOutput()}} placeholder="Optional on-screen title" />
          </label>
          <small>Leave blank to export without a title overlay.</small>
        </div>
        <div className="studio-setting-card">
          <strong>Subtitles (.srt)</strong>
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
          {captionCues.length>0&&<button type="button" className="studio-setting-secondary" disabled={busy}
            onClick={()=>{setCaptionCues([]);setSelectedCue(null);setSubtitleName("");cleanupOutput()}}>Clear {captionCues.length} subtitles</button>}
        </div>
      </div>
      <div className="studio-export-actions">
        <button type="button" disabled={!clips.length || busy || !supportedMime()} onClick={() => { void exportVideo(); }}
          className="studio-export-primary">{t("Merge & Export WebM", "Birleştir ve WebM indir")}</button>
        {!clips.length&&<small>Add at least one video clip to enable export.</small>}
        {busy&&<button type="button" onClick={() => { cancel.current = true; }}>Cancel</button>}
        {busy&&<span role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>{progress}%</span>}
        {downloadUrl&&<a href={downloadUrl} download="crelavo-studio-merged.webm">↓ Download merged video</a>}
      </div>
    </section>
    <p style={{ color: "#aa9bb7", fontSize: 11, marginTop: 12 }}>Local, real-time browser rendering. WebM export only; quality depends on browser and hardware. SRT subtitle burn-in, title overlay and one user-provided background music track with volume/fade are available. Use only music you have rights to.  Private cloud timeline source-file backup/reopen supports up to 90 MB total; larger local timelines still stay on this device. Cloud browser tests pending. Advanced crossfades and MP4 export are not available yet.</p>
  </section>;
}
