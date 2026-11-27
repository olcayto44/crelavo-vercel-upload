"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {HOME_BRIEF_KEY,HOME_BRIEF_MODES,homeBriefDestination} from "@/lib/home-brief";
import styles from "./PremiumHome.module.css";
export function HomeBrief(){
 const [mode,setMode]=useState<string>("video"),[prompt,setPrompt]=useState(""),[error,setError]=useState("");const router=useRouter();
 const selected=HOME_BRIEF_MODES.find(m=>m.id===mode)??HOME_BRIEF_MODES[0];
 return <form className={styles.composer} onSubmit={e=>{e.preventDefault();try{if(prompt.trim())sessionStorage.setItem(HOME_BRIEF_KEY,JSON.stringify({category:selected.id,prompt:prompt.trim(),created:Date.now()}));else sessionStorage.removeItem(HOME_BRIEF_KEY);router.push(homeBriefDestination(selected.id));}catch{setError("This browser could not save the draft. You can still open Studio directly.");}}}>
 <label htmlFor="home-brief">What would you like to create?</label><div className={styles.choices} role="group" aria-label="Production category">{HOME_BRIEF_MODES.map(m=><button type="button" key={m.id} className={styles.choice} aria-pressed={mode===m.id} onClick={()=>{setMode(m.id);setError("");}}>{m.label}</button>)}</div><textarea id="home-brief" value={prompt} onChange={e=>setPrompt(e.target.value)} maxLength={2000} rows={3} placeholder={selected.placeholder}/>
 <div className={styles.composerFoot}><p className={styles.hint}>Your draft stays in this tab. Sign in, review the plan and confirm any paid production separately.</p><button className="cr-action cr-action-primary" type="submit">Open {selected.label} Studio →</button></div>{error&&<p role="alert">{error} <a href={homeBriefDestination(selected.id)}>Open Studio</a></p>}</form>;
}
