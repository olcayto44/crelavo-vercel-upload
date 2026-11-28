"use client";
import {useEffect,useRef,useState} from "react";
import styles from "./PremiumHome.module.css";
const DESKTOP="/hero/hero-04-giant-fashion-city-1920x1080.mp4",MOBILE="/hero/hero-04-giant-fashion-city-1080x1920.mp4",POSTER="/hero/hero-04-giant-fashion-city-poster.jpg";
export function HeroReel({source,poster}:{source?:string;poster?:string}={}){
 const video=useRef<HTMLVideoElement>(null),[playing,setPlaying]=useState(false),[failed,setFailed]=useState(false);
 const selectedPoster=source?poster:POSTER;
 useEffect(()=>{
  const v=video.current;if(!v)return;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)"),mobile=window.matchMedia("(max-width:767px)");
  const saveData=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData;
  const stop=()=>{if(document.hidden||reduced.matches)v.pause();};
  let timer:number|undefined;
  if(!reduced.matches&&!mobile.matches&&!saveData){timer=window.setTimeout(()=>{if(!document.hidden&&!reduced.matches){v.src=source||DESKTOP;void v.play().catch(()=>{});}},150);}
  document.addEventListener("visibilitychange",stop);reduced.addEventListener("change",stop);
  return()=>{if(timer!==undefined)window.clearTimeout(timer);document.removeEventListener("visibilitychange",stop);reduced.removeEventListener("change",stop);v.pause();};
 },[source]);
 function toggle(){const v=video.current;if(!v)return;if(!v.paused){v.pause();return;}setFailed(false);if(!v.getAttribute("src")||v.error){v.src=source||(window.matchMedia("(max-width:767px)").matches?MOBILE:DESKTOP);}void v.play().catch(()=>{});}
 return <><video ref={video} muted playsInline loop preload="none" poster={selectedPoster} aria-label="Crelavo cinematic showcase" onPlay={()=>{setPlaying(true);setFailed(false)}} onPause={()=>setPlaying(false)} onError={()=>{setPlaying(false);setFailed(true)}}/><div className={styles.heroControl}><button type="button" onClick={toggle}>{failed?"Retry reel":playing?"Pause reel":"Play reel"}</button></div></>;
}
