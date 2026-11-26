"use client";
import {useEffect,useRef,useState} from "react";
import {useAuth} from "@/components/auth/AuthProvider";
import {supabaseBrowser} from "@/lib/supabase";
import {WebsiteDesignPilot,normalizeEditableDesign,type EditableDesign} from "../../website-design-test/WebsiteDesignPilot";
const endpoint="/api/studio/website-draft";
function OwnerEditor({owner}:{owner:string}){
 const [state,setState]=useState<{token:string;version:number;design?:EditableDesign}|null>(null),[message,setMessage]=useState("Taslağınız yükleniyor…"),[busy,setBusy]=useState(false),[reload,setReload]=useState(0);
 const alive=useRef(false),saving=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 useEffect(()=>{const controller=new AbortController();setState(null);setMessage("Taslağınız yükleniyor…");
 void(async()=>{try{const {data}=await supabaseBrowser().auth.getSession();const s=data.session;if(!s||s.user.id!==owner)throw Error();
 const r=await fetch(endpoint,{headers:{Authorization:"Bearer "+s.access_token},cache:"no-store",signal:controller.signal});const v=await r.json();if(!r.ok||!v.ok)throw Error();
 if(!controller.signal.aborted){setState({token:s.access_token,version:v.version,design:v.design?normalizeEditableDesign(v.design):undefined});setMessage(v.version?"Kayıtlı sürüm "+v.version:"Henüz kayıtlı taslak yok. Örnek tasarımı değiştirip kaydedebilirsiniz.");}
 }catch{if(!controller.signal.aborted)setMessage("Taslak yüklenemedi. Oturumunuzu kontrol edin veya yeniden deneyin.");}})();return()=>controller.abort();},[owner,reload]);
 useEffect(()=>{const {data:{subscription}}=supabaseBrowser().auth.onAuthStateChange((_event,session)=>{if(session?.user.id===owner)setState(v=>v?{...v,token:session.access_token}:v);else setState(null);});return()=>subscription.unsubscribe();},[owner]);
 async function save(design:EditableDesign){if(!state||saving.current)return;saving.current=true;setBusy(true);try{const {data}=await supabaseBrowser().auth.getSession();if(data.session?.user.id!==owner)throw Error();
 const r=await fetch(endpoint,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer "+data.session.access_token},body:JSON.stringify({version:state.version,design})});const v=await r.json();
 if(!alive.current)return;if(r.status===409){setMessage("Başka bir sekmede yeni sürüm kaydedildi. Mevcut değişikliklerinizi kaybetmemek için önce not edin, ardından kayıtlı sürümü açın.");return;}
 if(!r.ok||!v.ok)throw Error();setState(s=>s?{...s,version:v.version}:s);setMessage("Taslak kaydedildi · sürüm "+v.version);
 }catch{if(alive.current)setMessage("Kaydedilemedi. Taslak editörde duruyor; yeniden deneyebilirsiniz.");}finally{saving.current=false;if(alive.current)setBusy(false);}}
 return <div><p role="status">{message}</p><button type="button" disabled={busy} onClick={()=>{if(!state||window.confirm("Kaydedilmemiş düzenlemeler kaybolabilir. Kayıtlı taslağı açmak ister misiniz?"))setReload(n=>n+1);}}>Kayıtlı taslağı aç</button>{state&&<WebsiteDesignPilot key={reload} initialDesign={state.design} customerMode onSave={save} saveBusy={busy} saveMessage={message} previewEndpoint={endpoint} accessToken={state.token} allowSourceDownload={false}/>}</div>;
}
export default function WebsiteDraftWorkspace(){const {user,loading}=useAuth();if(loading)return <p>Oturum kontrol ediliyor…</p>;if(!user?.id)return <p>Taslak oluşturmak için giriş yapın.</p>;return <OwnerEditor key={user.id} owner={user.id}/>;}
