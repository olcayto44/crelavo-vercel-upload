"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import CloudAssetLibrary from "./CloudAssetLibrary";

type Kind = "character" | "product" | "location" | "wardrobe" | "voice" | "style" | "reference";
type Stored = { key: string; owner: string; name: string; kind: Kind; description: string; mime: string; size: number; createdAt: number; blob: Blob; permission: boolean };
type DisplayAsset = Omit<Stored, "blob">;
const DB = "crelavo-studio-local-elements-v1";
const STORE = "elements";
const kinds: Kind[] = ["character","product","location","wardrobe","voice","style","reference"];
function openDb(): Promise<IDBDatabase> {
 return new Promise((resolve,reject) => {
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{
   const db=request.result;if(!db.objectStoreNames.contains(STORE)){
    const store=db.createObjectStore(STORE,{keyPath:"key"});
    store.createIndex("owner","owner",{unique:false});
   }
  };
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
}
async function dbGet(key: string): Promise<Stored | undefined> {
 const db=await openDb();return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readonly");const req=tx.objectStore(STORE).get(key);
  req.onsuccess=()=>resolve(req.result as Stored | undefined);
  req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();
 });
}
async function dbAll(owner: string): Promise<Stored[]> {
 const db=await openDb();return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readonly");const req=tx.objectStore(STORE).index("owner").getAll(owner);
  req.onsuccess=()=>resolve(req.result as Stored[]);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();
 });
}
async function dbWrite(record: Stored | null, key?: string) {
 const db=await openDb();return new Promise<void>((resolve,reject)=>{
  const tx=db.transaction(STORE,"readwrite");
  if(record)tx.objectStore(STORE).put(record);
  else if(key)tx.objectStore(STORE).delete(key);
  tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};
 });
}
function title(kind: Kind) {
 return ({character:"Character / Twin",product:"Product / Object",location:"Location / Environment",wardrobe:"Outfit / Wardrobe",voice:"Voice / Audio",style:"Visual Style",reference:"Reference"} as Record<Kind,string>)[kind];
}
export default function LocalAssetLibrary() {
 const [owner,setOwner]=useState("");
 const [status,setStatus]=useState("Checking your Crelavo account…");
 const [records,setRecords]=useState<DisplayAsset[]>([]);
 const [name,setName]=useState("");
 const [kind,setKind]=useState<Kind>("character");
 const [description,setDescription]=useState("");
 const [permission,setPermission]=useState(false);
 const [file,setFile]=useState<File|null>(null);
 const [selection,setSelection]=useState<string|null>(null);
 const [preview,setPreview]=useState<string|null>(null);
 const [selectedMime,setSelectedMime]=useState("");
 const [busy,setBusy]=useState(false);
 const [filter,setFilter]=useState<Kind|"all">("all");
 useEffect(()=>{
  let active=true;
  supabaseBrowser().auth.getUser().then(async({data,error})=>{
   if(!active)return;
   if(error||!data.user){setStatus("Sign in to access your personal reference library.");return;}
   setOwner(data.user.id);
   const items=await dbAll(data.user.id);
   if(active){setRecords(items.map(({blob,...rest})=>rest).sort((a,b)=>b.createdAt-a.createdAt));setStatus("References are saved only in this browser, not the cloud.");}
  }).catch(()=>{if(active)setStatus("The local library is unavailable in this browser.");});
  return ()=>{active=false};
 },[]);
 useEffect(()=>{
  let active=true;let url: string|null=null;
  if(selection&&owner)dbGet(selection).then(item=>{
   if(!active||!item||item.owner!==owner)return;
   url=URL.createObjectURL(item.blob);setPreview(url);setSelectedMime(item.mime);
  }).catch(()=>setStatus("Could not open the selected reference."));
  else {setPreview(null);setSelectedMime("");}
  return()=>{active=false;if(url)URL.revokeObjectURL(url)};
 },[selection,owner]);
 async function refresh(){
  if(!owner)return;
  const all=await dbAll(owner);
  setRecords(all.map(({blob,...rest})=>rest).sort((a,b)=>b.createdAt-a.createdAt));
 }
 async function add(){
  if(!owner||!file||!name.trim()||busy)return;
  if(records.length>=80){setStatus("Library limit is 80 reference files per account in this browser.");return;}
  if(file.size>25_000_000){setStatus("Reference file must be 25 MB or less.");return;}
  if(!/^(image\/|video\/|audio\/)/.test(file.type)){setStatus("Only image, audio and video reference files are accepted.");return;}
  if(["character","voice"].includes(kind)&&!permission){setStatus("Confirm you own or have permission to use this face or voice reference.");return;}
  setBusy(true);
  try{
   const item: Stored={key:owner+":"+crypto.randomUUID(),owner,name:name.trim().slice(0,100),description:description.trim().slice(0,500),kind,mime:file.type,size:file.size,createdAt:Date.now(),blob:file,permission};
   await dbWrite(item);await refresh();setSelection(item.key);
   setFile(null);setName("");setDescription("");setPermission(false);
   const input=document.getElementById("studio-ref-input") as HTMLInputElement|null;
   if(input)input.value="";
   setStatus(title(kind)+" saved as a local reusable reference. It has not been uploaded or used to train a model.");
  }catch{setStatus("Could not store this file. Check browser storage permissions and free space.")}
  finally{setBusy(false)}
 }
 function useInStudio(key: string) {
    const item = records.find(r => r.key === key && r.owner === owner);
    if (!item || !owner || window.parent === window) return;
    window.parent.postMessage({
      type: "crelavo-studio-asset-reference",
      owner, name: item.name, kind: item.kind,
      description: item.description
    }, window.location.origin);
    setStatus("Reference notes inserted into the Studio prompt. The original file remains on this device and is not uploaded to AI.");
  }
 async function remove(key: string){
  if(!owner||!key.startsWith(owner+":")||busy)return;
  if(!window.confirm("Delete this local reference? This cannot be undone."))return;
  setBusy(true);try{await dbWrite(null,key);if(selection===key)setSelection(null);await refresh();setStatus("Local reference deleted.");}
  catch{setStatus("Could not delete the reference.");}finally{setBusy(false)}
 }
 const visible=records.filter(r=>filter==="all"||r.kind===filter);
 return <main className="studio-compact-elements" style={{color:"#f3edff",background:"#120e1d",minHeight:"100%",maxWidth:1250,margin:"0 auto",padding:"12px 16px",fontFamily:"Inter,system-ui,sans-serif"}}>\n  <style>{`.studio-compact-elements *{box-sizing:border-box}.studio-compact-elements .elements-grid{display:grid;grid-template-columns:minmax(220px,350px) minmax(0,1fr);gap:12px}@media(max-width:740px){.studio-compact-elements .elements-grid{grid-template-columns:1fr}}`}</style>
   <header style={{marginBottom:10}}><a href="/dashboard/studio-v2?category=visual_clone&uiLang=en" style={{display:"inline-block",color:"#dec8f5",fontSize:12,marginBottom:6}}>← Back to Studio V2</a><h1 style={{fontSize:18,margin:0}}>Elements & Reference Library</h1><p style={{color:"#b5a6c5",fontSize:12}}>Create a reusable collection of characters, objects, locations, outfits, visual styles, and authorized voice references.</p></header>
   <p role="status" aria-live="polite" style={{color:"#d5c2e8",fontSize:12}}>{status}</p>
   <div className="elements-grid">
    <section style={{border:"1px solid #4b345b",borderRadius:12,padding:12,background:"#20172b",alignSelf:"start"}}>
     <h2 style={{fontSize:14,margin:"0 0 12px"}}>Save a reference</h2>
     <label style={{fontSize:12,display:"block",marginBottom:9}}>Reference type
      <select value={kind} onChange={e=>setKind(e.target.value as Kind)} style={{display:"block",width:"100%",marginTop:5}}>{kinds.map(k=><option key={k} value={k}>{title(k)}</option>)}</select>
     </label>
     <label style={{fontSize:12,display:"block",marginBottom:9}}>Reference name
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Main Character" maxLength={100} style={{display:"block",width:"100%",marginTop:5}} />
     </label>
     <label style={{fontSize:12,display:"block",marginBottom:9}}>Description and consistency notes
      <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Face, freckles, outfit, scene, material, lighting…" rows={3} maxLength={500} style={{display:"block",width:"100%",marginTop:5}} />
     </label>
     <label style={{fontSize:12,display:"block",marginBottom:9}}>Media file (max 25 MB)
      <input id="studio-ref-input" type="file" accept="image/*,video/*,audio/*" onChange={e=>setFile(e.target.files?.[0]||null)} style={{display:"block",maxWidth:"100%",marginTop:5}} />
     </label>
     {["character","voice"].includes(kind)&&<label style={{display:"flex",gap:8,fontSize:11,margin:"10px 0"}}><input type="checkbox" checked={permission} onChange={e=>setPermission(e.target.checked)} />I have permission to use this person's image or voice.</label>}
     <button disabled={!owner||!file||!name.trim()||busy} onClick={()=>{void add()}} style={{background:"#7a3bbb",color:"#fff",border:0,padding:"10px 15px",borderRadius:8}}>Save local reference</button>
    </section>
    <section style={{minWidth:0}}>
     <label style={{fontSize:12}}>View category <select value={filter} onChange={e=>setFilter(e.target.value as Kind|"all")}><option value="all">All ({records.length})</option>{kinds.map(k=><option key={k} value={k}>{title(k)}</option>)}</select></label>
     <div style={{display:"flex",gap:7,flexWrap:"wrap",margin:"12px 0"}}>
      {visible.length?visible.map(item=><button key={item.key} onClick={()=>setSelection(item.key)} style={{padding:10,borderRadius:9,border:selection===item.key?"1px solid #bb75ff":"1px solid #463255",background:"#21172e",textAlign:"left",maxWidth:200,color:"#f4eeff",overflowWrap:"anywhere"}}>
       <strong style={{display:"block",fontSize:12}}>{item.name}</strong><small>{title(item.kind)} · {(item.size/1048576).toFixed(1)} MB</small>
      </button>):<p style={{fontSize:12,color:"#ab9abc"}}>No references saved for this category.</p>}
     </div>
     {selection&&records.some(r=>r.key===selection)&&<div style={{border:"1px solid #4d345e",borderRadius:10,padding:12}}>
      {preview?(selectedMime.startsWith("image/")?<img src={preview} alt="Saved reference preview" style={{maxHeight:200,maxWidth:"100%",objectFit:"contain"}}/>:selectedMime.startsWith("video/")?<video src={preview} controls style={{maxHeight:200,maxWidth:"100%"}}/>:selectedMime.startsWith("audio/")?<audio src={preview} controls/>:null):<p>Loading reference…</p>}
      <p style={{fontSize:12,whiteSpace:"pre-wrap"}}>{records.find(r=>r.key===selection)?.description||"No description"}</p>
      <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
        <button onClick={()=>useInStudio(selection)} disabled={busy} style={{background:"#7037b5",color:"#fff",border:0,padding:"8px 13px",borderRadius:8}}>Use notes in Studio brief</button>
        <button onClick={()=>{void remove(selection)}} disabled={busy} style={{background:"#4a2432",color:"#fff",border:0,padding:"8px 13px",borderRadius:8}}>Delete reference</button>
      </div>
     </div>}
    </section>
   </div>
   <CloudAssetLibrary />
   <p style={{fontSize:11,color:"#aa99b9",marginTop:16}}>These are real media files stored in IndexedDB on this device, separated by signed-in account. They are not synchronized across devices or connected to AI identity training, motion transfer, or render pipelines yet.</p>
 </main>;
}
