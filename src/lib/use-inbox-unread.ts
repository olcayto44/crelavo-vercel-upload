"use client";
import {useSyncExternalStore} from "react";
export const INBOX_EVENT="crelavo-inbox-read-change";
type Snapshot={unread:number;unreadIds:string[];ids:string[];window:number};
let state:Snapshot|null=null;
const listeners=new Set<()=>void>();
let controller:AbortController|null=null,timer:number|undefined,rerun=false;
const notify=(next:Snapshot|null)=>{state=next;listeners.forEach(fn=>fn())};
async function load(){
 if(!listeners.size||document.hidden)return;
 if(controller){rerun=true;return;}
 const request=new AbortController();controller=request;
 try{
 const r=await fetch("/api/admin/inbox-unread",{cache:"no-store",credentials:"same-origin",signal:request.signal});
 const d=await r.json();
 if(!r.ok||typeof d.unread!=="number"||!Array.isArray(d.unreadIds)||!Array.isArray(d.ids))throw Error("unavailable");
 if(controller===request)notify(d);
 }catch{if(controller===request&&!request.signal.aborted)notify(null)}
 finally{if(controller===request){controller=null;if(rerun){rerun=false;void load()}}}
}
function subscribe(fn:()=>void){
 listeners.add(fn);
 if(listeners.size===1){void load();timer=window.setInterval(load,20000);window.addEventListener(INBOX_EVENT,load);document.addEventListener("visibilitychange",load)}
 return()=>{listeners.delete(fn);if(!listeners.size){if(timer!==undefined)window.clearInterval(timer);window.removeEventListener(INBOX_EVENT,load);document.removeEventListener("visibilitychange",load);controller?.abort();controller=null;rerun=false;state=null}};
}
export function useInboxUnread(){return useSyncExternalStore(subscribe,()=>state,()=>null)}
