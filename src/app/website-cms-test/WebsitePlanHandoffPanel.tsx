"use client";
import {useRef,useState} from "react";
import type {SupabaseClient} from "@supabase/supabase-js";
type Project={id:string;title:string;revision:number;production_id:string|null};
type Quote={projectId:string;revision:number;quoteHash:string;brief:Record<string,unknown>;credits:number;packId:string;productionId:string|null};
export function WebsitePlanHandoffPanel({db,onApproved}:{db:SupabaseClient;onApproved:()=>void}){
 const [projects,setProjects]=useState<Project[]>([]),[selected,setSelected]=useState(""),[quote,setQuote]=useState<Quote|null>(null),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const lock=useRef(false);
 async function call(action:"list"|"quote"|"approve"){
 if(lock.current||action==="quote"&&!selected||action==="approve"&&!quote)return;
 if(action==="approve"&&!window.confirm("Bu kayıtlı brief ve paket planını onaylıyor musunuz? Şu anda üretim veya kredi harcaması başlamaz."))return;
 lock.current=true;setBusy(true);setNotice("");
 try{
 const s=await db.auth.getSession();if(s.error||!s.data.session?.access_token)throw Error();
 const body=action==="list"?{action}:action==="quote"?{action,projectId:selected}:{action,projectId:quote!.projectId,revision:quote!.revision,quoteHash:quote!.quoteHash,confirmPlan:true};
 const r=await fetch("/api/studio/website-plan-handoff-test",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+s.data.session.access_token},body:JSON.stringify(body)}),v=await r.json();
 if(!r.ok||!v.ok){setQuote(null);setNotice("İşlem tamamlanmadı: "+String(v.code||"unavailable"));return;}
 if(action==="list"){setQuote(null);setProjects(Array.isArray(v.projects)?v.projects:[]);setSelected("");setNotice(v.projects?.length?"Kayıtlı asistan projeleri yüklendi.":"Henüz kayıtlı asistan projesi yok.");}
 else if(action==="quote"){setQuote(v);setNotice("Planı inceleyin. Üretim için ayrıca kredi onayı gerekir.");}
 else{setQuote(null);setNotice("Plan onaylandı: "+String(v.productionId)+". Henüz üretim veya ücret yok. Üretim listesini yenileyin.");onApproved();}
 }catch{setQuote(null);setNotice("Sonuç doğrulanamadı; kayıtlı projeleri tekrar kontrol edin.");}finally{lock.current=false;setBusy(false);}
 }
 return <details><summary>Asistan brief → Website üretim planı (izole test)</summary><p>Bu bağlantı kayıtlı gerçek asistan brief'ini sunucudan alır; şimdilik İngilizce tanıtım siteleri ve referanssız kapsam. Ödeme, tam dinamik kod veya AI üretimi bu adımda başlamaz.</p><button disabled={busy} type="button" onClick={()=>void call("list")}>Asistan projelerimi yükle</button><label>Proje<select disabled={busy} value={selected} onChange={e=>{setSelected(e.target.value);setQuote(null);}}><option value="">Seçiniz</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title} · r{p.revision}</option>)}</select></label><button disabled={busy||!selected} type="button" onClick={()=>void call("quote")}>Üretim planını incele</button>{quote&&<><dl>{Object.entries(quote.brief).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{Array.isArray(v)?v.join(" · "):String(v)}</dd></div>)}</dl><p>{quote.packId} · {quote.credits} üretim kredisi (sonraki ayrı onay) · brief sürümü {quote.revision}</p><button disabled={busy} type="button" onClick={()=>void call("approve")}>Bu planı onayla (ücretsiz)</button></>}<p role="status">{notice}</p></details>;
}
