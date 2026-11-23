"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type Clip = { id: string; file: File; name: string; url: string; duration: number; start: number; end: number };
const accept = "video/mp4,video/webm,video/quicktime,video/x-m4v";
const sec = (n: number) => Number.isFinite(n) ? n.toFixed(1) + "s" : "—";
const VIDEO_PROJECT_DB = "crelavo-studio-local-video-project-v1";
type CaptionCue = { start: number; end: number; text: string };
type SavedVideoProject = { id: string; owner: string; savedAt: number; clips: Array<Omit<Clip, "url">>; ratio: "16:9" | "9:16" | "1:1"; resolution: number; includeAudio: boolean; captionCues?: CaptionCue[]; titleOverlay?: string };
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
function parseSrt(source: string): CaptionCue[] {
  // Strict bounded parsing: do not interpret markup or run HTML from subtitles.
  const cues: CaptionCue[] = [];
  const time = (value: string) => {
    const match = value.trim().match(/^(\\d{2}):(\\d{2}):(\\d{2})[,.](\\d{3})$/);
    if (!match) return NaN;
    return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
  };
  for (const block of source.replace(/\\r/g, "").trim().split(/\\n\\s*\\n/)) {
    const lines = block.split("\\n");
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
  const words = text.split(/\\s+/);
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
export default function LocalVideoEditor() {
  const [projectOwner,setProjectOwner] = useState("");
  const [projectSaving,setProjectSaving] = useState(false);
  const [clips, setClips] = useState<Clip[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [state, setState] = useState("Add local clips to start. Videos remain on your device.");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ratio, setRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [resolution, setResolution] = useState(720);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [titleOverlay, setTitleOverlay] = useState("");
  const [captionCues, setCaptionCues] = useState<CaptionCue[]>([]);
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
  useEffect(()=>{
    let live=true;
    void supabaseBrowser().auth.getUser().then(({data,error})=>{
      if(live&&!error&&data.user)setProjectOwner(data.user.id);
    }).catch(()=>{});
    return()=>{live=false};
  },[]);
  useEffect(() => { files.current = clips; }, [clips]);
  useEffect(() => () => { files.current.forEach(c => URL.revokeObjectURL(c.url)); if (output.current) URL.revokeObjectURL(output.current); }, []);
  async function saveTimeline(){
    if(!projectOwner||!clips.length||busy||projectSaving)return;
    const size=clips.reduce((sum,clip)=>sum+clip.file.size,0);
    if(size>150_000_000){setState("Local project save supports up to 150 MB of source clips. Export or reduce source size.");return;}
    setProjectSaving(true);
    try{
      const project: SavedVideoProject={
        id:projectOwner,owner:projectOwner,savedAt:Date.now(),
        clips:clips.map(({url,...data})=>data),
        ratio,resolution,includeAudio,captionCues,titleOverlay:titleOverlay.slice(0,120)
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
      cleanupOutput();
      setState("Local timeline reopened. You can continue editing and exporting.");
    }catch{setState("Could not reopen this timeline in the current browser.");}
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
      setState(incoming.length + " clip(s) added. Rearrange, trim, or remove before exporting.");
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
    let recorder: MediaRecorder | null = null;
    let currentVideo: HTMLVideoElement | null = null;
    let raf = 0;
    const chunks: BlobPart[] = [];
    const recordDone = new Promise<void>((resolve, reject) => {
      try {
        recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3_000_000 });
        recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = () => reject(new Error("Video recorder failed."));
        recorder.onstop = () => resolve();
      } catch (error) { reject(error); }
    });
    try {
      if (includeAudio) {
        audio = new AudioContextConstructor();
        await audio.resume();
        const destination = audio.createMediaStreamDestination();
        destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
        // The same destination is used for every clip. Its gain is connected
        // to the captured stream only, avoiding unexpected speaker playback.
        (canvas as HTMLCanvasElement & { __audioDestination?: MediaStreamAudioDestinationNode }).__audioDestination = destination;
      }
      recorder!.start(750);
      let elapsed = 0;
      for (const clip of clips) {
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
        if (audio) {
          source = audio.createMediaElementSource(video);
          source.connect((canvas as HTMLCanvasElement & { __audioDestination?: MediaStreamAudioDestinationNode }).__audioDestination!);
        } else video.muted = true;
        const segment = clip.end - clip.start;
        if (segment <= .05) throw new Error("Invalid trim range for " + clip.name);
        await video.play();
        await new Promise<void>((resolve, reject) => {
          const begin = performance.now();
          const render = () => {
            if (cancel.current) { reject(new Error("Export cancelled.")); return; }
            if (video.error) { reject(new Error("Decode failed during " + clip.name)); return; }
            const vw = video.videoWidth, vh = video.videoHeight;
            if (vw && vh && video.readyState >= 2) {
              ctx.fillStyle = "#000"; ctx.fillRect(0, 0, width, height);
              const scale = Math.min(width / vw, height / vh);
              ctx.drawImage(video, (width - vw * scale) / 2, (height - vh * scale) / 2, vw * scale, vh * scale);
              const at=elapsed+Math.min(segment,Math.max(0,video.currentTime-clip.start));
              paintOverlay(ctx,width,height,titleOverlay.slice(0,120),false);
              paintOverlay(ctx,width,height,captionAt(captionCues,at),true);
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
      if (audio) await audio.close().catch(() => {});
      setBusy(false);
    }
  }
  return <section style={{ color: "#f4f0ff", background: "#110e1b", padding: 18, minHeight: "100%", fontFamily: "Inter,system-ui,sans-serif" }}>
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div><h1 style={{ fontSize: 18, margin: 0 }}>{t("Video Editor & Merge", "Video Düzenleme ve Birleştirme")}</h1><p style={{ color: "#b8a8c9", margin: "6px 0 14px", fontSize: 12 }}>{t("Add, remove, split, trim, reorder, and merge local videos. No AI credits or server upload.", "Yerel videoları ekle, çıkar, kes, böl, sırala ve birleştir. AI kredisi veya sunucu yüklemesi yok.")}</p></div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
       <button type="button" disabled={!projectOwner||!clips.length||busy||projectSaving} onClick={()=>{void saveTimeline()}} style={{background:"#38254d",border:"1px solid #74518b",color:"#fff",padding:"9px 12px",borderRadius:9}}>Save local timeline</button>
       <button type="button" disabled={!projectOwner||busy||projectSaving} onClick={()=>{void reopenTimeline()}} style={{background:"#281d36",border:"1px solid #74518b",color:"#fff",padding:"9px 12px",borderRadius:9}}>Reopen timeline</button>
      <label style={{ background: "#7036b5", padding: "10px 15px", borderRadius: 9, cursor: busy ? "not-allowed" : "pointer" }}>{t("+ Add videos", "+ Video ekle")}<input aria-label="Add local video clips" disabled={busy} type="file" multiple accept={accept} onChange={e => { void addFiles(e.target.files); e.currentTarget.value = ""; }} hidden /></label>
      </div>
    </header>
    <div role="status" aria-live="polite" style={{ color: "#c7bad7", marginBottom: 12 }}>{state}</div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(190px,260px)", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ border: "1px solid #422b54", borderRadius: 12, padding: 9, background: "#090711" }}>
          {chosen ? <video key={chosen.id} ref={preview} src={chosen.url} controls preload="metadata" style={{ width: "100%", maxHeight: 290, objectFit: "contain", display: "block" }} onLoadedMetadata={e => { e.currentTarget.currentTime = chosen.start; }} /> : <div style={{ aspectRatio: "16/9", display: "grid", placeItems: "center", color: "#a999bb" }}>No clips selected</div>}
        </div>
        <h2 style={{ fontSize: 14, marginTop: 15 }}>Clip timeline · {sec(duration)} total</h2>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
          {clips.map((clip, index) => <div key={clip.id} style={{ flex: "0 0 170px", background: active === clip.id ? "#382049" : "#21182e", border: "1px solid #5a3670", borderRadius: 9, padding: 9 }}>
            <button type="button" disabled={busy} onClick={() => setActive(clip.id)} style={{ display: "block", width: "100%", textAlign: "left", fontSize: 11, fontWeight: 600, overflowWrap: "anywhere", color: "#fff", background: "transparent", border: 0 }}>{index + 1}. {clip.name}</button>
            <small style={{ color: "#c2b4d5" }}>{sec(clip.end - clip.start)}</small>
            <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
              <button disabled={busy || index === 0} onClick={() => move(clip.id, -1)} aria-label="Move clip left">←</button>
              <button disabled={busy || index === clips.length - 1} onClick={() => move(clip.id, 1)} aria-label="Move clip right">→</button>
              <button disabled={busy} onClick={() => remove(clip.id)} aria-label="Remove clip">×</button>
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
    <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center", flexWrap: "wrap", borderTop: "1px solid #35253f", paddingTop: 15 }}>
      <label>Ratio <select disabled={busy} value={ratio} onChange={e => setRatio(e.target.value as typeof ratio)}><option>16:9</option><option>9:16</option><option>1:1</option></select></label>
      <label>Height <select disabled={busy} value={resolution} onChange={e => setResolution(Number(e.target.value))}><option value={480}>480p</option><option value={720}>720p</option><option value={1080}>1080p</option></select></label>
      <label style={{ display: "flex", alignItems: "center", gap: 5 }}><input disabled={busy} type="checkbox" checked={includeAudio} onChange={e => setIncludeAudio(e.target.checked)} /> Include source audio</label>
      <label style={{fontSize:12}}>Video title <input aria-label="Video title overlay" disabled={busy} value={titleOverlay} maxLength={120} onChange={e=>{setTitleOverlay(e.target.value);cleanupOutput()}} placeholder="Optional on-screen title" style={{display:"block",maxWidth:220}} /></label>
      <label style={{fontSize:12,cursor:"pointer"}}>Subtitles (.srt)
        <input type="file" disabled={busy} accept=".srt,text/plain" aria-label="Import SRT subtitles"
          onChange={e=>{
            const file=e.target.files?.[0];e.target.value="";
            if(!file)return;
            if(file.size>250_000){setState("Subtitle file exceeds 250 KB.");return;}
            void file.text().then(source=>{
              const cues=parseSrt(source);setCaptionCues(cues);cleanupOutput();
              setState(cues.length?cues.length+" subtitle cues loaded for burn-in export.":"No valid SRT subtitle cues found.");
            }).catch(()=>setState("Could not read subtitles."));
          }} style={{display:"block",maxWidth:180}} />
      </label>
      {captionCues.length>0&&<button type="button" disabled={busy} onClick={()=>{setCaptionCues([]);cleanupOutput()}}>Clear {captionCues.length} subtitles</button>}
      <button type="button" disabled={!clips.length || busy || !supportedMime()} onClick={() => { void exportVideo(); }} style={{ background: "#7835c0", padding: "10px 18px", borderRadius: 9, color: "#fff", border: 0 }}>{t("Merge & Export WebM", "Birleştir ve WebM indir")}</button>
      {busy && <button type="button" onClick={() => { cancel.current = true; }}>Cancel</button>}
      {busy && <span role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>{progress}%</span>}
      {downloadUrl && <a href={downloadUrl} download="crelavo-studio-merged.webm" style={{ color: "#e1a8ff", fontWeight: 700 }}>↓ Download merged video</a>}
    </div>
    <p style={{ color: "#aa9bb7", fontSize: 11, marginTop: 12 }}>Local, real-time browser rendering. WebM export only; quality depends on browser and hardware. SRT subtitle burn-in and a title overlay are available. No cloud storage, cross-device project sync, transitions or MP4 export in this editor yet. Browser-local timeline Save/Reopen is available when signed in.</p>
  </section>;
}
