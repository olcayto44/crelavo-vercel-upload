"use client";
import {useEffect,useRef,useState} from "react";
import styles from "./PremiumHome.module.css";
const DESKTOP="/hero/hero-04-giant-fashion-city-1920x1080.mp4",MOBILE="/hero/hero-04-giant-fashion-city-1080x1920.mp4",POSTER="/hero/hero-04-giant-fashion-city-poster.jpg";
export function HeroReel({source,poster}:{source?:string;poster?:string}={}){
 const video=useRef<HTMLVideoElement>(null),[playing,setPlaying]=useState(false);
 useEffect(()=>{const v=video.current;if(!v)return;const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");const mobile=window.matchMedia("(max-width:767px)");const saveData=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData;const stop=()=>{if(document.hidden||reduced.matches)v.pause();};if(!reduced.matches&&!mobile.matches&&!saveData){v.src=source||DESKTOP;void v.play().catch(()=>{});}document.addEventListener("visibilitychange",stop);reduced.addEventListener("change",stop);return()=>{document.removeEventListener("visibilitychange",stop);reduced.removeEventListener("change",stop);v.pause();};},[source]);
 function toggle(){const v=video.current;if(!v)return;if(!v.paused){v.pause();return;}if(!v.getAttribute("src"))v.src=source||(window.matchMedia("(max-width:767px)").matches?MOBILE:DESKTOP);void v.play().catch(()=>{});}
 return <><video ref={video} muted playsInline loop preload="none" poster={poster||POSTER} aria-label="Crelavo cinematic showcase" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={e=>{const v=e.currentTarget;if(v.getAttribute("src")!==DESKTOP&&v.dataset.fallback!=="1"){v.dataset.fallback="1";v.src=DESKTOP;void v.play().catch(()=>{});}else setPlaying(false);}}/><div className={styles.heroControl}><button type="button" onClick={toggle}>{playing?"Pause reel":"Play reel"}</button></div></>;
}
