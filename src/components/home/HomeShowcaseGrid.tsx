"use client";
import {useEffect,useRef,useState} from "react";
import {Play,Film} from "lucide-react";
import styles from "./PremiumHome.module.css";
type ShowcaseFilm={href:string;kicker:string;title:string;poster?:string;video:string;landscape:boolean};
const featuredIds=["crelavo-dog-dental-care","crelavo-emerald-satin-dress","crelavo-giant-fashion-city","crelavo-coastal-bag-escape","crelavo-dog-sweater-fashion","crelavo-luxury-skincare-gift-box-unboxing","elegant-woman-green-dress-luxury-perfume","crelavo-holiday-skincare-set","crelavo-premium-skincare-gift-box-set","crelavo-summer-face-mist","luxury-leopard-faux-fur-bag-gold-chain","cozy-couples-conversation-card-game","luxury-black-leather-duffle-bag-nova-form","crelavo-sunset-soda-spot","crelavo-lip-balm-glow","wireless-earbuds-modern-neon-studio"];
const FEATURED_COUNT=16;
function rank(film:ShowcaseFilm){const index=featuredIds.indexOf(film.href.split("/").pop()??"");return /\b(cat|kitten|feline)\b/i.test(film.title+" "+film.kicker)?0.5:index>=0?index:film.video.startsWith("/showcase/uploads/")?100:film.poster?200:300;}
function FilmCard({film}:{film:ShowcaseFilm}){
 const root=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement>(null);
 const [near,setNear]=useState(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[posterFailed,setPosterFailed]=useState(false),[activated,setActivated]=useState(false);
 useEffect(()=>{const node=root.current;if(!node)return;if(!("IntersectionObserver" in window)){setNear(true);return;}const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setNear(true);io.disconnect()}},{rootMargin:"160px"});io.observe(node);return()=>io.disconnect()},[]);
 useEffect(()=>{const pause=(event:Event)=>{if((event as CustomEvent).detail!==film.href)video.current?.pause()};window.addEventListener("crelavo-showcase-play",pause);return()=>window.removeEventListener("crelavo-showcase-play",pause)},[film.href]);
 function play(){const v=video.current;if(!v)return;window.dispatchEvent(new CustomEvent("crelavo-showcase-play",{detail:film.href}));setActivated(true);if(v.error){setFailed(false);v.load()}void v.play().catch(()=>{});}
 return <article className={styles.film}><div ref={root} className={styles.filmMedia} data-orientation={film.landscape?"landscape":"portrait"} data-playing={activated}>
 <div className={styles.filmFallback}><Film aria-hidden="true" size={26}/><strong>{film.title}</strong><span>{failed?"Preview unavailable · watch example":"Video example"}</span></div>
 {film.poster&&!posterFailed&&<img src={film.poster} alt={film.title+" preview"} loading="lazy" decoding="async" width={320} height={400} onError={()=>setPosterFailed(true)}/>}
 {near&&<video ref={video} src={film.video+"#t=0.1"} playsInline preload={film.poster&&!posterFailed?"metadata":"auto"} controls={activated} aria-label={film.title} style={{opacity:ready||activated?1:0}} onLoadedData={()=>{setReady(true);setFailed(false)}} onError={()=>{setFailed(true);setReady(false)}}/>}
 {near&&!failed&&!activated&&<button className={styles.filmPlay} aria-label={"Play "+film.title} type="button" onClick={play}><Play aria-hidden="true"/></button>}
 {failed&&<span className={styles.filmUnavailable}>Video preview unavailable</span>}</div>
 <div className={styles.filmText}><small>{film.kicker}</small><h3>{film.title}</h3><a href={film.href} aria-label={"Watch "+film.title}>Open full example →</a></div></article>;
}
export function HomeShowcaseGrid({films}:{films:ShowcaseFilm[]}){
 const preferred=[...films].sort((a,b)=>rank(a)-rank(b));
 const featured=preferred.slice(0,FEATURED_COUNT),remaining=preferred.slice(FEATURED_COUNT);
 return <><div className={styles.showcase} data-home-featured>{featured.map(film=><FilmCard key={film.href} film={film}/>)}</div>{remaining.length>0&&<details className={styles.moreFilms}><summary>See all {films.length} published examples</summary><div className={styles.showcase}>{remaining.map(film=><FilmCard key={film.href} film={film}/>)}</div></details>}</>;
}
