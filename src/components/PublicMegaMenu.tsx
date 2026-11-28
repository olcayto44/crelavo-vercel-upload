"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {ChevronDown} from "lucide-react";
type Group={title:string;links:readonly {label:string;href:string}[]};
export function PublicMegaMenu({id,label,href,groups}:{id:string;label:string;href:string;groups:readonly Group[]}){
 const [open,setOpen]=useState(false);const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),pinned=useRef(false);
 const cancel=()=>{if(timer.current!==null){clearTimeout(timer.current);timer.current=null}};
 const close=()=>{cancel();pinned.current=false;setOpen(false)};
 useEffect(()=>{function outside(e:PointerEvent){if(root.current&&!root.current.contains(e.target as Node))close()}function other(e:Event){if((e as CustomEvent<string>).detail!==id)close()}document.addEventListener("pointerdown",outside);window.addEventListener("crelavo-public-menu-open",other);return()=>{cancel();document.removeEventListener("pointerdown",outside);window.removeEventListener("crelavo-public-menu-open",other)}},[id]);
 function show(){cancel();window.dispatchEvent(new CustomEvent("crelavo-public-menu-open",{detail:id}));setOpen(true)}
 return <div ref={root} className="cr-menu-root" onPointerEnter={e=>{if(e.pointerType==="mouse")show()}} onPointerLeave={e=>{if(e.pointerType==="mouse"&&!pinned.current&&!root.current?.contains(document.activeElement)){cancel();timer.current=setTimeout(()=>setOpen(false),180)}}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))close()}} onKeyDown={e=>{if(e.key==="Escape"){e.preventDefault();close();trigger.current?.focus()}}}>
 <button ref={trigger} type="button" className="cr-menu-trigger" aria-expanded={open} aria-controls={"cr-menu-"+id} onClick={()=>{if(pinned.current){close();return}pinned.current=true;show()}}>{label}<ChevronDown size={14} aria-hidden="true"/></button>
 <div className="cr-menu-bridge" hidden={!open}><div id={"cr-menu-"+id} className="cr-menu-panel"><div className="cr-menu-grid">{groups.map(g=><section key={g.title} className="cr-menu-group"><h3>{g.title}</h3>{g.links.map(l=><Link href={l.href} key={l.href} onClick={close}>{l.label}</Link>)}</section>)}</div><Link className="cr-menu-all" href={href} onClick={close}>Explore all {label.toLowerCase()} →</Link></div></div></div>
}
