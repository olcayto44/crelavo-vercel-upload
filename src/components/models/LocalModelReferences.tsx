"use client";
import {useRef,useState} from "react";
import type {ModelLocale} from "@/lib/ai-models";
import type {DraftImage} from "@/lib/model-draft-contract";
import {referenceCopy} from "@/lib/model-reference-copy";
import {draftCopy} from "@/lib/model-draft-copy";
import styles from "./ModelStudio.module.css";
export function LocalModelReferences({locale,limit,images,allowed,onImages,onAllowed,disabled=false,onBusy}:{locale:ModelLocale;limit:number;images:DraftImage[];allowed:boolean;onImages:(v:DraftImage[])=>void;onAllowed:(v:boolean)=>void;disabled?:boolean;onBusy:(v:boolean)=>void}){
 const c=referenceCopy[locale],[error,setError]=useState(""),[busy,setBusy]=useState(false),locked=useRef(false);
 async function pick(files:File[]){if(!allowed||locked.current||disabled||!files.length)return;setError("");if(files.length+images.length>limit||files.some(f=>!["image/png","image/jpeg","image/webp"].includes(f.type)||f.size<=0||f.size>10000000)){setError(c.invalid);return}locked.current=true;setBusy(true);onBusy(true);
 const added:DraftImage[]=[];
 try{for(const f of files){const bitmap=await createImageBitmap(f);try{if(bitmap.width*bitmap.height>24000000||!bitmap.width||!bitmap.height)throw Error("invalid");const scale=Math.min(1,768/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const context=canvas.getContext("2d");if(!context)throw Error("invalid");context.fillStyle="#ffffff";context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);const jpeg=canvas.toDataURL("image/jpeg",0.68).split(",")[1];if(!jpeg||jpeg.length>240000)throw Error("invalid");added.push({name:f.name.slice(0,120),jpeg});}finally{bitmap.close()}}
 onImages([...images,...added])
 }catch{setError(c.invalid)}finally{locked.current=false;setBusy(false);onBusy(false)}}
 return <div className={styles.refArea}><label className={styles.check}><input type="checkbox" checked={allowed} disabled={busy||disabled} onChange={e=>{onAllowed(e.target.checked);if(!e.target.checked)onImages([])}}/>{c.rights}</label><label>{c.label} ({images.length}/{limit})<input type="file" accept="image/png,image/jpeg,image/webp" multiple={limit>1} disabled={!allowed||busy||disabled||images.length>=limit} onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value="";void pick(files)}}/></label><p className={styles.muted}>{draftCopy[locale].local}</p>{error&&<p role="alert">{error}</p>}<div className={styles.refGrid}>{images.map((img,index)=><div key={index}><img src={"data:image/jpeg;base64,"+img.jpeg} alt={c.image+" "+(index+1)}/><small title={img.name}>{img.name}</small><button type="button" className="cr-action" disabled={busy||disabled} onClick={()=>onImages(images.filter((_,i)=>i!==index))}>{c.remove}</button></div>)}</div></div>
}
