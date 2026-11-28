"use client";
import {useState} from "react";
import {Play,Film} from "lucide-react";
import styles from "./PremiumHome.module.css";
type ShowcaseFilm={href:string;kicker:string;title:string;poster?:string;video:string;landscape:boolean};
function FilmCard({film}:{film:ShowcaseFilm}){
 const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
 return <a className={styles.film} href={film.href} aria-label={"Watch "+film.title}>
 <div className={styles.filmMedia} data-orientation={film.landscape?"landscape":"portrait"}>
 <div className={styles.filmFallback}><Film aria-hidden="true" size={26}/><strong>{film.title}</strong><span>{failed?"Preview unavailable · watch example":"Video example"}</span></div>
 {film.poster&&!failed&&<img src={film.poster} alt={film.title+" preview"} loading="lazy" decoding="async" width={320} height={400} style={{opacity:loaded?1:0}} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/>}
 <Play className={styles.playIcon} aria-hidden="true"/></div>
 <div className={styles.filmText}><small>{film.kicker}</small><h3>{film.title}</h3><span className={styles.watchLabel}>Watch example →</span></div></a>;
}
export function HomeShowcaseGrid({films}:{films:ShowcaseFilm[]}){
 const preferred=[...films.filter(f=>f.poster),...films.filter(f=>!f.poster)];
 const featured=preferred.slice(0,8);const remaining=preferred.slice(8);
 return <><div className={styles.showcase}>{featured.map(film=><FilmCard key={film.href} film={film}/>)}</div>{remaining.length>0&&<details className={styles.moreFilms}><summary>See all {films.length} published examples</summary><div className={styles.showcase}>{remaining.map(film=><FilmCard key={film.href} film={film}/>)}</div></details>}</>;
}
