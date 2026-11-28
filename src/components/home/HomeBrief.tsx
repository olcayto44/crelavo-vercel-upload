"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {HOME_BRIEF_KEY,HOME_BRIEF_MODES,homeBriefDestination} from "@/lib/home-brief";
import styles from "./PremiumHome.module.css";
export function HomeBrief(){
 const [mode,setMode]=useState<string>("video"),[prompt,setPrompt]=useState(""),[error,setError]=useState(""),[pending,startTransition]=useTransition();const router=useRouter();
 const selected=HOME_BRIEF_MODES.find(m=>m.id===mode)??HOME_BRIEF_MODES[0],destination=homeBriefDestination(selected.id);
 function submit(){if(pending)return;setError("");try{if(prompt.trim())sessionStorage.setItem(HOME_BRIEF_KEY,JSON.stringify({category:selected.id,prompt:prompt.trim(),created:Date.now()}));else sessionStorage.removeItem(HOME_BRIEF_KEY);}catch{setError("This browser could not save the draft. Copy your idea before opening Studio.");return;}startTransition(()=>router.push(destination));}
 return <form className={styles.composer} aria-busy={pending} onSubmit={e=>{e.preventDefault();submit()}}>
 <label htmlFor="home-brief">What would you like to create?</label><div className={styles.choices} role="group" aria-label="Production category">{HOME_BRIEF_MODES.map(m=><button type="button" disabled={pending} key={m.id} className={styles.choice} aria-pressed={mode===m.id} onClick={()=>{setMode(m.id);setError("");}}>{m.label}</button>)}</div><textarea id="home-brief" value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form?.requestSubmit();}}} maxLength={2000} rows={3} placeholder={selected.placeholder} aria-describedby="home-brief-hint" readOnly={pending}/>
 <div className={styles.composerFoot}><p className={styles.hint} id="home-brief-hint">Enter to open Studio · Shift + Enter for a new line. Review your draft before confirming any paid production.</p><button className="cr-action cr-action-primary" type="submit" disabled={pending}>{pending?"Opening Studio…":"Open "+selected.label+" Studio →"}</button></div>{pending&&<p role="status">Opening your selected Studio with your idea…</p>}{error&&<p role="alert">{error} <a href={destination}>Open Studio</a></p>}</form>;
}
