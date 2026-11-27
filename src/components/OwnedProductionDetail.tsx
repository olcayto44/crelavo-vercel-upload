"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {ProductionWorkspace} from "@/components/ProductionWorkspace";
import {requireVerifiedBrowserUser,authHeaders} from "@/lib/auth-guards";
import type {ComponentProps} from "react";
type Project=ComponentProps<typeof ProductionWorkspace>["production"];
export function OwnedProductionDetail({id}:{id:string}){
 const [project,setProject]=useState<Project|null>(null),[message,setMessage]=useState(""),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setProject(null);setMessage("");void(async()=>{try{const auth=await requireVerifiedBrowserUser();if(!auth.ok)throw Error(auth.message);const res=await fetch("/api/customer/project?id="+encodeURIComponent(id),{headers:authHeaders(auth.accessToken),cache:"no-store"});const body=await res.json();if(!res.ok||!body.project||body.project.user_id!==auth.user.id)throw Error(body.error||"Project not found.");if(active)setProject(body.project);}catch(e){if(active)setMessage(e instanceof Error?e.message:"Could not load project.");}})();return()=>{active=false;};},[id,attempt]);
 if(project)return <ProductionWorkspace production={project}/>;
 return <section className="card" role="status"><p>{message||"Loading your project…"}</p>{message&&<button className="btn secondary" onClick={()=>setAttempt(v=>v+1)}>Retry</button>}<Link className="btn secondary" href="/dashboard/productions">Back to my projects</Link></section>;
}
