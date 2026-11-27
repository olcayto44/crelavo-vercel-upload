"use client";
import {useEffect,useState} from "react";
import {useAuth} from "@/components/auth/AuthProvider";
import Link from "next/link";
const languages=[["en","English"],["tr","Türkçe"],["de","Deutsch"],["es","Español"],["fr","Français"],["ar","العربية"]];
export function CustomerAccountSettings(){
 const {user,signOut}=useAuth();const [language,setLanguage]=useState("en"),[saved,setSaved]=useState(false);
 useEffect(()=>{try{const v=localStorage.getItem("clipora_language");if(v&&languages.some(([id])=>id===v))setLanguage(v);}catch{}},[]);
 function save(){try{localStorage.setItem("clipora_language",language);setSaved(true);}catch{setSaved(false);}}
 return <><section className="card" style={{display:"grid",gap:10}}><h2>Account</h2><p style={{overflowWrap:"anywhere"}}>{user?.email||"Account unavailable"}</p><p>Use the same verified email for Whop purchases. For account email changes, contact support.</p><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button className="btn secondary" onClick={()=>void signOut()}>Sign out</button><Link className="btn secondary" href="/dashboard/contact">Account support</Link></div></section>
 <section className="card" style={{marginTop:16,display:"grid",gap:10}}><h2>Studio language</h2><label>Preferred language<select value={language} onChange={e=>{setLanguage(e.target.value);setSaved(false);}} style={{display:"block",width:"100%",marginTop:6}}>{languages.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><button className="btn" onClick={save}>Save on this device</button>{saved&&<p role="status">Studio preference saved on this browser.</p>}<small>Some account screens are currently English. This does not change your account security settings.</small></section>
 </>;
}
