"use client";
import {useEffect,useRef,useState} from "react";
import {supabaseBrowser} from "@/lib/supabase";
import {useAuth} from "@/components/auth/AuthProvider";
import type {ModelLocale} from "@/lib/ai-models";
import styles from "./ModelStudio.module.css";
type Asset={id:string;kind:string;mime:string;bytes:number;state:string};
const copy={
 en:{title:"Original media — private test",rights:"I have permission to use these files.",notice:"Up to 3 MB per file. Files stay in quarantine; no rendering or charges.",upload:"Upload original",busy:"Uploading…",failed:"Upload failed. Check the file and try again.",success:"Original saved in quarantine."},
 tr:{title:"Orijinal medya — özel test",rights:"Bu dosyaları kullanma iznim var.",notice:"Dosya başına 3 MB. Dosyalar karantinada kalır; üretim ve ücret yok.",upload:"Orijinali yükle",busy:"Yükleniyor…",failed:"Yükleme başarısız. Dosyayı kontrol et.",success:"Orijinal karantinaya kaydedildi."},
 de:{title:"Originalmedien — privater Test",rights:"Ich darf diese Dateien verwenden.",notice:"Bis 3 MB pro Datei. Quarantäne; keine Generierung oder Kosten.",upload:"Original hochladen",busy:"Upload…",failed:"Upload fehlgeschlagen.",success:"Original in Quarantäne gespeichert."},
 fr:{title:"Médias originaux — test privé",rights:"Je suis autorisé à utiliser ces fichiers.",notice:"3 Mo par fichier. Quarantaine, sans génération ni frais.",upload:"Importer l’original",busy:"Importation…",failed:"Échec de l’importation.",success:"Original placé en quarantaine."},
 zh:{title:"原始媒体 — 私有测试",rights:"我有权使用这些文件。",notice:"每个文件最多 3 MB。文件隔离，不生成或收费。",upload:"上传原件",busy:"上传中…",failed:"上传失败，请检查文件。",success:"原件已保存至隔离区。"}
} as const;
export function OriginalModelMedia({locale}:{locale:ModelLocale}){
 const auth=useAuth(),c=copy[locale],owner=auth.user?.id;
 const [enabled,setEnabled]=useState(false),[assets,setAssets]=useState<Asset[]>([]),[rights,setRights]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const lock=useRef(false),input=useRef<HTMLInputElement>(null),alive=useRef(false);
 async function token(){const {data}=await supabaseBrowser().auth.getSession();return data.session?.user.id===owner?data.session?.access_token:null}
 useEffect(()=>{let cancelled=false;alive.current=true;setEnabled(false);setAssets([]);setRights(false);setMessage("");
 if(owner)void (async()=>{try{const t=await token();if(!t)return;const r=await fetch("/api/models/original-media",{headers:{Authorization:"Bearer "+t},cache:"no-store"}),d=await r.json();if(!cancelled&&r.ok&&d.enabled===true){setAssets(Array.isArray(d.assets)?d.assets:[]);setEnabled(true)}}catch{}})();
 return()=>{cancelled=true;alive.current=false};
 // Owner changes reset the private test panel.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[owner]);
 async function upload(file:File){if(!enabled||!rights||lock.current)return;if(!file.size||file.size>3000000||!["image/jpeg","image/png","image/webp","video/mp4","video/quicktime","audio/mpeg","audio/wav"].includes(file.type)){setMessage(c.failed);return}
 lock.current=true;setBusy(true);setMessage("");
 try{const t=await token();if(!t)throw Error("session");const r=await fetch("/api/models/original-media",{method:"POST",headers:{Authorization:"Bearer "+t,"Content-Type":file.type,"x-model-media-rights":"accepted"},body:file}),d=await r.json();if(!r.ok||!d.asset)throw Error("upload");if(alive.current){setAssets(a=>[d.asset,...a].slice(0,20));setMessage(c.success)}}catch{if(alive.current)setMessage(c.failed)}finally{lock.current=false;if(alive.current)setBusy(false)}}
 if(!enabled)return null;
 return <div className={styles.refArea}><strong>{c.title}</strong><p className={styles.muted}>{c.notice}</p><label className={styles.check}><input type="checkbox" checked={rights} disabled={busy} onChange={e=>setRights(e.target.checked)}/>{c.rights}</label><input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,audio/mpeg,audio/wav" disabled={busy||!rights} onChange={e=>{const f=e.target.files?.[0];e.target.value="";if(f)void upload(f)}}/><button type="button" className="cr-action" disabled={busy||!rights} onClick={()=>input.current?.click()}>{busy?c.busy:c.upload}</button>{message&&<p role="status">{message}</p>}{assets.map(a=><small key={a.id}>{a.mime} · {Math.ceil(a.bytes/1024)} KB · {a.state}</small>)}</div>
}
