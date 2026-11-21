"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
export function StudioConversationFrame({document}:{document:string}) {
  const frame=useRef<HTMLIFrameElement>(null);
  const [session,setSession]=useState<{accessToken:string;userId:string}|null>(null);
  useEffect(()=>{
    let active=true;const client=supabaseBrowser();
    const assign=(value:{access_token:string;user:{id:string}}|null)=>{if(active)setSession(value?{accessToken:value.access_token,userId:value.user.id}:null)};
    void client.auth.getSession().then(({data})=>assign(data.session));
    const {data}=client.auth.onAuthStateChange((_event,value)=>assign(value));
    return()=>{active=false;data.subscription.unsubscribe()};
  },[]);
  const deliver=()=>frame.current?.contentWindow?.postMessage({type:"crelavo-studio-session",accessToken:session?.accessToken??null,userId:session?.userId??null},window.location.origin);
  useEffect(deliver,[session]);
  return <iframe ref={frame} title="Crelavo Studio V2 conversation" allowFullScreen srcDoc={document} onLoad={deliver} sandbox="allow-scripts allow-same-origin allow-downloads allow-modals" style={{display:"block",width:"100%",height:"100dvh",border:0}}/>;
}
