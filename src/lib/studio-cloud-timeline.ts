"use client";
import { supabaseBrowser } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "studio-private";
const MAX_TOTAL = 90_000_000;
const MAX_FILE = 90_000_000;
const db = () => supabaseBrowser() as SupabaseClient<any>;
type ClipAdjustments = { rotation?: number; flipX?: boolean; flipY?: boolean; zoom?: number; gain?: number; speed?: number; cropLeft?:number; cropRight?:number; cropTop?:number; cropBottom?:number; panX?:number; panY?:number };
function bounded(v:unknown,min:number,max:number,fallback=0){return typeof v==="number"&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;}
function adjustments(c: ClipAdjustments): ClipAdjustments {
 return {rotation:[0,90,180,270].includes(c.rotation??0)?c.rotation??0:0,flipX:c.flipX===true,flipY:c.flipY===true,zoom:typeof c.zoom==="number"&&Number.isFinite(c.zoom)?Math.min(3,Math.max(1,c.zoom)):1,gain:typeof c.gain==="number"&&Number.isFinite(c.gain)?Math.min(1,Math.max(0,c.gain)):1,speed:[.5,.75,1,1.25,1.5,2].includes(c.speed??1)?c.speed??1:1,cropLeft:bounded(c.cropLeft,0,.4),cropRight:bounded(c.cropRight,0,.4),cropTop:bounded(c.cropTop,0,.4),cropBottom:bounded(c.cropBottom,0,.4),panX:bounded(c.panX,-1,1),panY:bounded(c.panY,-1,1)};
}
export type CloudTimelineClip = ClipAdjustments & { id: string; file: File; name: string; duration: number; start: number; end: number };
export type CloudImageLayer={hidden?:boolean;locked?:boolean;id:string;file:File;start:number;end:number;x:number;y:number;size:number;opacity:number;keyframes?:Array<{at:number;x:number;y:number;size:number;opacity:number}>};
export type CloudTimelineSettings = {
 layerFlags?:Partial<Record<'title'|'captions'|'music'|'voice',{hidden?:boolean;locked?:boolean}>>;
 voiceover?:File|null;voiceStart?:number;voiceVolume?:number;voiceLength?:number;
 imageLayers?:CloudImageLayer[];transitionStyle?:string;transitionDuration?:number;
 audioDucking?:boolean;duckLevel?:number;audioCompressor?:boolean;lowCut?:boolean;noiseReduction?:boolean;aiDenoise?:boolean;
 ratio: "16:9"|"9:16"|"1:1"; resolution: number; fps?: number; quality?: string; includeAudio: boolean;
 captionCues: Array<{start:number;end:number;text:string}>; titleOverlay: string;
 musicVolume: number; fadeBetweenClips: boolean; framing:"cover"|"contain"|"blur"; backgroundMusic: File|null;
};
export type LoadedCloudTimeline = CloudTimelineSettings & { clips: CloudTimelineClip[]; version: number };
type Entry = ClipAdjustments & { id:string;name:string;path:string;mime:string;start:number;end:number;duration:number };
const asError=(error:unknown)=> error instanceof Error ? error : new Error(String(error));
async function user() {
 const {data,error}=await db().auth.getUser();
 if(error||!data.user)throw new Error("Sign in to use cloud timeline sync.");
 return data.user.id;
}
async function lookupProject(uid:string) {
 const {data,error}=await db().from("studio_projects").select("id")
 .eq("user_id",uid).eq("category","video_editor").order("created_at",{ascending:true}).limit(1);
 if(error)throw error;
 if(data?.[0]?.id)return String(data[0].id);
 const {data:created,error:createError}=await db().from("studio_projects").insert({
 user_id:uid,category:"video_editor",title:"My video timeline"
 }).select("id").single();
 if(createError||!created)throw createError||new Error("Could not create cloud video project.");
 return String(created.id);
}
export async function saveCloudTimeline(clips:CloudTimelineClip[], settings:CloudTimelineSettings):Promise<{version:number;projectId:string;timelineVersionId:string}>{
 if(!clips.length)throw new Error("Add video clips before saving.");
 if(clips.length>30)throw new Error("Cloud timeline supports up to 30 clips.");
 const layers=settings.imageLayers||[];
 if(layers.length>8)throw new Error("Cloud timeline supports up to 8 image layers.");
 const assets=[...clips.map(c=>({file:c.file,kind:"video" as const})),...(settings.backgroundMusic?[{file:settings.backgroundMusic,kind:"music" as const}]:[]),...(settings.voiceover?[{file:settings.voiceover,kind:"voice" as const}]:[]),...layers.map(layer=>({file:layer.file,kind:"image" as const}))];
 const files=assets.map(a=>a.file);
 const size=files.reduce((n,f)=>n+f.size,0);
 if(size>MAX_TOTAL || files.some(f=>f.size===0||f.size>MAX_FILE))
  throw new Error("Cloud timeline upload is limited to 90 MB total. Local saves support larger projects.");
 if(assets.some(a=>a.kind==="image"?!/^image\/(png|jpeg|webp)$/i.test(a.file.type):a.kind==="video"?!/^video\/(mp4|webm|quicktime|x-m4v)$/i.test(a.file.type):!/^audio\/(mpeg|mp4|wav|ogg|webm|x-wav)$/i.test(a.file.type)))
  throw new Error("Unsupported video or soundtrack type for cloud sync.");
 const uid=await user();
 const pid=await lookupProject(uid);
 const {data:previous,error:latestError}=await db().from("studio_timeline_versions")
  .select("version_number").eq("user_id",uid).eq("project_id",pid)
  .order("version_number",{ascending:false}).limit(1);
 if(latestError)throw latestError;
 const version=Number(previous?.[0]?.version_number||0)+1;
 const uploaded:string[]=[];
 const entries:Entry[]=[];
 let musicPath:string|null=null,voicePath:string|null=null;
 const imageEntries:Array<Omit<CloudImageLayer,"file">&{path:string;name:string;mime:string}>=[];
 let imageIndex=0;
 try{
  for(let i=0;i<files.length;i++){
   const file=files[i]; const extension=file.name.match(/\.(mp4|webm|mov|m4v|mp3|m4a|wav|ogg|png|jpe?g|webp)$/i)?.[0]?.toLowerCase()||({"image/png":".png","image/jpeg":".jpg","image/webp":".webp","audio/mpeg":".mp3","audio/mp4":".m4a","audio/wav":".wav","audio/x-wav":".wav","audio/ogg":".ogg","audio/webm":".webm"} as Record<string,string>)[file.type]||"";
   const path=`${uid}/${pid}/${crypto.randomUUID()}${extension}`;
   const {error:storageError}=await db().storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});
   if(storageError)throw storageError;
   uploaded.push(path);
   const {error:assetError}=await db().from("studio_assets").insert({
    user_id:uid,project_id:pid,kind:assets[i].kind==="video"?"video":assets[i].kind==="image"?"image":"audio",label:file.name.slice(0,130),
    bucket_id:BUCKET,object_path:path,content_type:file.type,byte_size:file.size,
    metadata:{source:"timeline",version}
   });
   if(assetError)throw assetError;
   if(i<clips.length) {
    const c=clips[i];entries.push({id:c.id,name:c.name,path,mime:file.type,start:c.start,end:c.end,duration:c.duration,...adjustments(c)});
   }else if(assets[i].kind==="music")musicPath=path;
   else if(assets[i].kind==="voice")voicePath=path;
   else {
     const {file:_,...layer}=layers[imageIndex++];
     imageEntries.push({...layer,...(layer.hidden?{originalOpacity:layer.opacity,originalKeyframes:layer.keyframes||[]}:{}),opacity:layer.hidden?0:layer.opacity,keyframes:(layer.keyframes||[]).slice(0,32).map(k=>layer.hidden?{...k,opacity:0}:k),path,name:file.name,mime:file.type});
   }
  }
  const timeline={
   clips:entries,musicPath,voicePath,imageLayers:imageEntries,voiceStart:settings.voiceStart??0,originalVoiceVolume:settings.voiceVolume??1,voiceVolume:settings.layerFlags?.voice?.hidden?0:settings.voiceVolume??1,voiceLength:settings.voiceLength??0,transitionStyle:settings.transitionStyle??"black",transitionDuration:settings.transitionDuration??.4,originalAudioDucking:!!settings.audioDucking,audioDucking:!!settings.audioDucking&&!settings.layerFlags?.voice?.hidden,duckLevel:settings.duckLevel??.25,audioCompressor:!!settings.audioCompressor,lowCut:!!settings.lowCut,noiseReduction:!!settings.noiseReduction,aiDenoise:!!settings.aiDenoise,ratio:settings.ratio,resolution:settings.resolution,fps:settings.fps??30,quality:settings.quality??"standard",
   includeAudio:settings.includeAudio,layerFlags:settings.layerFlags||{},originalCaptionCues:settings.captionCues.slice(0,500),captionCues:settings.layerFlags?.captions?.hidden?[]:settings.captionCues.slice(0,500),
   originalTitleOverlay:settings.titleOverlay.slice(0,120),titleOverlay:settings.layerFlags?.title?.hidden?"":settings.titleOverlay.slice(0,120),
   originalMusicVolume:settings.musicVolume,musicVolume:settings.layerFlags?.music?.hidden?0:settings.musicVolume,fadeBetweenClips:settings.fadeBetweenClips,framing:settings.framing
  };
  const {data:createdVersion,error:saveError}=await db().from("studio_timeline_versions").insert({
   user_id:uid,project_id:pid,version_number:version,timeline
  }).select("id").single();
  if(saveError||!createdVersion?.id)throw saveError||new Error("Timeline version ID unavailable.");
  return {version,projectId:pid,timelineVersionId:String(createdVersion.id)};
 }catch(error){
  if(uploaded.length){
   const {error:cleanupError}=await db().storage.from(BUCKET).remove(uploaded);
   if(!cleanupError)await db().from("studio_assets").delete().eq("user_id",uid).eq("project_id",pid).in("object_path",uploaded);
  }
  throw asError(error);
 }
}
export async function loadCloudTimeline():Promise<LoadedCloudTimeline>{
 const uid=await user();
 const {data:projects,error:projectError}=await db().from("studio_projects")
  .select("id").eq("user_id",uid).eq("category","video_editor").order("created_at",{ascending:true}).limit(1);
 if(projectError)throw projectError;
 const pid=projects?.[0]?.id;
 if(!pid)throw new Error("No cloud video timeline exists for this account.");
 const {data:versions,error:versionError}=await db().from("studio_timeline_versions")
  .select("version_number,timeline").eq("user_id",uid).eq("project_id",pid)
  .order("version_number",{ascending:false}).limit(1);
 if(versionError)throw versionError;
 if(!versions?.[0])throw new Error("No cloud timeline has been saved yet.");
 const version=Number(versions[0].version_number);
 const t=versions[0].timeline as Record<string,unknown>;
 const sources=Array.isArray(t.clips)?t.clips as Entry[]:[];
 if(!sources.length||sources.length>30)throw new Error("Cloud timeline has no valid video clips.");
 const download=async(path:string)=>{
  if(!path.startsWith(uid+"/"+pid+"/"))throw new Error("Invalid cloud media path.");
  const {data,error}=await db().storage.from(BUCKET).download(path);
  if(error||!data)throw error||new Error("Media download failed.");
  return data as Blob;
 };
 const clips:CloudTimelineClip[]=[];
 for(const c of sources){
  const blob=await download(c.path);
  const file=new File([blob],String(c.name||"clip.mp4"),{type:c.mime||blob.type});
  clips.push({id:String(c.id),file,name:String(c.name),duration:Number(c.duration),start:Number(c.start),end:Number(c.end),...adjustments(c)});
 }
 let backgroundMusic:File|null=null;
 if(typeof t.musicPath==="string"){
  const blob=await download(t.musicPath);
  backgroundMusic=new File([blob],"Cloud soundtrack",{type:blob.type||"audio/mpeg"});
 }
 let voiceover:File|null=null;
 if(typeof t.voicePath==="string"){const blob=await download(t.voicePath);voiceover=new File([blob],"Cloud voiceover",{type:blob.type||"audio/mpeg"});}
 const imageLayers:CloudImageLayer[]=[];
 for(const entry of (Array.isArray(t.imageLayers)?t.imageLayers.slice(0,8):[]) as Array<Omit<CloudImageLayer,"file">&{path:string;name:string;mime:string}>){const blob=await download(entry.path);const {path:_,name,mime,...layer}=entry;const original=entry as typeof entry&{originalOpacity?:number;originalKeyframes?:CloudImageLayer['keyframes']};imageLayers.push({...layer,...(layer.hidden?{opacity:original.originalOpacity??1,keyframes:original.originalKeyframes??[]}:{}),file:new File([blob],name,{type:mime||blob.type})});}
 const ratio=t.ratio==="9:16"||t.ratio==="1:1"?t.ratio:"16:9";
 return {
  clips,version,voiceover,imageLayers,layerFlags:(t.layerFlags||{}) as CloudTimelineSettings["layerFlags"],voiceStart:bounded(t.voiceStart,0,7200),voiceVolume:bounded(t.originalVoiceVolume??t.voiceVolume,0,1,1),voiceLength:bounded(t.voiceLength,0,7200),transitionStyle:typeof t.transitionStyle==="string"?t.transitionStyle:"black",transitionDuration:bounded(t.transitionDuration,.1,2,.4),audioDucking:!!(t.originalAudioDucking??t.audioDucking),duckLevel:bounded(t.duckLevel,0,1,.25),audioCompressor:!!t.audioCompressor,lowCut:!!t.lowCut,noiseReduction:!!t.noiseReduction,aiDenoise:!!t.aiDenoise,ratio,resolution:Number(t.resolution)||720,fps:[24,25,30,60].includes(Number(t.fps))?Number(t.fps):30,quality:["low","standard","high"].includes(String(t.quality))?String(t.quality):"standard",includeAudio:t.includeAudio!==false,
  captionCues:Array.isArray(t.originalCaptionCues??t.captionCues)?((t.originalCaptionCues??t.captionCues) as CloudTimelineSettings["captionCues"]).slice(0,500) as CloudTimelineSettings["captionCues"]:[],
  titleOverlay:typeof (t.originalTitleOverlay??t.titleOverlay)==="string"?String(t.originalTitleOverlay??t.titleOverlay).slice(0,120):"",
  musicVolume:bounded(t.originalMusicVolume??t.musicVolume,0,1,.3),
  fadeBetweenClips:Boolean(t.fadeBetweenClips),framing:t.framing==="blur"?"blur":t.framing==="cover"?"cover":"contain",backgroundMusic
 };
}
