"use client";
import {useEffect,useRef,useState} from "react";
import styles from "./pilot.module.css";
import {PremiumWebsitePilot} from "./PremiumWebsitePilot";
import type {SupabaseClient} from "@supabase/supabase-js";
type Project={id:string;title:string;revision:number|null;production_id:string|null};
type Quote={projectId:string;revision:number;quoteHash:string;brief:Record<string,unknown>;credits:number;packId:string;productionId:string|null};
export function WebsitePlanHandoffPanel({db,onApproved,onWallets}:{db:SupabaseClient;onApproved:(productionId:string)=>void;onWallets:(wallets:unknown)=>void}){
 const [projects,setProjects]=useState<Project[]>([]),[selected,setSelected]=useState(""),[quote,setQuote]=useState<Quote|null>(null),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false);
 const lock=useRef(false);
 const [search,setSearch]=useState("");
 const [loadingProjects,setLoadingProjects]=useState(true);
 useEffect(()=>{void refreshProjects();},[db]);
 async function refreshProjects(){setLoadingProjects(true);try{const s=await db.auth.getSession();if(!s.data.session?.access_token)throw Error();const r=await fetch("/api/studio/conversation",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+s.data.session.access_token},body:JSON.stringify({mode:"real",categoryId:"website",uiLanguage:"tr",action:"projects"})});const v=await r.json();if(!r.ok||!v.ok||!Array.isArray(v.projects))throw Error(String(v.code||"unavailable"));const rows:Project[]=v.projects.map((x:Project)=>({...x,revision:typeof x.revision==="number"?x.revision:null}));setProjects(rows);setSelected(prev=>rows.some(x=>x.id===prev)?prev:rows[0]?.id||"");onWallets(v.wallets);setNotice(rows.length?"Kayıtlı projeler yüklendi.":"İlk Website projenizi oluşturun.");}catch{setNotice("Kayıtlı projeler veya asistan bağlantısı doğrulanamadı. Yenile ile tekrar kontrol edin.");}finally{setLoadingProjects(false);}}
 const [chatProject,setChatProject]=useState<{id:string;title:string;snapshot:{revision:number;fields:Record<string,unknown>};messages:{role:string;content:string}[]}|null>(null),[chatTitle,setChatTitle]=useState(""),[chatMessage,setChatMessage]=useState(""),[chatNotice,setChatNotice]=useState(""),[chatBlocked,setChatBlocked]=useState(false);
 async function chat(action:"create"|"load"|"message"){
 if(lock.current||action==="create"&&(!chatTitle.trim()||chatTitle.length>160)||action==="load"&&!selected||action==="message"&&(!chatProject||!chatMessage.trim()||chatBlocked))return;
 if(action==="message"&&!window.confirm("Bu mesaj gerçek AI isteği gönderir ve asistan test kredisi kullanabilir. Onaylıyor musunuz?"))return;
 lock.current=true;setBusy(true);setChatNotice("");setQuote(null);
 const requestId=action==="message"?crypto.randomUUID():null;
 try{
 const session=await db.auth.getSession();if(session.error||!session.data.session?.access_token)throw Error("sign_in");
 const body={mode:"real",categoryId:"website",uiLanguage:"tr",action,...(action==="create"?{title:chatTitle.trim()}:action==="load"?{projectId:selected}:{projectId:chatProject!.id,requestId,message:chatMessage.trim(),acceptedDefaults:[]})};
 const response=await fetch("/api/studio/conversation",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.data.session.access_token},body:JSON.stringify(body)});
 const value=await response.json();
 if(!response.ok||!value.ok||value.mode!=="real"||!value.project?.id||!value.project?.snapshot||!Array.isArray(value.project.messages)){
 if(action==="message"){setChatBlocked(true);setChatNotice("Mesaj sonucu: "+String(value.code||"unconfirmed")+". İstek: "+requestId+". Otomatik tekrar yok; önce projeyi ve kredi durumunu kontrol edin.");}
 else setChatNotice("Asistan işlemi tamamlanmadı: "+String(value.code||"unavailable"));
 return;}
 setChatProject(value.project);setSelected(value.project.id);
 onWallets(value.wallets);{setProjects(rows=>[{id:value.project.id,title:value.project.title,revision:value.project.snapshot.revision,production_id:value.project.productionId??null},...rows.filter(p=>p.id!==value.project.id)]);}
 if(action==="message"){setChatMessage("");setChatNotice("Gerçek asistan yanıtı kaydedildi. Kullanılan asistan kredisi: "+String(value.chargedCredits??"doğrulanamadı")+".");}
 else setChatNotice("Asistan projesi hazır. Plan için İngilizce tanıtım sitesi brief'ini tamamlayın.");
 }catch{if(action==="message"){setChatBlocked(true);setChatNotice("Mesaj sonucu doğrulanamadı. İstek: "+requestId+". Yeniden göndermeyin; kayıtlı proje ve kredi durumunu inceleyin.");}else setChatNotice("Asistan bağlantısı doğrulanamadı.");}
 finally{lock.current=false;setBusy(false);}
 }
 async function call(action:"list"|"quote"|"approve"){
 if(lock.current||action==="quote"&&!selected||action==="approve"&&!quote)return;
 lock.current=true;setBusy(true);setNotice("");
 try{
 const s=await db.auth.getSession();if(s.error||!s.data.session?.access_token)throw Error();
 const body=action==="list"?{action}:action==="quote"?{action,projectId:selected}:{action,projectId:quote!.projectId,revision:quote!.revision,quoteHash:quote!.quoteHash,confirmPlan:true};
 const r=await fetch("/api/studio/website-plan-handoff-test",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+s.data.session.access_token},body:JSON.stringify(body)}),v=await r.json();
 if(!r.ok||!v.ok){setQuote(null);setNotice("İşlem tamamlanmadı: "+String(v.code||"unavailable"));return;}
 if(action==="list"){setQuote(null);setProjects(Array.isArray(v.projects)?v.projects:[]);setSelected("");setNotice(v.projects?.length?"Kayıtlı asistan projeleri yüklendi.":"Henüz kayıtlı asistan projesi yok.");}
 else if(action==="quote"){setQuote(v);setNotice("Planı inceleyin. Üretim için ayrıca kredi onayı gerekir.");}
 else{setQuote(null);setNotice("Plan onaylandı: "+String(v.productionId)+". Henüz üretim veya ücret yok. Üretim listesini yenileyin.");onApproved(String(v.productionId));}
 }catch{setQuote(null);setNotice("Sonuç doğrulanamadı; kayıtlı projeleri tekrar kontrol edin.");}finally{lock.current=false;setBusy(false);}
 }
 return <div className={styles.workflowColumn}><details className={styles.panel} open={!selected}><summary>Website isteği ve kayıtlı projeler</summary><small className={styles.eyebrow}>01 / BRIEF</small><h2>AI Website asistanı</h2><p>Yeni proje açın, brief oluşturun ve kaydedilen planı aşağıda inceleyin. Her AI mesajı ayrı onay ve asistan kredisi gerektirir.</p><label>Proje adı<input maxLength={160} value={chatTitle} disabled={busy} onChange={e=>setChatTitle(e.target.value)}/></label><button className={styles.primary} disabled={busy||loadingProjects||!chatTitle.trim()} type="button" onClick={()=>void chat("create")}>Yeni proje oluştur</button><label>Kayıtlı projeler<input aria-label="Proje ara" placeholder="Proje adına göre ara" value={search} onChange={e=>setSearch(e.target.value)}/><select value={selected} disabled={busy||loadingProjects} onChange={e=>{setSelected(e.target.value);setQuote(null);}}><option value="">Proje seçin</option>{projects.filter(x=>x.id===selected||x.title.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"))).map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label><div className={styles.actions}><button disabled={busy||loadingProjects||!selected} type="button" onClick={()=>void chat("load")}>Projeyi aç</button><button disabled={busy||loadingProjects} type="button" onClick={()=>void refreshProjects()}>{loadingProjects?"Yükleniyor…":"Projeleri yenile"}</button></div>{chatProject&&<><p>Proje: {chatProject.title} · Brief sürümü: {chatProject.snapshot.revision}</p><div className={styles.chatHistory} aria-label="Asistan konuşması">{chatProject.messages.map((m,i)=><p key={i}><strong>{m.role==="user"?"Siz":"Asistan"}:</strong> {m.content}</p>)}</div></>}{!chatProject&&<div className={styles.empty}><strong>Yeni bir Website projesi ile başlayın.</strong><p>Proje adı yazıp oluşturun veya kayıtlı bir projeyi açın.</p></div>}<label>Website isteğiniz<textarea maxLength={6000} value={chatMessage} disabled={busy||chatBlocked} onChange={e=>setChatMessage(e.target.value)} placeholder="İşletme adı, hedef kitle, İngilizce site dili, sayfalar, tasarım ve özellikleri belirtin."/></label><button className={styles.primary} disabled={busy||chatBlocked||!chatProject||!chatMessage.trim()} type="button" onClick={()=>void chat("message")}>{busy?"İşlem sürüyor…":"AI mesajı gönder"}</button><p role="status">{chatNotice}</p>{chatBlocked&&<p>Belirsiz sonuç nedeniyle bu oturumda yeni AI mesajı gönderme durduruldu. Projeyi yeniden yükleyip sonucu inceleyin.</p>}</details><PremiumWebsitePilot db={db} projectId={selected}/><details className={styles.panel}><summary>Önceki manuel üretim akışı (gelişmiş)</summary><small className={styles.eyebrow}>02 / PLAN VE ONAY</small><h2>Website üretim planı</h2><p>Şu anda İngilizce tanıtım sitesi ve referanssız brief desteklenir. İnceleme ücretsizdir; üretim kredisi için ayrıca onay gerekir.</p><p>Seçili proje: {projects.find(x=>x.id===selected)?.title||"—"}</p><button disabled={busy||!selected} type="button" onClick={()=>void call("quote")}>Üretim planını incele</button>{quote&&<><dl>{Object.entries(quote.brief).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{Array.isArray(v)?v.join(" · "):String(v)}</dd></div>)}</dl><p>{quote.packId} · {quote.credits} üretim kredisi (sonraki ayrı onay) · brief sürümü {quote.revision}</p><button disabled={busy} type="button" onClick={()=>void call("approve")}>Bu planı onayla (ücretsiz)</button></>}<p role="status">{notice}</p></details></div>;
}
