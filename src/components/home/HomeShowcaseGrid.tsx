import {Play} from "lucide-react";
import styles from "./PremiumHome.module.css";
type ShowcaseFilm={href:string;kicker:string;title:string;poster?:string;video:string;landscape:boolean};
function FilmCard({film}:{film:ShowcaseFilm}){return <a className={styles.film} href={film.href}><div className={styles.filmMedia}>{film.poster&&<img src={film.poster} alt={film.title+" preview"} loading="lazy" decoding="async" width={320} height={400}/>}<Play aria-hidden="true"/></div><div className={styles.filmText}><small>{film.kicker}</small><h3>{film.title}</h3></div></a>}
export function HomeShowcaseGrid({films}:{films:ShowcaseFilm[]}){return <><div className={styles.showcase}>{films.slice(0,8).map(film=><FilmCard key={film.href} film={film}/>)}</div>{films.length>8&&<details className={styles.moreFilms}><summary>See all {films.length} published examples</summary><div className={styles.showcase}>{films.slice(8).map(film=><FilmCard key={film.href} film={film}/>)}</div></details>}</>}
