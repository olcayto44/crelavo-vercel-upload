"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
export function StudioProductionFrame({document}:{document:string}){
 const frame=useRef<HTMLIFrameElement>(null);const [session,setSession]=useState<{accessToken:string;userId:string}|null>(null);
 useEffect(()=>{let active=true;const client=supabaseBrowser();void client.auth.getSession().then(({data})=>{if(active&&data.session)setSession({accessToken:data.session.access_token,userId:data.session.user.id})});const {data}=client.auth.onAuthStateChange((_event,value)=>{if(active)setSession(value?{accessToken:value.access_token,userId:value.user.id}:null)});return()=>{active=false;data.subscription.unsubscribe()}},[]);
 function deliver(){if(session&&frame.current?.contentWindow)frame.current.contentWindow.postMessage({type:"crelavo-studio-session",...session},window.location.origin)}
 useEffect(deliver,[session]);
 return <iframe ref={frame} title="Crelavo production Studio" srcDoc={document} onLoad={deliver} sandbox="allow-scripts allow-same-origin allow-downloads allow-modals" style={{display:"block",width:"100%",height:"100dvh",border:0}}/>;
}
