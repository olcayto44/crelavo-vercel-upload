"use client";
import {useEffect,useState} from "react";
type Draft={model_id:string;name:string;developer:string;family:"video"|"image"|"audio";provider:"higgsfield"|"kie"|"unassigned";proposed_credits:number|null;pricing_unit:"second"|"output";proposed_micro_usd:number|null;revision:number};
const initial:Draft={model_id:"",name:"",developer:"",family:"video",provider:"unassigned",proposed_credits:null,pricing_unit:"second",proposed_micro_usd:null,revision:0};
export function ModelCatalogEditor(){
 const [enabled,setEnabled]=useState(false),[rows,setRows]=useState<Draft[]>([]),[draft,setDraft]=useState<Draft>(initial),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function refresh(){const r=await fetch("/api/admin/model-catalog-drafts",{cache:"no-store"}),d=await r.json();if(!r.ok)throw Error("unavailable");setEnabled(d.enabled===true);setRows(d.models??[])}
 useEffect(()=>{void refresh().catch(()=>{})},[]);
 async function save(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setMessage("");try{const r=await fetch("/api/admin/model-catalog-drafts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(draft)}),d=await r.json();if(!r.ok)throw Error(d.error);setDraft(initial);await refresh();setMessage("Taslak kaydedildi. Üretim kapalı.")}catch(e){setMessage(e instanceof Error&&e.message==="REVISION_CONFLICT"?"Sürüm çakışması. Listeyi yenileyin.":"Taslak kaydedilemedi.")}finally{setBusy(false)}}
 const patch=(v:Partial<Draft>)=>setDraft(d=>({...d,...v}));
 if(!enabled)return <section className="card admin-wide-card"><h2>Model ve tarife taslakları</h2><p>Özel test düzenleme pilotu etkin değil.</p></section>;
 return <section className="card admin-wide-card"><h2>Model ve tarife taslakları</h2><p>Buradaki kayıtlar yayınlanmaz, API çağırmaz ve müşteri kredisi kesmez. Fiyatlar onaylanmamış önerilerdir.</p><form onSubmit={save} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
 <label>Model kimliği<input required pattern="[a-z0-9][a-z0-9-]{0,79}" maxLength={80} value={draft.model_id} disabled={draft.revision>0} onChange={e=>patch({model_id:e.target.value})}/></label>
 <label>Model adı<input required maxLength={100} value={draft.name} onChange={e=>patch({name:e.target.value})}/></label>
 <label>Geliştirici<input required maxLength={100} value={draft.developer} onChange={e=>patch({developer:e.target.value})}/></label>
 <label>Tür<select value={draft.family} onChange={e=>patch({family:e.target.value as Draft["family"]})}><option value="video">Video</option><option value="image">Görsel</option><option value="audio">Ses</option></select></label>
 <label>Sağlayıcı<select value={draft.provider} onChange={e=>patch({provider:e.target.value as Draft["provider"]})}><option value="unassigned">Atanmadı</option><option value="higgsfield">Higgsfield</option><option value="kie">Kie.ai</option></select></label>
 <label>Önerilen kredi<input type="number" min={1} max={100000} value={draft.proposed_credits??""} onChange={e=>patch({proposed_credits:e.target.value===""?null:Number(e.target.value)})}/></label>
 <label>Fiyat birimi<select value={draft.pricing_unit} onChange={e=>patch({pricing_unit:e.target.value as Draft["pricing_unit"]})}><option value="second">Saniye</option><option value="output">Çıktı</option></select></label>
 <label>Önerilen gider (mikro USD)<input type="number" min={0} max={100000000} value={draft.proposed_micro_usd??""} onChange={e=>patch({proposed_micro_usd:e.target.value===""?null:Number(e.target.value)})}/></label>
 <div><button className="btn" disabled={busy} type="submit">{busy?"Kaydediliyor…":draft.revision?"Taslağı güncelle":"Taslak ekle"}</button><button className="btn secondary" type="button" onClick={()=>setDraft(initial)}>Yeni</button></div></form>
 <p role="status">{message}</p><div className="admin-table-wrap"><table className="table"><thead><tr><th>Model</th><th>Sağlayıcı</th><th>Kredi önerisi</th><th>Sürüm</th><th>İşlem</th></tr></thead><tbody>{rows.map(r=><tr key={r.model_id}><td>{r.name}</td><td>{r.provider}</td><td>{r.proposed_credits??"—"} / {r.pricing_unit}</td><td>{r.revision}</td><td><button type="button" className="btn secondary" onClick={()=>setDraft({model_id:r.model_id,name:r.name,developer:r.developer,family:r.family,provider:r.provider,proposed_credits:r.proposed_credits,pricing_unit:r.pricing_unit,proposed_micro_usd:r.proposed_micro_usd,revision:r.revision})}>Düzenle</button></td></tr>)}</tbody></table></div></section>
}
