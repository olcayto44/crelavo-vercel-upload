"use client";
import {useEffect,useState} from "react";
export const INBOX_EVENT="crelavo-inbox-read-change";
export function useInboxUnread(){
 const [state,setState]=useState<{unread:number;unreadIds:string[]}|null>(null);
 useEffect(()=>{let stopped=false,busy=false;const controller=new AbortController();
 async function load(){if(stopped||busy||document.hidden)return;busy=true;try{const r=await fetch("/api/admin/inbox-unread",{cache:"no-store",credentials:"same-origin",signal:controller.signal});const d=await r.json();if(!r.ok||typeof d.unread!=="number"||!Array.isArray(d.unreadIds))throw Error("unavailable");if(!stopped)setState(d);}catch{if(!stopped)setState(null)}finally{busy=false}}
 void load();const id=window.setInterval(load,20000);window.addEventListener(INBOX_EVENT,load);document.addEventListener("visibilitychange",load);
 return()=>{stopped=true;controller.abort();clearInterval(id);window.removeEventListener(INBOX_EVENT,load);document.removeEventListener("visibilitychange",load)};
 },[]);
 return state;
}
