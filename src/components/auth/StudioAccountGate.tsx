"use client";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
export function StudioAccountGate({children}:{children:ReactNode}) {
 const {user,loading,openAuth}=useAuth();
 const destination=()=>window.location.pathname+window.location.search;
 useEffect(()=>{if(!loading&&!user)openAuth("login",{next:destination()})},[loading,user,openAuth]);
 if(loading)return <main style={{padding:40,background:"#16101f",minHeight:"100dvh",color:"white"}}>Loading Studio session...</main>;
 if(!user)return <main style={{padding:40,background:"#16101f",minHeight:"100dvh",color:"white"}}><h1>Crelavo AI Studio V2</h1><p>Sign in here to continue. You will stay on this Preview; no production starts.</p><button onClick={()=>openAuth("login",{next:destination()})}>Sign in to Studio V2</button></main>;
 return <>{children}</>;
}
