"use client";
import {useEffect,useRef,useState} from "react";
import {supabaseBrowser} from "@/lib/supabase";
type Category="image"|"brand_kit"|"visual_clone"|"virtual_model_studio";
const categories:Record<Category,string>={image:"Image / Banner / Poster",brand_kit:"Brand Kit — görsel konsept",visual_clone:"Visual Clone — karakter referansı",virtual_model_studio:"Virtual Model Studio — fotoğraf"};
const scopes:Record<Category,string>={image:"Metinden görsel ve izinli karakter referansından varyasyon.",brand_kit:"Raster logo ve görsel kimlik konseptleri; vektör logo ve tam marka kılavuzu dahil değildir.",visual_clone:"İzinli karakter görseliyle yeni poz ve ortam varyasyonları. Tam kimlik eşleşmesi garanti edilmez.",virtual_model_studio:"Kurgusal yetişkin sanal model fotoğraf varyasyonları. İlk üretilen görsel referans alınır."};
type JobList={id:string;title:string;category:string;state:string;total_credits:number;spent_credits:number;auto_resume:boolean};
type Job={id:string;title:string;category:string;state:string;totalCredits:number;spentCredits:number;autoResume:boolean;enabled:boolean;stale:boolean;steps:{ordinal:number;state:string;credits:number;error_code?:string}[];notice:{available:number;nextCost:number;remaining:number;shortfall:number;projectShortfall:number;level:"low"|"paused"|"none";topUpUrl:string}};
type Draft={jobId:string;category:Category;title:string;brief:string;aspect:string;count:number;autoResume:boolean;referenceJpeg?:string;referenceConsent?:true};
type Quote={planHash:string;totalCredits:number;stepCredits:number;stepCount:number;scope:string;draft:Draft};
const statuses:Record<string,string>={queued:"Sırada",running:"Üretimde",paused_credits:"Kredi bekliyor",ready:"Teslime hazır",reconcile_required:"İşlem kontrolü gerekiyor",cancelled:"İptal",pending:"Bekliyor",claimed:"İşleniyor"};
const label=(s:string)=>statuses[s]??s;
const endpoint="/api/studio/stage-jobs";
const validCategory=(v:string|null):v is Category=>!!v&&Object.prototype.hasOwnProperty.call(categories,v);
export default function StageProductionWorkspace(){
 const [token,setToken]=useState(""),[enabled,setEnabled]=useState(false),[category,setCategory]=useState<Category>("image"),[title,setTitle]=useState(""),[brief,setBrief]=useState(""),[aspect,setAspect]=useState("1:1"),[count,setCount]=useState(2),[autoResume,setAutoResume]=useState(true),[reference,setReference]=useState(""),[consent,setConsent]=useState(false),[jobs,setJobs]=useState<JobList[]>([]),[job,setJob]=useState<Job|null>(null),[quote,setQuote]=useState<Quote|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("Oturum doğrulanıyor…"),[dismissed,setDismissed]=useState("");
 const working=useRef(false),active=useRef(""),owner=useRef(""),tokenRef=useRef("");
 useEffect(()=>{const c=new URLSearchParams(window.location.search).get("category");if(validCategory(c))setCategory(c);
  const sb=supabaseBrowser();let alive=true;
  const setSession=(session:any)=>{if(!alive)return;const uid=String(session?.user?.id??"");if(owner.current!==uid){owner.current=uid;active.current="";setJobs([]);setJob(null);setQuote(null);setBrief("");setReference("");setConsent(false);}
   const next=String(session?.access_token??"");tokenRef.current=next;setToken(next);
   if(!next){setMessage("Üretim projelerinizi görmek için giriş yapın.");return;}
   try{const key="crelavo-stage-draft:"+uid+":"+c;const draft=sessionStorage.getItem(key);if(draft&&validCategory(c)){setBrief(draft.slice(0,1000));sessionStorage.removeItem(key);}}catch{}
  };
  sb.auth.getSession().then(({data})=>setSession(data.session)).catch(()=>setMessage("Oturum yüklenemedi."));
  const {data}=sb.auth.onAuthStateChange((_event,session)=>setSession(session));
  return()=>{alive=false;data.subscription.unsubscribe();};
 },[]);
 const request=async(path:string,body?:unknown)=>{
  const t=tokenRef.current;if(!t)throw Error("Giriş gerekli");
  const r=await fetch(path,{method:body?"POST":"GET",headers:{Authorization:"Bearer "+t,...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,cache:"no-store"});
  const data=await r.json();if(t!==tokenRef.current)throw Error("Oturum değişti");if(!r.ok||!data.ok)throw Error(data.code??"İşlem doğrulanamadı");return data;
 };
 async function refreshList(){const d=await request(endpoint);setEnabled(Boolean(d.enabled));setJobs(d.jobs??[]);return d.jobs as JobList[];}
 async function openJob(id:string){active.current=id;setDismissed("");const d=await request(endpoint+"?jobId="+encodeURIComponent(id));if(active.current===id)setJob(d.job);}
 async function advance(id:string){if(working.current)return;working.current=true;setBusy(true);try{const d=await request(endpoint,{action:"resume",jobId:id});if(active.current===id)setJob(d.job);await refreshList();setMessage("Üretim durumu güncellendi.");}catch(e){setMessage(e instanceof Error?e.message:"İşlem doğrulanamadı. Kayıtlı projeleri kontrol edin.");}finally{working.current=false;setBusy(false);}}
 useEffect(()=>{if(!token)return;let stop=false;async function tick(){if(stop||working.current)return;try{
   const list=await refreshList();if(stop)return;const id=active.current||new URLSearchParams(window.location.search).get("jobId")||list.find(j=>["queued","running","paused_credits"].includes(j.state))?.id;
   if(id){active.current=id;const d=await request(endpoint+"?jobId="+encodeURIComponent(id));if(stop||active.current!==id)return;const j=d.job as Job;setJob(j);
    if(j.enabled&&j.autoResume&&["queued","paused_credits"].includes(j.state)&&j.notice.nextCost>0&&j.notice.available>=j.notice.nextCost)void advance(id);}
   setMessage(prev=>prev==="Oturum doğrulanıyor…"?"Projeler yüklendi.":prev);
 }catch(e){if(!stop)setMessage(e instanceof Error?e.message:"Proje servisi kullanılamıyor.");}}
 void tick();const timer=window.setInterval(tick,10000);return()=>{stop=true;clearInterval(timer);};
 },[token]);
 useEffect(()=>{setQuote(null)},[category,title,brief,aspect,count,autoResume,reference,consent]);
 async function importReference(file:File|null){
  if(!file)return;if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>5000000){setMessage("En fazla 5 MB PNG, JPG veya WebP seçin.");return;}
  try{const img=await createImageBitmap(file);try{
    const scale=Math.min(1,480/Math.max(img.width,img.height)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext("2d");if(!ctx)throw Error("canvas");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    let value=canvas.toDataURL("image/jpeg",.55).split(",")[1];if(value.length>40000)value=canvas.toDataURL("image/jpeg",.35).split(",")[1];if(value.length>40000)throw Error("size");setReference(value);setConsent(false);setMessage("Referans hazır. Kullanım iznini onaylayın.");
  }finally{img.close()}}catch{setMessage("Referans işlenemedi. Daha küçük bir görsel seçin.");}
 }
 async function prepare(){if(working.current)return;working.current=true;setBusy(true);try{
  const draft:Draft={jobId:crypto.randomUUID(),category,title:title.trim(),brief:brief.trim(),aspect,count,autoResume,...(reference?{referenceJpeg:reference,referenceConsent:true as const}:{})};
  const d=await request(endpoint,{action:"quote",draft});setQuote({...d,draft});setMessage("Üretim planı hazır. Toplam kredi ve adım başına ücret onayınızı bekliyor.");
 }catch(e){setMessage(e instanceof Error?e.message:"Teklif alınamadı");}finally{working.current=false;setBusy(false);}}
 async function start(){if(!quote||working.current)return;working.current=true;setBusy(true);try{
  active.current=quote.draft.jobId;const d=await request(endpoint,{action:"create",draft:quote.draft,planHash:quote.planHash,approvedCredits:quote.totalCredits,confirmProduction:true});setJob(d.job);setQuote(null);await refreshList();setMessage("Proje kaydedildi.");
 }catch(e){setMessage(e instanceof Error?e.message:"İşlem doğrulanamadı. Yeniden üretim yerine projeyi kontrol edin.");}finally{working.current=false;setBusy(false);}}
 async function download(id:string,n:number){try{const r=await fetch(endpoint+"?jobId="+encodeURIComponent(id)+"&download="+n,{headers:{Authorization:"Bearer "+tokenRef.current},cache:"no-store"});if(!r.ok)throw Error("Dosya hazır değil");const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="crelavo-"+id+"-"+n+".webp";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}catch(e){setMessage(e instanceof Error?e.message:"İndirme başarısız");}}
 const notice=job?.notice,warningKey=job?job.id+":"+job.state+":"+notice?.level:"",showWarning=Boolean(job&&notice&&notice.level!=="none"&&dismissed!==warningKey);
 const canQuote=enabled&&!busy&&title.trim()&&brief.trim().length>=3&&(!reference||consent)&&(category!=="visual_clone"||reference);
 const editHref=(n:number)=>"/dashboard/studio-image-editor?studioCategory="+encodeURIComponent(job?.category??"image")+"&stageJob="+encodeURIComponent(job?.id??"")+"&stageStep="+n;
 return <main style={{maxWidth:1180,margin:"0 auto",padding:20,color:"var(--text)"}}>
  <nav style={{display:"flex",gap:12,flexWrap:"wrap"}}><a href="/dashboard">Dashboard</a><a href={"/dashboard/studio/"+category.replaceAll("_","-")}>Studio</a><a href="/dashboard/productions">Diğer üretimler</a></nav>
  <h1>Aşamalı üretim merkezi</h1><p>Her aşama ayrı kaydedilir. Yetersiz kredide proje korunur; aynı aşama tekrar ücretlendirilmez.</p>
  <p role="status" aria-live="polite">{message}</p>
  {!enabled&&<p role="status" style={{padding:12,border:"1px solid #b99b60",borderRadius:10}}>Yeni üretim henüz bu hesapta etkin değil. Mevcut kayıtlar görüntülenebilir; kredi harcanmaz.</p>}
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,340px),1fr))",gap:16}}>
   <section className="card" style={{display:"grid",gap:10,padding:16}}>
    <h2>Yeni görsel projesi</h2><label>Kategori<select value={category} onChange={e=>setCategory(e.target.value as Category)}>{Object.entries(categories).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><p>{scopes[category]}</p>
    <label>Proje adı<input maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Üretim talebi<textarea rows={6} maxLength={1000} value={brief} onChange={e=>setBrief(e.target.value)}/></label>
    <label>Format<select value={aspect} onChange={e=>setAspect(e.target.value)}>{["1:1","16:9","9:16","4:3","3:2","2:3","3:4","21:9"].map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Üretilecek görsel sayısı<select value={count} onChange={e=>setCount(Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></label>
    <label>Karakter referansı {category==="visual_clone"?"(zorunlu)":"(isteğe bağlı)"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void importReference(e.target.files?.[0]??null)}/></label>
    {reference&&<><img alt="Referans önizlemesi" src={"data:image/jpeg;base64,"+reference} style={{maxWidth:140,maxHeight:160}}/><button type="button" onClick={()=>{setReference("");setConsent(false);}}>Referansı kaldır</button><label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Bu karakter görselini kullanma ve üretim sağlayıcısına gönderme iznim var.</label></>}
    <label><input type="checkbox" checked={autoResume} onChange={e=>setAutoResume(e.target.checked)}/> Kredi yenilendiğinde onaylanan kalan aşamalara otomatik devam et.</label>
    <button className="btn" type="button" disabled={!canQuote} onClick={prepare}>Üretim planını ve krediyi hesapla</button>
    {quote&&<div style={{border:"1px solid #777",borderRadius:10,padding:12}}><h3>Üretim onayı</h3><p>{quote.scope}</p><p>{quote.stepCount} aşama × {quote.stepCredits} kredi = <strong>{quote.totalCredits} kredi</strong></p><p>Yalnızca doğrulanan ve tamamlanan aşamalar ücretlendirilir. Kredi biterse duraklar.</p><button disabled={busy} className="btn" onClick={start}>Onayla ve üretime başla</button><button onClick={()=>setQuote(null)}>Vazgeç</button></div>}
   </section>
   <section className="card" style={{padding:16,display:"grid",gap:10,alignContent:"start"}}><h2>Üretimlerim</h2><button disabled={!token||busy} onClick={()=>void refreshList().catch(e=>setMessage(String(e)))}>Listeyi yenile</button>
    {jobs.length===0&&<p>Henüz kayıtlı aşamalı üretim yok.</p>}{jobs.map(j=><button key={j.id} className="btn secondary" style={{justifyContent:"space-between",textAlign:"left"}} onClick={()=>void openJob(j.id).catch(e=>setMessage(String(e)))}>{j.title} · {label(j.state)} · {j.spent_credits}/{j.total_credits} kredi</button>)}
    {job&&<div style={{border:"1px solid #777",borderRadius:10,padding:12,display:"grid",gap:10}}><h3>{job.title}</h3><strong>{label(job.state)}</strong><progress value={job.steps.filter(s=>s.state==="ready").length} max={job.steps.length||1} style={{width:"100%"}}/><p>{job.steps.filter(s=>s.state==="ready").length}/{job.steps.length} aşama · {job.spentCredits}/{job.totalCredits} kredi</p>
     <p>Kullanılabilir: {job.notice.available} · Sonraki aşama: {job.notice.nextCost} · Kalan tahmini: {job.notice.remaining}</p>
     {job.stale||job.state==="reconcile_required"?<p role="alert">Son işlem kontrol gerektiriyor. Aynı sağlayıcı çağrısı otomatik tekrarlanmayacak.</p>:null}
     {job.state==="paused_credits"&&<p>Proje kaydedildi. Eksik kredi: {job.notice.shortfall}. <a href="/dashboard/payment">Kredi yükle</a></p>}
     {["queued","paused_credits"].includes(job.state)&&<button className="btn" disabled={!job.enabled||busy||job.notice.available<job.notice.nextCost} onClick={()=>advance(job.id)}>Kaldığı yerden devam et</button>}
     {job.steps.map(s=><div key={s.ordinal} style={{padding:8,border:"1px solid #555",borderRadius:8}}>Aşama {s.ordinal+1}: {label(s.state)} · {s.credits} kredi {s.state==="ready"&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>download(job.id,s.ordinal)}>WebP indir</button><a href={editHref(s.ordinal)}>Görsel editöründe aç</a></div>}</div>)}
    </div>}
   </section>
  </div>
  {showWarning&&job&&notice&&<div role="presentation" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:10000,display:"grid",placeItems:"center",padding:16}} onKeyDown={e=>{if(e.key==="Escape")setDismissed(warningKey)}}><section role="alertdialog" aria-modal="true" aria-labelledby="credit-notice-title" style={{maxWidth:460,width:"100%",background:"#171424",color:"#fff",border:"1px solid #b99b60",padding:22,borderRadius:16,display:"grid",gap:12}}>
    <h2 id="credit-notice-title">{notice.level==="paused"?"Üretim kredi bekliyor":"Üretim krediniz azalıyor"}</h2><progress value={job.steps.filter(s=>s.state==="ready").length} max={job.steps.length||1}/><p>Mevcut bakiye: <strong>{notice.available}</strong> kredi<br/>Sonraki aşama: {notice.nextCost} kredi<br/>Projeyi tamamlamak için kalan: {notice.remaining} kredi<br/>Eksik kredi: {notice.projectShortfall}</p><p>Tamamlanan çalışmalar kaydedildi. Yeni kredi yüklemesi sonrası aynı projeden devam edebilirsiniz.</p><a className="btn" href="/dashboard/payment" target="_blank" rel="noopener noreferrer">Kredi yükle</a><button autoFocus onClick={()=>setDismissed(warningKey)}>Şimdilik kapat</button>
  </section></div>}
 </main>;
}
