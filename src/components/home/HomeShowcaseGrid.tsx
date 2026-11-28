import {Play,Film} from "lucide-react";
import styles from "./PremiumHome.module.css";
type ShowcaseFilm={href:string;kicker:string;title:string;poster?:string;video:string;landscape:boolean};
function FilmCard({film}:{film:ShowcaseFilm}){return <a className={styles.film} href={film.href} aria-label={"Watch "+film.title}><div className={styles.filmMedia}>{film.poster?<img src={film.poster} alt={film.title+" preview"} loading="lazy" decoding="async" width={320} height={400}/>:<div className={styles.filmFallback}><Film aria-hidden="true" size={26}/><strong>{film.title}</strong><span>Video example</span></div>}<Play className={styles.playIcon} aria-hidden="true"/></div><div className={styles.filmText}><small>{film.kicker}</small><h3>{film.title}</h3><span className={styles.watchLabel}>Watch example →</span></div></a>}
export function HomeShowcaseGrid({films}:{films:ShowcaseFilm[]}){
 const preferred=[...films.filter(f=>f.poster),...films.filter(f=>!f.poster)];
 const featured=preferred.slice(0,8);const remaining=preferred.slice(8);
 return <><div className={styles.showcase}>{featured.map(film=><FilmCard key={film.href} film={film}/>)}</div>{remaining.length>0&&<details className={styles.moreFilms}><summary>See all {films.length} published examples</summary><div className={styles.showcase}>{remaining.map(film=><FilmCard key={film.href} film={film}/>)}</div></details>}</>;
}
