"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { saveCloudTimeline, loadCloudTimeline } from "@/lib/studio-cloud-timeline";

type Clip = { id: string; file: File; name: string; url: string; duration: number; start: number; end: number };
const accept = "video/mp4,video/webm,video/quicktime,video/x-m4v";
const sec = (n: number) => Number.isFinite(n) ? n.toFixed(1) + "s" : "—";
const VIDEO_PROJECT_DB = "crelavo-studio-local-video-project-v1";
type CaptionCue = { start: number; end: number; text: string };
type SavedVideoProject = { id: string; owner: string; savedAt: number; clips: Array<Omit<Clip, "url">>; ratio: "16:9" | "9:16" | "1:1"; resolution: number; includeAudio: boolean; captionCues?: CaptionCue[]; titleOverlay?: string; backgroundMusic?: File | null; musicVolume?: number; fadeBetweenClips?: boolean; framing?: "cover" | "contain" };
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
  const [clips, setClips] = useState<Clip[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [state, setState] = useState("Add local clips to start. Videos remain on your device.");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ratio, setRatio] = useState<"16:9" | "9:16" | "1:1">("9:16");
  const [framing,setFraming] = useState<"cover"|"contain">("contain");
  const [resolution, setResolution] = useState(720);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [titleOverlay, setTitleOverlay] = useState("");
  const [captionCues, setCaptionCues] = useState<CaptionCue[]>([]);
  const [subtitleName,setSubtitleName] = useState("");
  const musicPicker=useRef<HTMLInputElement>(null);
  const subtitlePicker=useRef<HTMLInputElement>(null);
  const [backgroundMusic,setBackgroundMusic] = useState<File|null>(null);
  const [musicVolume,setMusicVolume] = useState(0.3);
  const [fadeBetweenClips,setFadeBetweenClips] = useState(false);
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
  useEffect(() => { files.current = clips; }, [clips]);
  useEffect(() => () => { files.current.forEach(c => URL.revokeObjectURL(c.url)); if (output.current) URL.revokeObjectURL(output.current); }, []);
  async function saveTimeline(){
    if(!projectOwner||!clips.length||busy||projectSaving)return;
    const size=clips.reduce((sum,clip)=>sum+clip.file.size,0)+(backgroundMusic?.size||0);
    if(size>150_000_000){setState("Local project save supports up to 150 MB of source clips. Export or reduce source size.");return;}
    setProjectSaving(true);
    try{
      const project: SavedVideoProject={
        id:projectOwner,owner:projectOwner,savedAt:Date.now(),
        clips:clips.map(({url,...data})=>data),
        ratio,resolution,includeAudio,captionCues,titleOverlay:titleOverlay.slice(0,120),backgroundMusic,musicVolume,fadeBetweenClips,framing
      };
      await saveProjectLocally(project);
      setState("Timeline saved to this browser for your Crelavo account. Other devices cannot access this copy.");
    }catch{setState("Could not save locally. Check available browser storage space.");}
    finally{setProjectSaving(false)}
  }
  async function reopenTimeline(){
    if(!projectOwner||busy||projectSaving)return;
    setProjectSaving(true);
    try{
      const project=await openProjectLocally(projectOwner);
      if(!project||project.owner!==projectOwner){setState("No locally saved video timeline found for this account.");return;}
      const restored: Clip[]=project.clips.map(clip=>({...clip,url:URL.createObjectURL(clip.file)}));
      files.current.forEach(old=>URL.revokeObjectURL(old.url));
      files.current=restored;
      setClips(restored);setActive(restored[0]?.id||null);
      setRatio(project.ratio);setResolution(project.resolution);setIncludeAudio(project.includeAudio);
      setCaptionCues(Array.isArray(project.captionCues)?project.captionCues:[]);setTitleOverlay(project.titleOverlay||'');
      setBackgroundMusic(project.backgroundMusic instanceof File?project.backgroundMusic:null);
      setMusicVolume(typeof project.musicVolume==='number'&&Number.isFinite(project.musicVolume)?Math.min(1,Math.max(0,project.musicVolume)):0.3);
      setFadeBetweenClips(Boolean(project.fadeBetweenClips));setFraming(project.framing==="cover"?"cover":"contain");
      cleanupOutput();
      setState("Local timeline reopened. You can continue editing and exporting.");
    }catch{setState("Could not reopen this timeline in the current browser.");}
    finally{setProjectSaving(false)}
  }
  async function saveTimelineCloud(){
    if(!projectOwner||!signedIn||!clips.length||busy||projectSaving)return;
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
      files.current.forEach(old=>URL.revokeObjectURL(old.url));
      files.current=restored;setClips(restored);setActive(restored[0]?.id||null);
      setRatio(saved.ratio);setResolution(saved.resolution);setIncludeAudio(saved.includeAudio);
      setCaptionCues(saved.captionCues);setTitleOverlay(saved.titleOverlay);
      setBackgroundMusic(saved.backgroundMusic);setMusicVolume(saved.musicVolume);
      setFadeBetweenClips(saved.fadeBetweenClips);setFraming(saved.framing==="cover"?"cover":"contain");cleanupOutput();
      setState("Cloud timeline version "+saved.version+" reopened with playable source media.");
    }catch(error){setState("Cloud reopen failed: "+(error instanceof Error?error.message:"Unknown error"));}
    finally{setProjectSaving(false)}
  }
  const chosen = clips.find(c => c.id === active);
  const duration = clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0);
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
      cleanupOutput(); setClips(existing => [...existing, ...incoming]); setActive(current => current || incoming[0].id);
      setState(incoming.length + " new clip(s) added · " + (clips.length + incoming.length) + " clips in timeline. Rearrange, trim, or remove before exporting.");
    }
  }
  function update(id: string, patch: Partial<Clip>) {
    if (busy) return; cleanupOutput();
    setClips(existing => existing.map(clip => clip.id !== id ? clip : { ...clip, ...patch }));
  }
  function move(id: string, delta: number) {
    if (busy) return; cleanupOutput();
    setClips(existing => { const next = [...existing]; const i = next.findIndex(c => c.id === id); const j = i + delta; if (i < 0 || j < 0 || j >= next.length) return existing; [next[i], next[j]] = [next[j], next[i]]; return next; });
  }
  function reorderByDrop(targetId:string){
    const sourceId=draggingClipId.current;draggingClipId.current=null;setDragTargetId(null);
    if(busy||!sourceId||sourceId===targetId)return;
    const sourceIndex=clips.findIndex(c=>c.id===sourceId),targetIndex=clips.findIndex(c=>c.id===targetId);
    if(sourceIndex<0||targetIndex<0)return;
    cleanupOutput();
    setClips(existing=>{
      const from=existing.findIndex(c=>c.id===sourceId),to=existing.findIndex(c=>c.id===targetId);
      if(from<0||to<0||from===to)return existing;
      const next=[...existing];const [item]=next.splice(from,1);next.splice(to,0,item);
      return next;
    });
    setState("Timeline reordered. Export uses the new clip order.");
  }
  function remove(id: string) {
    if (busy) return; cleanupOutput();
    setClips(existing => { const item = existing.find(c => c.id === id); const next = existing.filter(c => c.id !== id);
      if (item && !next.some(c => c.url === item.url)) URL.revokeObjectURL(item.url); setActive(current => current === id ? (next[0]?.id || null) : current); return next; });
  }
  function split(id: string) {
    const item = clips.find(c => c.id === id);
    if (!item || busy || !preview.current) return;
    const at = preview.current.currentTime;
    if (at <= item.start + .15 || at >= item.end - .15) { setState("Play or seek inside the selected trim range before splitting."); return; }
    cleanupOutput();
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
    let musicSource: AudioBufferSourceNode | null = null;
    let musicGainNode: GainNode | null = null;
    let recorder: MediaRecorder | null = null;
    let currentVideo: HTMLVideoElement | null = null;
    let raf = 0;
    const chunks: BlobPart[] = [];
    let recordDone: Promise<void> | undefined;
    try {
      if (includeAudio || backgroundMusic) {
        audio = new AudioContextConstructor();
        await audio.resume();
        const destination = audio.createMediaStreamDestination();
        destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
        // The same destination is used for every clip. Its gain is connected
        // to the captured stream only, avoiding unexpected speaker playback.
        (canvas as HTMLCanvasElement & { __audioDestination?: MediaStreamAudioDestinationNode }).__audioDestination = destination;
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
        let source: MediaElementAudioSourceNode | null = null;
        if (audio && includeAudio) {
          source = audio.createMediaElementSource(video);
          const inputGain=audio.createGain();
          inputGain.gain.value=1;
          source.connect(inputGain);
          inputGain.connect((canvas as HTMLCanvasElement & { __audioDestination?: MediaStreamAudioDestinationNode }).__audioDestination!);
          if(fadeBetweenClips&&clips.length>1){
            const now=audio.currentTime;
            const segmentLength=clip.end-clip.start;
            const fade=Math.min(.4,segmentLength/3);
            inputGain.gain.setValueAtTime(clipIndex===0?1:0,now);
            if(clipIndex>0)inputGain.gain.linearRampToValueAtTime(1,now+fade);
            if(clipIndex<clips.length-1){
              inputGain.gain.setValueAtTime(1,now+Math.max(fade,segmentLength-fade));
              inputGain.gain.linearRampToValueAtTime(0,now+segmentLength);
            }
          }
        } else video.muted = true;
        const segment = clip.end - clip.start;
        if (segment <= .05) throw new Error("Invalid trim range for " + clip.name);
        await video.play();
        if(clipIndex===0&&musicSource&&audio&&musicGainNode){
          const now=audio.currentTime,level=Math.max(0,Math.min(1,musicVolume));
          musicGainNode.gain.setValueAtTime(0,now);
          musicGainNode.gain.linearRampToValueAtTime(level,now+Math.min(.6,duration/4));
          if(duration>1.5){
            const fadeStart=Math.max(now+.6,now+duration-.7);
            musicGainNode.gain.setValueAtTime(level,fadeStart);
            musicGainNode.gain.linearRampToValueAtTime(0,now+duration);
          }
          musicSource.start();
        }
        await new Promise<void>((resolve, reject) => {
          const begin = performance.now();
          const render = () => {
            if (cancel.current) { reject(new Error("Export cancelled.")); return; }
            if (video.error) { reject(new Error("Decode failed during " + clip.name)); return; }
            const vw = video.videoWidth, vh = video.videoHeight;
            if (vw && vh && video.readyState >= 2) {
              ctx.fillStyle = "#000"; ctx.fillRect(0, 0, width, height);
              // Preview and export share the same center framing; cover crops wide sources for Shorts.
              const scale = framing === "cover" ? Math.max(width / vw, height / vh) : Math.min(width / vw, height / vh);
              const renderedWidth=vw*scale, renderedHeight=vh*scale;
              ctx.drawImage(video,(width-renderedWidth)/2,(height-renderedHeight)/2,renderedWidth,renderedHeight);
              const at=elapsed+Math.min(segment,Math.max(0,video.currentTime-clip.start));
              paintOverlay(ctx,width,height,titleOverlay.slice(0,120),false);
              paintOverlay(ctx,width,height,captionAt(captionCues,at),true);
              if(fadeBetweenClips&&clips.length>1){
                const fade=Math.min(.4,segment/3);
                const local=Math.max(0,video.currentTime-clip.start);
                let opacity=0;
                if(clipIndex>0&&local<fade)opacity=1-local/fade;
                if(clipIndex<clips.length-1&&segment-local<fade)
                  opacity=Math.max(opacity,1-Math.max(0,segment-local)/fade);
                if(opacity>0){ctx.fillStyle='rgba(0,0,0,'+Math.min(1,opacity)+')';ctx.fillRect(0,0,width,height);}
              }
            }
            setProgress(Math.min(99, Math.round(100 * (elapsed + Math.min(segment, Math.max(0, video.currentTime - clip.start))) / duration)));
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
      const blob = new Blob(chunks, { type: "video/webm" });
      if (blob.size < 1000) throw new Error("The exported video is empty.");
      const url = URL.createObjectURL(blob); output.current = url; setDownloadUrl(url);
      setProgress(100); setState("Merged video ready (" + (blob.size / 1048576).toFixed(1) + " MB). Download the WebM file.");
    } catch (error) {
      const activeRecorder = recorder as MediaRecorder | null;
      if (activeRecorder && activeRecorder.state === "recording") activeRecorder.stop();
      setState(error instanceof Error ? error.message : "Could not export the video.");
    } finally {
      cancelAnimationFrame(raf);
      currentVideo?.pause();
      stream.getTracks().forEach(track => track.stop());
      if(musicSource){try{musicSource.stop()}catch{}}
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
            {chosen ? <video key={chosen.id} ref={preview} src={chosen.url} controls playsInline preload="metadata"
              style={{width:"100%",height:"100%",objectFit:framing,display:"block"}}
              onLoadedMetadata={e => { e.currentTarget.currentTime=chosen.start; }} />
              : <div className="studio-video-no-clips">Add video files to begin editing</div>}
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
        </div>
        <p className="studio-video-framing-note" role="status">{framing==="cover"
          ?"Crop mode: side or top/bottom content can be removed. Switch to Show full video to keep all edges."
          :"Full video preserved. Borders may appear when the source and output ratios differ."}</p>
        {chosen && <p className="studio-selected-clip-note">Preview: selected clip only ({sec(chosen.end-chosen.start)}). Timeline export combines all {clips.length} clip(s), {sec(duration)} total.</p>}
        <h2 style={{ fontSize: 14, marginTop: 10, marginBottom: 5 }}>Clip timeline · {sec(duration)} total</h2>
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
            <small style={{ color: "#c2b4d5" }}>{sec(clip.end - clip.start)}</small>
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
          <button type="button" disabled={busy} onClick={() => split(chosen.id)} style={{ width: "100%", marginTop: 10 }}>✂ Split at playhead</button>
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
          <select disabled={busy} aria-label="Video framing mode" value={framing} onChange={e=>{setFraming(e.target.value as "cover"|"contain");cleanupOutput()}}>
            <option value="contain">Show full video (no cropping)</option><option value="cover">Fill screen (crop edges)</option>
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
        </label>
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
          {backgroundMusic&&<button type="button" disabled={busy} className="studio-setting-secondary" onClick={()=>{setBackgroundMusic(null);cleanupOutput()}}>Remove music</button>}
        </div>
        <div className="studio-setting-card">
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
                const cues=parseSrt(source);setCaptionCues(cues);setSubtitleName(cues.length?file.name:"");cleanupOutput();
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
            onClick={()=>{setCaptionCues([]);setSubtitleName("");cleanupOutput()}}>Clear {captionCues.length} subtitles</button>}
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
