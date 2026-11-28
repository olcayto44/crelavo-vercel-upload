"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
export function AdminLiveRefresh(){const router=useRouter(),[enabled,setEnabled]=useState(false);useEffect(()=>{if(!enabled)return;const id=window.setInterval(()=>{if(!document.hidden)router.refresh()},15000);return()=>window.clearInterval(id)},[enabled,router]);return <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}><button className="btn secondary" type="button" onClick={()=>router.refresh()}>Şimdi yenile</button><label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> 15 saniyede bir yenile</label></div>}
