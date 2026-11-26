"use client";
import {useRef,useState} from "react";
import type {SupabaseClient} from "@supabase/supabase-js";
type Project={id:string;title:string;category:"website"|"image";state:string};
type Quote={hash:string;credits:number;payload:Record<string,unknown>};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function IsolatedProductionPanel({db}:{db:SupabaseClient}){
 const [projects,setProjects]=useState<Project[]>([]),[selected,setSelected]=useState(""),[prompt,setPrompt]=useState(""),[aspect,setAspect]=useState("16:9"),[requestId,setRequestId]=useState(""),[quote,setQuote]=useState<Quote|null>(null),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[submitted,setSubmitted]=useState(false);
 const lock=useRef(false),current=projects.find(p=>p.id===selected);
 function change(id:string){setSelected(id);setQuote(null);setNotice("");setSubmitted(false);setRequestId("");}
 async function load(){if(lock.current)return;lock.current=true;setBusy(true);setQuote(null);try{const r=await db.rpc("website_test_owned_production_list");if(r.error||!Array.isArray(r.data))throw Error();const rows=r.data.filter((p:Project)=>uuid.test(p.id)&&["website","image"].includes(p.category)&&typeof p.title==="string");setProjects(rows);if(!rows.some((p:Project)=>p.id===selected))change("");setNotice(rows.length?"Kayıtlı üretim projeleri yüklendi.":"Onaylanmış Website planı veya görsel projesi bulunamadı.");}catch{setNotice("Kayıtlı projeler okunamadı.");}finally{lock.current=false;setBusy(false);}}
 async function run(action:"status"|"quote"|"submit"){
 if(!current||lock.current||action==="submit"&&(!quote||submitted)||action==="quote"&&(submitted||current.category==="image"&&(!prompt.trim()||!uuid.test(requestId))))return;
 if(action==="status"&&current.category==="image"&&!uuid.test(requestId))return;
 if(action==="submit"&&!window.confirm("En fazla "+quote!.credits+" üretim kredisi için bu işlemi onaylıyor musunuz? İşlem otomatik tekrar edilmez."))return;
 const payload=action==="submit"?{...quote!.payload,action,quoteHash:quote!.hash,approvedCredits:quote!.credits,confirmProduction:true}:{action,...(current.category==="website"?{productionId:current.id}:{projectId:current.id,requestId,...(action==="quote"?{request:{prompt:prompt.trim(),aspect}}:{})})};
 if(action==="submit"){setSubmitted(true);setQuote(null);}else if(action==="quote")setQuote(null);
 lock.current=true;setBusy(true);setNotice("");
 try{
 const s=await db.auth.getSession();if(s.error||!s.data.session?.access_token)throw Error();
 const r=await fetch(current.category==="website"?"/api/studio/website-ai-launch-test":"/api/studio/image-launch-test",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+s.data.session.access_token},body:JSON.stringify(payload)});
 const v=await r.json();
 if(!r.ok||!v.ok){setNotice("İşlem etkin değil veya reddedildi: "+String(v.code||v.state||"unavailable")+". Otomatik yeniden deneme yapılmaz.");return;}
 if(action==="quote"){if(typeof v.quoteHash!=="string"||!Number.isSafeInteger(v.credits)||v.credits<=0)throw Error();setQuote({hash:v.quoteHash,credits:v.credits,payload});setNotice("Kredi bedeli hesaplandı. Henüz rezervasyon veya üretim yok.");}
 else {setNotice("Kayıtlı durum: "+String(v.state)+". Üretim çıktısı ancak maliyet doğrulaması ve kredi kapanışı sonrasında teslim edilir.");if(v.state==="released")setSubmitted(false);}
 }catch{setNotice("Sunucu bağlantısı doğrulanamadı. Gönderilmiş bir işlemi yeniden başlatmayın; durumunu kontrol edin.");}finally{lock.current=false;setBusy(false);}
 }
 return <details><summary>AI üretim bağlantısı — izole test</summary><p>Bu bölüm yalnızca önceden onaylanmış Website planı veya mevcut görsel projesi ile çalışır. Sunucu anahtarları, doğrulanmış model, maliyet tarifesi ve özel test hesabı tanımlı değilse üretim reddedilir. Ana asistanın bütün kategorileri henüz buraya bağlı değildir.</p><button type="button" disabled={busy} onClick={()=>void load()}>Kendi üretim projelerimi yükle</button><label>Proje<select value={selected} disabled={busy} onChange={e=>change(e.target.value)}><option value="">Proje seç</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title} — {p.category} — {p.state}</option>)}</select></label>{current?.category==="image"&&<><label>Görsel isteği<textarea maxLength={1500} value={prompt} disabled={busy||submitted} onChange={e=>{setPrompt(e.target.value);setQuote(null);}}/></label><label>En-boy oranı<select value={aspect} disabled={busy||submitted} onChange={e=>{setAspect(e.target.value);setQuote(null);}}>{["16:9","1:1","4:3","3:2","2:3","3:4","9:16","21:9"].map(a=><option key={a}>{a}</option>)}</select></label><label>İstek kimliği (önceki işlem kontrolü için saklayın)<input maxLength={36} value={requestId} disabled={busy||submitted} onChange={e=>{setRequestId(e.target.value);setQuote(null);}}/></label><button type="button" disabled={busy||submitted||!!requestId} onClick={()=>{setRequestId(crypto.randomUUID());setQuote(null);}}>Yeni istek kimliği oluştur</button></>}{current&&<><button type="button" disabled={busy||submitted||current.category==="image"&&(!prompt.trim()||!uuid.test(requestId))} onClick={()=>void run("quote")}>Üretim kredisi hesapla</button> <button type="button" disabled={busy||current.category==="image"&&!uuid.test(requestId)} onClick={()=>void run("status")}>Kayıtlı işlemin durumunu kontrol et</button></>}{quote&&<p>{quote.credits} üretim kredisi · <button type="button" disabled={busy||submitted} onClick={()=>void run("submit")}>Onayla ve üret</button> <button type="button" onClick={()=>setQuote(null)}>Vazgeç</button></p>}<p role="status" aria-live="polite">{notice}</p></details>;
}
