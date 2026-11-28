"use client";
import {useEffect,useRef,useState} from "react";
import {supabaseBrowser} from "@/lib/supabase";
import type {ModelLocale} from "@/lib/ai-models";
import styles from "./ModelStudio.module.css";
type Run={job_id:string;state:string;progress:number;reservation_state:string;test_credits:number;actual_micro_usd:null};
type Props={locale:ModelLocale;prompt:string;duration:number;ratio:string;audio:boolean;mode:number};
const copy={
en:{title:"Private delivery rehearsal",notice:"Synthetic 3-second test pattern, not AI output. Uses 10 test credits only.",start:"Queue test",refresh:"Refresh status",view:"Load test MP4",download:"Download test MP4",fail:"Test operation unavailable",wallet:"Test balance / reserved",cost:"Actual API cost: not incurred",states:["Queued","Running","Ready","Failed","Needs reconciliation"]},
tr:{title:"Özel teslimat testi",notice:"3 saniyelik teknik test videosudur, AI üretimi değildir. Yalnızca 10 test kredisi kullanır.",start:"Testi sıraya al",refresh:"Durumu yenile",view:"Test MP4'ü aç",download:"Test MP4'ü indir",fail:"Test işlemi kullanılamıyor",wallet:"Test bakiyesi / rezervasyon",cost:"Gerçek API gideri: oluşmadı",states:["Sırada","Çalışıyor","Hazır","Başarısız","Mutabakat gerekli"]},
de:{title:"Privater Liefertest",notice:"3 Sekunden Testbild, keine KI-Ausgabe. Nur 10 Test-Credits.",start:"Test einreihen",refresh:"Status aktualisieren",view:"Test-MP4 öffnen",download:"Test-MP4 laden",fail:"Test nicht verfügbar",wallet:"Testguthaben / reserviert",cost:"Keine realen API-Kosten",states:["Wartend","Läuft","Bereit","Fehler","Abgleich nötig"]},
fr:{title:"Test privé de livraison",notice:"Mire de 3 secondes, pas de génération IA. 10 crédits de test uniquement.",start:"Mettre en file",refresh:"Actualiser",view:"Ouvrir le MP4 de test",download:"Télécharger le MP4 de test",fail:"Test indisponible",wallet:"Solde test / réservé",cost:"Aucun coût API réel",states:["En attente","En cours","Prêt","Échec","Rapprochement requis"]},
zh:{title:"私有交付测试",notice:"3 秒测试图案，不是 AI 生成内容。仅使用 10 测试积分。",start:"加入测试队列",refresh:"刷新状态",view:"打开测试 MP4",download:"下载测试 MP4",fail:"测试不可用",wallet:"测试余额 / 预留",cost:"未产生实际 API 费用",states:["排队中","运行中","就绪","失败","需对账"]}
};
export function ModelRehearsalPanel({locale,prompt,duration,ratio,audio,mode}:Props){
 const c=copy[locale], [enabled,setEnabled]=useState(false),[runs,setRuns]=useState<Run[]>([]),[wallet,setWallet]=useState<{balance:number;reserved:number}|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[delivery,setDelivery]=useState<{preview:string;download:string}|null>(null);
 const request=useRef<{fingerprint:string;id:string}|null>(null),alive=useRef(false),lock=useRef(false);
 async function api(path:string,body?:unknown){const {data}=await supabaseBrowser().auth.getSession();if(!data.session)throw Error("session");const r=await fetch(path,{method:body===undefined?"GET":"POST",headers:{Authorization:"Bearer "+data.session.access_token,...(body===undefined?{}:{"Content-Type":"application/json"})},cache:"no-store",...(body===undefined?{}:{body:JSON.stringify(body)})});const d=await r.json();if(!r.ok)throw Error("api");return d}
 async function refresh(){const d=await api("/api/models/rehearsal");if(alive.current){setEnabled(d.enabled===true);setRuns(Array.isArray(d.runs)?d.runs:[]);setWallet(d.wallet??null)}}
 useEffect(()=>{alive.current=true;void refresh().catch(()=>{});return()=>{alive.current=false}},[]);
 async function action(fn:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setMessage("");try{await fn()}catch{if(alive.current)setMessage(c.fail)}finally{lock.current=false;if(alive.current)setBusy(false)}}
 async function start(){const fields={modelId:"magi-2",provider:"higgsfield",mode:"text",prompt:prompt.trim(),duration,ratio,audio,assetIds:[]};const fingerprint=JSON.stringify(fields);
 if(request.current?.fingerprint!==fingerprint)request.current={fingerprint,id:crypto.randomUUID()};
 const d=await api("/api/models/planned-jobs",{...fields,requestKey:request.current.id});
 await api("/api/models/rehearsal",{jobId:d.job.id,acceptSynthetic:true});await refresh();}
 if(!enabled)return null;
 return <div className={styles.refArea}><strong>{c.title}</strong><p className={styles.muted}>{c.notice}</p><small>{c.wallet}: {wallet?wallet.balance+" / "+wallet.reserved:"—"}</small><small>{c.cost}</small><div className={styles.actions}><button type="button" className="cr-action" disabled={busy||mode!==0||!prompt.trim()} onClick={()=>void action(start)}>{c.start}</button><button type="button" className="cr-action" disabled={busy} onClick={()=>void action(refresh)}>{c.refresh}</button></div>
 {message&&<p role="status">{message}</p>}{runs.map(r=><div key={r.job_id}><small>{c.states[["queued","running","ready","failed","reconcile_required"].indexOf(r.state)]??r.state} · {r.progress}% · {r.reservation_state}</small><progress max={100} value={r.progress} style={{width:"100%"}}/>{r.state==="ready"&&<button type="button" className="cr-action" disabled={busy} onClick={()=>void action(async()=>{setDelivery(null);const d=await api("/api/models/rehearsal?delivery="+encodeURIComponent(r.job_id));if(d.synthetic===true&&alive.current)setDelivery({preview:d.preview,download:d.download})})}>{c.view}</button>}</div>)}
 {delivery&&<><video controls preload="metadata" src={delivery.preview} style={{width:"100%",maxHeight:220}}/><a className="cr-action" href={delivery.download} rel="noreferrer">{c.download}</a></>}</div>
}
