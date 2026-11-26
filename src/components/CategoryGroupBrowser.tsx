"use client";
import {AppWindow,AudioWaveform,Bot,Clapperboard,FileText,Globe2,Image,LayoutDashboard,Megaphone,MonitorSmartphone,Music2,Palette,Pencil,Radio,ScrollText,Scissors,Sparkles,UsersRound,UserRound,Video,Wand2,Search,ArrowUpRight,ArrowRight} from "lucide-react";
import {useState} from "react";
import {CATEGORIES} from "@/lib/crelavo/categoryCatalog";
import {categoryPublicPaths} from "@/lib/category-public-routes";
import {categoryDiscoveryCopy} from "@/lib/category-discovery-copy";
import styles from "./CategoryGroupBrowser.module.css";
const icons = {
  campaign: Megaphone,
  ai_agent: Bot,
  localization: Globe2,
  ad_score_checker: Megaphone,
  virtual_model_studio: Image,
  cultural_localization: Globe2,
  campaign_calendar: Sparkles,
  crelavo_academy: FileText,
  community_showcase: UsersRound,
  video: Video,
  talking_video: UsersRound,
  documentary: ScrollText,
  animation: Wand2,
  anime_short_film: Clapperboard,
  animal_video: Video,
  nature_video: Globe2,
  planet_space_video: Sparkles,
  drone_video: Globe2,
  live_sales_agent: Radio,
  studio: Clapperboard,
  drama: Clapperboard,
  cinematic_video: Sparkles,
  video_clipping: Scissors,
  avatar: UserRound,
  lip_sync: AudioWaveform,
  voice_clone: AudioWaveform,
  visual_clone: Wand2,
  video_tools: Video,
  stickman_animation: Pencil,
  music_video: Music2,
  website: MonitorSmartphone,
  saas: LayoutDashboard,
  mobile_app: AppWindow,
  image: Image,
  brand_kit: Palette,
  document_pack: FileText,
  admin_project: LayoutDashboard
};


const categoryGroups = [
  {
    id: "build",
    title: "Build",
    description: "Create a website, SaaS product, mobile app, or ecommerce experience.",
    typeIds: ["website","saas","mobile_app"]
  },
  {
    id: "create-media",
    title: "Create Media",
    description: "Create videos, product ads, talking videos, animation, music videos and cinematic content.",
    typeIds: ["video","talking_video","animation","music_video","drama","cinematic_video","video_clipping","video_tools"]
  },
  {
    id: "marketing-growth",
    title: "Marketing & Growth",
    description: "Create campaigns, product-link ads, social media systems, localization and performance analysis.",
    typeIds: ["campaign","ad_score_checker","ai_agent","localization","cultural_localization","live_sales_agent"]
  },
  {
    id: "avatars-voice",
    title: "Avatars & Voice",
    description: "Create avatars, lip-sync productions, cloned voices and reference-based visual variations.",
    typeIds: ["avatar","lip_sync","voice_clone","visual_clone","virtual_model_studio"]
  },
  {
    id: "brand-files",
    title: "Brand & Files",
    description: "Create images, brand kits and reusable visual assets.",
    typeIds: ["image","brand_kit"]
  },
  {
    id: "special-video",
    title: "Special Video",
    description: "Create anime, drone, stickman and studio productions.",
    typeIds: ["anime_short_film","drone_video","stickman_animation","studio"]
  }
];


export function CategoryGroupBrowser(){
 const [query,setQuery]=useState("");const [group,setGroup]=useState("all");
 const matches=(id:string)=>{const c=CATEGORIES.find(c=>c.id===id);const copy=categoryDiscoveryCopy[id];return !!c&&!!copy&&[copy[0],copy[1],c.label,...c.features.map(f=>f.label)].join(" ").toLowerCase().includes(query.trim().toLowerCase());};
 const visible=categoryGroups.filter(g=>group==="all"||g.id===group).map(g=>({...g,typeIds:g.typeIds.filter(matches)})).filter(g=>g.typeIds.length);
 const count=visible.reduce((n,g)=>n+g.typeIds.length,0);
 return <div className={styles.browser} id="category-catalog-v4">
  <div className={styles.controls}><label className={styles.search}><Search size={20} aria-hidden="true"/><input type="search" aria-label="Search production categories" placeholder="Search video, website, avatar, branding…" value={query} onChange={e=>setQuery(e.target.value)} maxLength={100}/></label><div className={styles.filters} role="group" aria-label="Filter categories"><button type="button" aria-pressed={group==="all"} onClick={()=>setGroup("all")}>All <span>{CATEGORIES.length}</span></button>{categoryGroups.map(g=><button type="button" key={g.id} aria-pressed={group===g.id} onClick={()=>setGroup(g.id)}>{g.title} <span>{g.typeIds.length}</span></button>)}</div></div>
  <div className={styles.count} aria-live="polite">{count} of {CATEGORIES.length} categories{query&&" matching your search"}<span>Explore details without an account</span></div>
  {!count&&<div className={styles.empty}><h2>No categories found</h2><p>Try a different keyword or clear the filter.</p><button type="button" onClick={()=>{setQuery("");setGroup("all")}}>Clear filters</button></div>}
  {visible.map((g,i)=><section key={g.id} className={styles.group} id={"clc-"+g.id} aria-labelledby={"catalog-heading-"+g.id}><header className={styles.groupHead}><div><span className={styles.groupIndex}>{String(categoryGroups.findIndex(x=>x.id===g.id)+1).padStart(2,"0")} / {g.typeIds.length} categories</span><h2 id={"catalog-heading-"+g.id}>{g.title}</h2><p>{g.description}</p></div></header><div className={styles.grid}>{g.typeIds.map(id=>{
    const c=CATEGORIES.find(c=>c.id===id)!;const copy=categoryDiscoveryCopy[id];const Icon=icons[id as keyof typeof icons]||Sparkles;
    return <a key={id} data-category={id} href={categoryPublicPaths[id]} className={styles.card} aria-label={"Explore "+copy[0]}><div className={styles.cardTop}><span className={styles.icon} data-group={g.id}><Icon size={25} strokeWidth={1.65} aria-hidden="true"/></span><ArrowUpRight size={17} className={styles.arrow} aria-hidden="true"/></div><h3>{copy[0]}</h3><p>{copy[1]}</p><div className={styles.tags}>{c.features.slice(0,2).map(x=><span key={x.id}>{x.label}</span>)}</div><div className={styles.cardBottom}><span>Explore details</span><ArrowRight size={16} aria-hidden="true"/></div></a>
  })}</div></section>)}
 </div>
}
