"use client";
import { useEffect, useRef, useState } from "react";
import { HOME_BRIEF_KEY,readHomeBrief } from "@/lib/home-brief";
import { supabaseBrowser } from "@/lib/supabase";
export function StudioConversationFrame({document}:{document:string}) {
  const frame=useRef<HTMLIFrameElement>(null);
  const [session,setSession]=useState<{accessToken:string;userId:string}|null>(null);
  useEffect(()=>{
    let active=true;const client=supabaseBrowser();
    const assign=(value:{access_token:string;user:{id:string}}|null)=>{if(active)setSession(value?{accessToken:value.access_token,userId:value.user.id}:null)};
    // Auth events can arrive before getSession resolves. Never let an older
    // getSession response overwrite a newer sign-in, refresh, or sign-out.
    let authEventReceived=false;
    const {data}=client.auth.onAuthStateChange((_event,value)=>{
      authEventReceived=true;
      assign(value);
    });
    void client.auth.getSession().then(({data})=>{
      if(!authEventReceived)assign(data.session);
    }).catch(()=>{if(!authEventReceived)assign(null)});
    return()=>{active=false;data.subscription.unsubscribe()};
  },[]);
  const deliver=()=>frame.current?.contentWindow?.postMessage({type:"crelavo-studio-session",accessToken:session?.accessToken??null,userId:session?.userId??null},window.location.origin);
  // Wait for the authenticated iframe to finish resetting its conversation state.
  useEffect(()=>{
    function acceptReady(event:MessageEvent){
      if(!session||event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||event.data?.type!=="crelavo-studio-composer-ready"||event.data.userId!==session.userId)return;
      try{
        const saved=readHomeBrief(sessionStorage.getItem(HOME_BRIEF_KEY),window.location.pathname,Date.now());
        const input=frame.current?.contentDocument?.querySelector<HTMLTextAreaElement>("#prompt");
        if(saved&&input&&!input.disabled&&!input.value.trim()){
          input.value=saved;
          input.dispatchEvent(new Event("input",{bubbles:true}));
          input.focus();
          sessionStorage.removeItem(HOME_BRIEF_KEY);
        }
      }catch{/* Storage may be unavailable. Never submit or charge automatically. */}
    }
    window.addEventListener("message",acceptReady);
    return()=>window.removeEventListener("message",acceptReady);
  },[session]);
  useEffect(deliver,[session]);
  function onFrameLoad(){deliver();}
  return <iframe ref={frame} title="Crelavo Studio V2 conversation" allowFullScreen srcDoc={document} onLoad={onFrameLoad} sandbox="allow-scripts allow-same-origin allow-downloads allow-modals" style={{display:"block",width:"100%",height:"100dvh",border:0}}/>;
}
