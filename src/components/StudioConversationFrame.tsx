"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import {studioPathCategory} from "@/lib/studio-public-path";
export function StudioConversationFrame({document}:{document:string}) {
  const frame=useRef<HTMLIFrameElement>(null);
  const { openAuth } = useAuth();
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
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow)return;
      if(event.data?.type==="crelavo-studio-request-login"){
        openAuth("login",{next:window.location.pathname+window.location.search});
        return;
      }
      if(event.data?.type==="crelavo-studio-go-home"){window.location.assign("/studio");return;}
      if(event.data?.type!=="crelavo-studio-open-tool")return;
      const tool=event.data.tool;
      const paths:Record<string,string>={
        video:"/dashboard/studio-video-editor",
        image:"/dashboard/studio-image-editor",
        elements:"/dashboard/studio-elements"
      };
      if(typeof tool!=="string"||!Object.prototype.hasOwnProperty.call(paths,tool))return;
      const incomingCategory=studioPathCategory(window.location.pathname)||new URLSearchParams(window.location.search).get("category")||"video";
      const category=/^[a-z0-9_]{1,40}$/.test(incomingCategory)?incomingCategory:"video";
      window.location.assign(paths[tool]+"?studioCategory="+encodeURIComponent(category));
    };
    window.addEventListener("message",onMessage);
    return()=>window.removeEventListener("message",onMessage);
  },[openAuth]);
  const deliver=()=>frame.current?.contentWindow?.postMessage({type:"crelavo-studio-session",accessToken:session?.accessToken??null,userId:session?.userId??null},window.location.origin);
  useEffect(deliver,[session]);
  return <iframe ref={frame} title="Crelavo Studio conversation" allowFullScreen srcDoc={document} onLoad={deliver} sandbox="allow-scripts allow-same-origin allow-downloads allow-modals" style={{display:"block",width:"100%",height:"100dvh",border:0}}/>;
}
