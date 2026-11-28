"use client";
import {useEffect,useRef,useState} from "react";
import styles from "./PremiumHome.module.css";
const DESKTOP="/hero/hero-04-giant-fashion-city-1920x1080.mp4",MOBILE="/hero/hero-04-giant-fashion-city-1080x1920.mp4",POSTER="/hero/hero-04-giant-fashion-city-poster.jpg";
function SingleReel({source,mobileSource,poster,onEnd}:{source?:string;mobileSource?:string;poster?:string;onEnd?:()=>void}){
 const video=useRef<HTMLVideoElement>(null),[playing,setPlaying]=useState(false),[failed,setFailed]=useState(false),[fallback,setFallback]=useState(false);
 const selectedPoster=source&&!fallback?poster:POSTER;
 const selectSource=()=>source&&!fallback?(mobileSource&&window.matchMedia("(max-width:767px)").matches?mobileSource:source):window.matchMedia("(max-width:767px)").matches?MOBILE:DESKTOP;
 useEffect(()=>{
  const v=video.current;if(!v)return;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)"),mobile=window.matchMedia("(max-width:767px)");
  const saveData=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData;
  const stop=()=>{if(document.hidden||reduced.matches)v.pause();};
  const chosen=source&&!fallback?(mobile.matches&&mobileSource?mobileSource:source):mobile.matches?MOBILE:DESKTOP;
  if(v.getAttribute("src")!==chosen){v.src=chosen;v.preload=saveData?"none":"metadata";}
  let timer:number|undefined;
  if(!reduced.matches&&!mobile.matches&&!saveData){timer=window.setTimeout(()=>{if(!document.hidden&&!reduced.matches&&v.paused)void v.play().catch(()=>{});},150);}
  document.addEventListener("visibilitychange",stop);reduced.addEventListener("change",stop);
  return()=>{if(timer!==undefined)window.clearTimeout(timer);document.removeEventListener("visibilitychange",stop);reduced.removeEventListener("change",stop);v.pause();};
 },[source,mobileSource,fallback]);
 function toggle(){const v=video.current;if(!v)return;if(!v.paused){v.pause();return;}setFailed(false);if(!v.getAttribute("src")||v.error){v.src=selectSource();v.load();}void v.play().catch(()=>{});}
 return <><video ref={video} muted playsInline loop={!onEnd} onEnded={onEnd} preload="metadata" poster={selectedPoster} aria-label="Crelavo cinematic showcase" onPlay={()=>{setPlaying(true);setFailed(false)}} onPause={()=>setPlaying(false)} onError={()=>{setPlaying(false);if(source&&!fallback)setFallback(true);else setFailed(true)}}/><div className={styles.heroControl}><button type="button" onClick={toggle}>{failed?"Retry reel":playing?"Pause reel":"Play reel"}</button></div></>;
}

type ReelSource={id:string;source:string;mobileSource?:string;poster?:string};
export function HeroReel({source,poster,sources,staticOnly=false}:{source?:string;poster?:string;sources?:ReelSource[];staticOnly?:boolean}={}){const [index,setIndex]=useState(0);if(staticOnly)return <img src={POSTER} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>;const item=sources?.[index%(sources.length||1)];return <SingleReel key={item?.id??"default"} source={item?.source??source} mobileSource={item?.mobileSource} poster={item?.poster??poster} onEnd={sources&&sources.length>1?()=>setIndex(i=>(i+1)%sources.length):undefined}/>}
