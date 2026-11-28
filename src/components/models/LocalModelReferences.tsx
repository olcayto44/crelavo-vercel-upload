"use client";
import {useEffect,useRef,useState} from "react";
import type {ModelLocale} from "@/lib/ai-models";
import {referenceCopy} from "@/lib/model-reference-copy";
import styles from "./ModelStudio.module.css";
type LocalImage={name:string;url:string};
export function LocalModelReferences({locale,limit}:{locale:ModelLocale;limit:number}){
 const c=referenceCopy[locale],[images,setImages]=useState<LocalImage[]>([]),[allowed,setAllowed]=useState(false),[error,setError]=useState(""),[busy,setBusy]=useState(false),live=useRef<LocalImage[]>([]),active=useRef(true);
 useEffect(()=>{active.current=true;return()=>{active.current=false;live.current.forEach(x=>URL.revokeObjectURL(x.url));live.current=[]}},[]);
 function change(next:LocalImage[]){live.current=next;setImages(next)}
 function clear(){live.current.forEach(x=>URL.revokeObjectURL(x.url));change([])}
 async function pick(files:File[]){if(!allowed||busy||!files.length)return;setError("");if(files.length+live.current.length>limit||files.some(f=>!["image/png","image/jpeg","image/webp"].includes(f.type)||f.size<=0||f.size>10000000)){setError(c.invalid);return}setBusy(true);
 const added:LocalImage[]=[];
 try{for(const f of files){const bitmap=await createImageBitmap(f);try{if(bitmap.width*bitmap.height>24000000||!bitmap.width||!bitmap.height)throw Error("invalid");}finally{bitmap.close()}added.push({name:f.name.slice(0,120),url:URL.createObjectURL(f)})}
 if(!active.current){added.forEach(x=>URL.revokeObjectURL(x.url));return}change([...live.current,...added])
 }catch{added.forEach(x=>URL.revokeObjectURL(x.url));if(active.current)setError(c.invalid)}finally{if(active.current)setBusy(false)}}
 return <div className={styles.refArea}><label className={styles.check}><input type="checkbox" checked={allowed} disabled={busy} onChange={e=>{setAllowed(e.target.checked);if(!e.target.checked)clear()}}/>{c.rights}</label><label>{c.label} ({images.length}/{limit})<input type="file" accept="image/png,image/jpeg,image/webp" multiple={limit>1} disabled={!allowed||busy||images.length>=limit} onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value="";void pick(files)}}/></label><p className={styles.muted}>{c.notice}</p>{error&&<p role="alert">{error}</p>}<div className={styles.refGrid}>{images.map((img,index)=><div key={img.url}><img src={img.url} alt={c.image+" "+(index+1)}/><small title={img.name}>{img.name}</small><button type="button" className="cr-action" disabled={busy} onClick={()=>{URL.revokeObjectURL(img.url);change(live.current.filter(x=>x.url!==img.url))}}>{c.remove}</button></div>)}</div></div>
}
