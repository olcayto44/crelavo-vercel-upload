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
export type CloudTimelineSettings = {
 ratio: "16:9"|"9:16"|"1:1"; resolution: number; includeAudio: boolean;
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
export async function saveCloudTimeline(clips:CloudTimelineClip[], settings:CloudTimelineSettings):Promise<number>{
 if(!clips.length)throw new Error("Add video clips before saving.");
 if(clips.length>30)throw new Error("Cloud timeline supports up to 30 clips.");
 const files=[...clips.map(c=>c.file),...(settings.backgroundMusic?[settings.backgroundMusic]:[])];
 const size=files.reduce((n,f)=>n+f.size,0);
 if(size>MAX_TOTAL || files.some(f=>f.size===0||f.size>MAX_FILE))
  throw new Error("Cloud timeline upload is limited to 90 MB total. Local saves support larger projects.");
 if(files.some(f=>!(/^(video\/(mp4|webm|quicktime|x-m4v)|audio\/(mpeg|mp4|wav|ogg|webm))$/i.test(f.type))))
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
 let musicPath:string|null=null;
 try{
  for(let i=0;i<files.length;i++){
   const file=files[i]; const extension=file.name.match(/\.(mp4|webm|mov|m4v|mp3|m4a|wav|ogg)$/i)?.[0]?.toLowerCase()||"";
   const path=`${uid}/${pid}/${crypto.randomUUID()}${extension}`;
   const {error:storageError}=await db().storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});
   if(storageError)throw storageError;
   uploaded.push(path);
   const {error:assetError}=await db().from("studio_assets").insert({
    user_id:uid,project_id:pid,kind:i<clips.length?"video":"audio",label:file.name.slice(0,130),
    bucket_id:BUCKET,object_path:path,content_type:file.type,byte_size:file.size,
    metadata:{source:"timeline",version}
   });
   if(assetError)throw assetError;
   if(i<clips.length) {
    const c=clips[i];entries.push({id:c.id,name:c.name,path,mime:file.type,start:c.start,end:c.end,duration:c.duration,...adjustments(c)});
   }else musicPath=path;
  }
  const timeline={
   clips:entries,musicPath,ratio:settings.ratio,resolution:settings.resolution,
   includeAudio:settings.includeAudio,captionCues:settings.captionCues.slice(0,500),
   titleOverlay:settings.titleOverlay.slice(0,120),
   musicVolume:settings.musicVolume,fadeBetweenClips:settings.fadeBetweenClips,framing:settings.framing
  };
  const {error:saveError}=await db().from("studio_timeline_versions").insert({
   user_id:uid,project_id:pid,version_number:version,timeline
  });
  if(saveError)throw saveError;
  return version;
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
 const ratio=t.ratio==="9:16"||t.ratio==="1:1"?t.ratio:"16:9";
 return {
  clips,version,ratio,resolution:Number(t.resolution)||720,includeAudio:t.includeAudio!==false,
  captionCues:Array.isArray(t.captionCues)?t.captionCues.slice(0,500) as CloudTimelineSettings["captionCues"]:[],
  titleOverlay:typeof t.titleOverlay==="string"?t.titleOverlay.slice(0,120):"",
  musicVolume:typeof t.musicVolume==="number"?Math.min(1,Math.max(0,t.musicVolume)):0.3,
  fadeBetweenClips:Boolean(t.fadeBetweenClips),framing:t.framing==="blur"?"blur":t.framing==="cover"?"cover":"contain",backgroundMusic
 };
}
