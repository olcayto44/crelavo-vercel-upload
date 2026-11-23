"use client";
import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type CloudRecord = {
 id: string; label: string; kind: string; content_type: string | null;
 byte_size: number | null; object_path: string;
 metadata: { description?: string; referenceKind?: string; permission?: boolean } | null;
};
const BUCKET = "studio-private";
const allowed = /^(image\/(png|jpeg|webp|gif)|video\/(mp4|webm|quicktime)|audio\/(mpeg|mp4|wav|ogg|webm))$/i;
const allowedTypes = ["character", "product", "location", "wardrobe", "voice", "style", "reference"];
const uuid = () => crypto.randomUUID();
const safeExtension = (file: File) => ({
 "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif",
 "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov",
 "audio/mpeg": ".mp3", "audio/mp4": ".m4a", "audio/wav": ".wav",
 "audio/ogg": ".ogg", "audio/webm": ".webm"
} as Record<string, string>)[file.type.toLowerCase()] || "";
function errorText(err: unknown) { return err instanceof Error ? err.message : "The request failed."; }

export default function CloudAssetLibrary() {
 const [owner,setOwner]=useState("");
 const [projectId,setProjectId]=useState("");
 const [items,setItems]=useState<CloudRecord[]>([]);
 const [status,setStatus]=useState("Checking cloud access…");
 const [busy,setBusy]=useState(false);
 const [label,setLabel]=useState("");
 const [kind,setKind]=useState("reference");
 const [description,setDescription]=useState("");
 const [rights,setRights]=useState(false);
 const [file,setFile]=useState<File|null>(null);
 const [preview,setPreview]=useState<{id:string;url:string;mime:string}|null>(null);
 const db=supabaseBrowser();
 const refresh=useCallback(async (uid:string, pid:string)=>{
  const {data,error}=await db.from("studio_assets").select("id,label,kind,content_type,byte_size,object_path,metadata")
   .eq("user_id",uid).eq("project_id",pid).order("created_at",{ascending:false}).limit(100);
  if(error)throw error;
  setItems((data||[]) as CloudRecord[]);
 },[db]);
 useEffect(()=>{
  let mounted=true;
  void (async()=>{
   try {
    const {data:{user},error}=await db.auth.getUser();
    if(error||!user)throw new Error("Sign in to synchronize references across devices.");
    const {data:existing,error:lookupError}=await db.from("studio_projects").select("id")
     .eq("user_id",user.id).eq("category","elements").order("created_at",{ascending:true}).limit(1);
    if(lookupError)throw lookupError;
    let pid=existing?.[0]?.id as string|undefined;
    if(!pid){
     const {data:created,error:createError}=await db.from("studio_projects")
      .insert({user_id:user.id,category:"elements",title:"Elements Library"})
      .select("id").single();
     if(createError)throw createError;
     pid=created.id as string;
    }
    if(!mounted)return;
    setOwner(user.id);setProjectId(pid);
    await refresh(user.id,pid);
    if(mounted)setStatus("Cloud library ready. Files are private to this account.");
   }catch(err){if(mounted)setStatus(errorText(err));}
  })();
  return ()=>{mounted=false};
 },[db,refresh]);
 async function upload(){
  if(busy||!owner||!projectId||!file)return;
  if(!label.trim())return setStatus("Enter a reference name.");
  if(file.size===0||file.size>25_000_000)return setStatus("File must be between 1 byte and 25 MB.");
  if(!allowed.test(file.type))return setStatus("Unsupported media type. Choose PNG, JPEG, WebP, GIF, MP4, WebM, MOV, MP3, M4A, WAV or OGG.");
  if((kind==="character"||kind==="voice")&&!rights)return setStatus("Confirm permission before uploading a face or voice reference.");
  const path=owner+"/"+projectId+"/"+uuid()+safeExtension(file);
  setBusy(true);setStatus("Uploading private reference…");
  try {
   const {error:uploadError}=await db.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});
   if(uploadError)throw uploadError;
   const {error:recordError}=await db.from("studio_assets").insert({
    user_id:owner,project_id:projectId,kind:"reference",label:label.trim().slice(0,100),
    bucket_id:BUCKET,object_path:path,content_type:file.type,byte_size:file.size,
    metadata:{referenceKind:kind,description:description.trim().slice(0,500),permission:rights}
   });
   if(recordError){
    const {error:cleanupError}=await db.storage.from(BUCKET).remove([path]);
    throw new Error(recordError.message+(cleanupError?" Upload cleanup also failed; contact support.":""));
   }
   await refresh(owner,projectId);
   setFile(null);setLabel("");setDescription("");setRights(false);
   const input=document.getElementById("studio-cloud-upload") as HTMLInputElement|null;
   if(input)input.value="";
   setStatus("Reference stored privately in Supabase. It is not automatically attached to an AI model.");
  }catch(err){setStatus("Cloud upload failed: "+errorText(err));}
  finally{setBusy(false)}
 }
 async function showPreview(item:CloudRecord){
  setBusy(true);
  try {
   const {data,error}=await db.storage.from(BUCKET).createSignedUrl(item.object_path,60);
   if(error||!data?.signedUrl)throw error||new Error("Signed preview unavailable.");
   setPreview({id:item.id,url:data.signedUrl,mime:item.content_type||""});
   setStatus("Private preview link expires after 60 seconds.");
  }catch(err){setStatus("Preview failed: "+errorText(err));}
  finally{setBusy(false)}
 }
 function useNotes(item:CloudRecord){
  if(window.parent===window)return setStatus("Open Elements within Studio to insert notes.");
  window.parent.postMessage({
   type:"crelavo-studio-asset-reference",owner,name:item.label,
   kind:item.metadata?.referenceKind||"reference",description:item.metadata?.description||""
  },window.location.origin);
  setStatus("Reference notes inserted. Media is not yet attached to AI generation.");
 }
 async function remove(item:CloudRecord){
  if(busy||!window.confirm("Permanently remove this cloud reference?"))return;
  setBusy(true);
  try{
   const {error:storageError}=await db.storage.from(BUCKET).remove([item.object_path]);
   if(storageError)throw storageError;
   const {error:rowError}=await db.from("studio_assets").delete().eq("id",item.id).eq("user_id",owner);
   if(rowError)throw rowError;
   if(preview?.id===item.id)setPreview(null);
   await refresh(owner,projectId);
   setStatus("Cloud reference removed.");
  }catch(err){setStatus("Delete failed: "+errorText(err));}
  finally{setBusy(false)}
 }
 return <section style={{marginTop:20,border:"1px solid #4b345b",borderRadius:12,padding:14,background:"#20172b"}}>
  <h2 style={{fontSize:15,margin:"0 0 5px"}}>Cloud Reference Library</h2>
  <p style={{fontSize:11,color:"#c3b2d0",marginTop:0}}>Private Supabase storage for signed-in users. Separate from local device references.</p>
  <p role="status" aria-live="polite" style={{fontSize:12,color:"#d6b7f5"}}>{status}</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:9}}>
   <label style={{fontSize:11}}>Reference name<input value={label} onChange={e=>setLabel(e.target.value)} maxLength={100} style={{display:"block",width:"100%"}} /></label>
   <label style={{fontSize:11}}>Reference kind<select value={kind} onChange={e=>setKind(e.target.value)} style={{display:"block",width:"100%"}}>{allowedTypes.map(k=><option value={k} key={k}>{k}</option>)}</select></label>
   <label style={{fontSize:11}}>Media file (max 25 MB)<input id="studio-cloud-upload" type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm" onChange={e=>setFile(e.target.files?.[0]||null)} style={{display:"block",maxWidth:"100%"}} /></label>
   <label style={{fontSize:11}}>Description<input value={description} onChange={e=>setDescription(e.target.value)} maxLength={500} style={{display:"block",width:"100%"}} /></label>
  </div>
  {(kind==="character"||kind==="voice")&&<label style={{display:"block",marginTop:10,fontSize:11}}><input type="checkbox" checked={rights} onChange={e=>setRights(e.target.checked)} /> I have the rights or permission to use this identity.</label>}
  <button onClick={()=>void upload()} disabled={busy||!owner||!projectId||!file||!label.trim()} style={{marginTop:10,background:"#713cb0",color:"white"}}>Upload to private cloud</button>
  <div style={{display:"grid",gap:8,marginTop:14}}>
   {items.map(item=><div key={item.id} style={{border:"1px solid #50375f",borderRadius:8,padding:10,fontSize:12}}>
    <strong>{item.label}</strong> <span style={{color:"#ad9aba"}}>({item.metadata?.referenceKind||item.kind}, {((item.byte_size||0)/1048576).toFixed(1)} MB)</span>
    {item.metadata?.description&&<p style={{whiteSpace:"pre-wrap"}}>{item.metadata.description}</p>}
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:7}}>
     <button disabled={busy} onClick={()=>void showPreview(item)}>Preview</button>
     <button disabled={busy} onClick={()=>useNotes(item)}>Use notes in Studio</button>
     <button disabled={busy} onClick={()=>void remove(item)}>Delete</button>
    </div>
    {preview?.id===item.id&&<div style={{marginTop:8}}>
      {preview.mime.startsWith("image/")?<img src={preview.url} alt={item.label} style={{maxWidth:"100%",maxHeight:240}}/>:
       preview.mime.startsWith("video/")?<video key={preview.url} src={preview.url} controls style={{maxWidth:"100%",maxHeight:240}}/>:
       preview.mime.startsWith("audio/")?<audio key={preview.url} src={preview.url} controls/>:
       <span>Preview not supported for this file type.</span>}
    </div>}
   </div>)}
   {owner&&items.length===0&&<p style={{fontSize:11,color:"#ad9aba"}}>No cloud references saved yet.</p>}
  </div>
 </section>;
}
