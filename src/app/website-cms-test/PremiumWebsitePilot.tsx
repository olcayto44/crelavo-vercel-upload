"use client";
import {useState,useRef,useEffect} from "react";
import type {SupabaseClient} from "@supabase/supabase-js";
import styles from "./pilot.module.css";
type Quote={quoteHash:string;credits:number;images:number;maximumMicroUSD:number;brief:{brand:string;pages:string[]}};
export function PremiumWebsitePilot({db,projectId}:{db:SupabaseClient;projectId:string}){
 const [status,setStatus]=useState<{enabled:boolean;state:string;completedImages:number}|null>(null),[quote,setQuote]=useState<Quote|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[pages,setPages]=useState<{path:string;title:string;html:string}[]>([]),[page,setPage]=useState("");
 const lock=useRef(false);
 useEffect(()=>{setQuote(null);},[projectId]);
 useEffect(()=>{void call("status");},[db]);
 async function call(action:"status"|"quote"|"submit"|"preview"|"zip"){
 if(lock.current||action==="quote"&&!projectId||action==="submit"&&!quote)return;
 lock.current=true;setBusy(true);setMessage("");
 try{
 const s=await db.auth.getSession();if(!s.data.session?.access_token)throw Error();
 const body=action==="quote"?{action,projectId}:action==="submit"?{action,projectId,quoteHash:quote!.quoteHash,approvedCredits:quote!.credits,confirmProduction:true}:{action};
 if(action==="submit")setQuote(null);
 const r=await fetch("/api/studio/website-premium-production-test",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+s.data.session.access_token},body:JSON.stringify(body)});
 if(action==="zip"&&r.ok&&r.headers.get("content-type")?.includes("application/zip")){const url=URL.createObjectURL(await r.blob()),a=document.createElement("a");a.href=url;a.download="crelavo-premium-website-pilot.zip";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
 const v=await r.json();
 if(!r.ok||!v.ok){setMessage("İşlem doğrulanamadı: "+String(v.code||v.state||"unavailable")+". Tekrar üretim başlatmayın; durumu kontrol edin.");return;}
 if(action==="status")setStatus(v);
 if(action==="quote")setQuote(v);
 if(action==="submit"){setStatus({enabled:true,state:"ready",completedImages:0});setMessage("Üretim kaydedildi ve test kredisi kapatıldı. Önizleyebilir veya ZIP indirebilirsiniz.");}
 if(action==="preview"){setPages(v.pages);setPage(v.pages[0]?.path??"");}
 }catch{setMessage("Bağlantı sonucu doğrulanamadı. Durumu kontrol edin.");}finally{lock.current=false;setBusy(false);}
 }
 return <section className={styles.panel}><h2>Premium Website · tek onaylı test</h2><p>Seçili asistan projesinden yeni bir bağımsız site: sayfalar, AI görselleri ve yönetim paneli. Eski siteniz değişmez. Tek gerçek test hakkı.</p><div className={styles.actions}><button type="button" disabled={busy||!projectId||!status?.enabled||status.state!=="not_started"} onClick={()=>void call("quote")}>Üretim kapsamını ve krediyi göster</button><button type="button" disabled={busy} onClick={()=>void call("status")}>Durumu kontrol et</button></div>{status&&<p>{status.enabled?"Test üretimi etkin":"Test üretimi henüz etkin değil"} · {status.state} · {status.completedImages} doğrulanmış görsel</p>}{quote&&<><p><strong>{quote.brief.brand}</strong> · {quote.brief.pages.join(" / ")} · {quote.images} AI görseli · {quote.credits} test kredisi</p><p>Tek seferlik gerçek sağlayıcı çağrıları; en fazla {quote.maximumMicroUSD/1000000} USD tahmini üst sınır. Otomatik tekrar yok.</p><button type="button" className={styles.primary} disabled={busy} onClick={()=>void call("submit")}>{quote.credits} test kredisi ile onayla ve oluştur</button></>}{status?.state==="ready"&&<div className={styles.actions}><button type="button" disabled={busy} onClick={()=>void call("preview")}>Tüm sayfaları önizle</button><button type="button" disabled={busy} onClick={()=>void call("zip")}>Bağımsız ZIP indir</button></div>}<p role="status">{busy?"İşlem sürüyor…":message}</p>{pages.length>0&&<><div className={styles.actions}>{pages.map(p=><button key={p.path} type="button" aria-pressed={page===p.path} onClick={()=>setPage(p.path)}>{p.title}</button>)}</div><div className={styles.previewViewport}><iframe title="Premium Website önizleme" sandbox="" srcDoc={pages.find(p=>p.path===page)?.html??""} style={{width:"100%",height:"780px",border:0}}/></div></>}</section>;
}
