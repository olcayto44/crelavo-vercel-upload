"use client";
import {useEffect,useRef,useState} from "react";
import {adminPreviewFrame} from "@/lib/website-admin-preview-frame";
import styles from "./admin-review.module.css";
import {editWebsiteAdminPage,WebsiteAdminPageEdit} from "@/lib/website-admin-page-edit";
import type {WebsiteDesignSpecInput} from "@/lib/website-design-schema";
import type {z} from "zod";
type Page={path:string;title:string;content:string;sections?:{id:string;label:string}[]};
type Fields=z.infer<typeof WebsiteAdminPageEdit>;
export function WebsiteAdminReview({endpoint,token,version,body="{}",design,editEndpoint,onSaved,onBusy,onDirty}:{endpoint:string;token:string;version:number;body?:string;design?:WebsiteDesignSpecInput;editEndpoint?:string;onSaved?:()=>void;onBusy?:(v:boolean)=>void;onDirty?:(v:boolean)=>void}){
 const [pages,setPages]=useState<Page[]>([]),[selected,setSelected]=useState("admin"),[message,setMessage]=useState(""),[section,setSection]=useState("overview");
 const [slug,setSlug]=useState(design?.pages[0]?.slug??""),[fields,setFields]=useState<Fields|null>(null),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false);
 const lock=useRef(false);
 useEffect(()=>{const c=new AbortController();setPages([]);setMessage("Yönetim önizlemesi hazırlanıyor…");void(async()=>{try{const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body,signal:c.signal});const v=await r.json();if(!r.ok||!v.ok||!Array.isArray(v.pages))throw Error();if(!c.signal.aborted){setPages(v.pages);setMessage("");}}catch{if(!c.signal.aborted)setMessage("Yönetim önizlemesi yüklenemedi.");}})();return()=>c.abort();},[endpoint,token,version,body]);
 useEffect(()=>{const p=design?.pages.find(p=>p.slug===slug)??design?.pages[0];if(p){setFields({title:p.title,description:p.description,headline:p.headline,lead:p.lead});setDirty(false);onDirty?.(false);}},[design,slug,version,onDirty]);
 const active=pages.find(p=>p.path===selected)??pages[0],sections=active?.sections??[];
 // Restrict section selection to the server-provided fixed IDs. No script execution,
 // forms, credentials or live operations inside the preview iframe.
 const frameContent=active?adminPreviewFrame(active.content,section,sections):"";
 function update(k:keyof Fields,v:string){setFields(f=>f?{...f,[k]:v}:f);setDirty(true);onDirty?.(true);}
 async function save(){if(lock.current||!editEndpoint||!design||!fields||!dirty)return;lock.current=true;setBusy(true);onBusy?.(true);try{
 const next=editWebsiteAdminPage(design,slug,fields);
 const r=await fetch(editEndpoint,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({version,design:next})});
 const v=await r.json();if(r.status===409)throw Error("Sürüm değişti; kayıtlı tasarımı yeniden açın.");if(!r.ok||!v.ok)throw Error("Sayfa kaydedilemedi. Alanları kontrol edin.");setDirty(false);onDirty?.(false);setMessage("Sayfa değişiklikleri kaydedildi.");onSaved?.();
 }catch(e){setMessage(e instanceof Error?e.message:"Kaydetme doğrulanamadı.");}finally{lock.current=false;setBusy(false);onBusy?.(false);}}
 return <section style={{display:"grid",gap:8}}><p className={styles.notice}>Yönetim paneli önizlemesi · Sayfa değişiklikleri gerçek taslağa kaydedilir. Mesajlar, parola ve canlı işlemler kurulumdan sonra çalışır.</p>
 <div className={styles.toolbar}>{pages.map(p=><button key={p.path} type="button" disabled={dirty||busy} aria-pressed={selected===p.path} onClick={()=>{setSelected(p.path);setSection("overview");}}>{p.title}</button>)}</div>
 {active&&<div className={styles.workspace}>{sections.length>0&&<aside className={styles.sidebar}><strong className={styles.brand}>{design?.brand??"Website"}</strong><nav aria-label="Yönetim paneli bölümleri"><button type="button" disabled={busy||dirty} aria-pressed={section==="overview"} onClick={()=>setSection("overview")}>Genel bakış</button>{sections.map(s=><button key={s.id} disabled={busy||dirty} type="button" aria-pressed={section===s.id} onClick={()=>setSection(s.id)}>{s.label}</button>)}</nav></aside>}<div className={styles.main} style={sections.length?undefined:{gridColumn:"1 / -1"}}>{section==="pages"&&design&&editEndpoint&&fields&&<section className={styles.edit}><h3>Sayfa içeriğini düzenle</h3><label>Sayfa<select value={slug} disabled={busy||dirty} onChange={e=>setSlug(e.target.value)}>{design.pages.map(p=><option key={p.slug} value={p.slug}>{p.nav}</option>)}</select></label>{([["title","SEO başlığı",70],["description","SEO açıklaması",160],["headline","Ana başlık (H1)",100],["lead","Giriş metni",320]] as const).map(([k,label,max])=><label key={k}>{label}<textarea maxLength={max} disabled={busy} value={fields[k]} onChange={e=>update(k,e.target.value)}/></label>)}<div><button type="button" disabled={!dirty||busy} onClick={()=>void save()}>Değişiklikleri kaydet</button><button type="button" disabled={!dirty||busy} onClick={()=>{const p=design.pages.find(p=>p.slug===slug);if(p)setFields({title:p.title,description:p.description,headline:p.headline,lead:p.lead});setDirty(false);onDirty?.(false);}}>Vazgeç</button></div></section>}<iframe title="Bağımsız yönetim paneli önizlemesi" sandbox="" referrerPolicy="no-referrer" srcDoc={frameContent}/></div></div>}
 <p role="status">{message}</p></section>;
}
