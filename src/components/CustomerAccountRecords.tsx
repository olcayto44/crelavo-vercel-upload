"use client";
import {useEffect,useState} from "react";
import {authHeaders,requireVerifiedBrowserUser} from "@/lib/auth-guards";
type Row={id:string;product_title?:string;package_name?:string;amount_usd?:number|null;commission_amount?:number|null;currency?:string;status?:string;payout_status?:string;credits?:number;created_at?:string;whop_payment_id?:string};
type Data={payments?:Row[];commissions?:Row[];partner?:{partner_code:string;status:string;commission_percent:number;tier?:string}|null};
export function CustomerAccountRecords({section}:{section:"payments"|"partner"}){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(""),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let active=true;setData(null);setError("");void(async()=>{try{const auth=await requireVerifiedBrowserUser();if(!auth.ok)throw Error(auth.message);const res=await fetch("/api/customer/account?section="+section,{headers:authHeaders(auth.accessToken),cache:"no-store"});const body=await res.json();if(!res.ok)throw Error(body.error||"Records unavailable.");if(active)setData(body);}catch(e){if(active)setError(e instanceof Error?e.message:"Records unavailable.");}})();return()=>{active=false;};},[section,attempt]);
 const payments=section==="payments",rows=payments?data?.payments:data?.commissions;
 return <section className="card" style={{display:"grid",gap:10,marginTop:16,minWidth:0,overflowWrap:"anywhere"}}><h2>{payments?"Recorded payments":"Partner account"}</h2>
 {!data&&!error&&<p role="status">Loading records…</p>}{error&&<><p role="alert">{error}</p><button className="btn secondary" onClick={()=>setAttempt(a=>a+1)}>Retry</button></>}
 {data&&<>{!payments&&(data.partner?<p>Code: <strong>{data.partner.partner_code}</strong> · {data.partner.status} · {data.partner.commission_percent}% commission</p>:<p>No partner profile recorded. Apply through the partner program.</p>)}
 {!rows?.length?<p>{payments?"No linked payments recorded here. Check Whop for your complete receipt history.":"No recorded commissions."}</p>:rows.map(r=><div key={r.id} style={{borderTop:"1px solid #344358",padding:"10px 0",display:"grid",gap:4}}><strong>{r.product_title||r.package_name||"Transaction"}</strong><span>{payments?(r.amount_usd==null?"Amount unavailable":Number(r.amount_usd).toLocaleString(undefined,{style:"currency",currency:"USD"})):(r.commission_amount==null?"Amount unavailable":Number(r.commission_amount).toFixed(2)+" "+(r.currency||""))} · {(r.status||r.payout_status||"unknown").replaceAll("_"," ")}</span><small>{r.created_at?new Date(r.created_at).toLocaleDateString():""}{payments&&typeof r.credits==="number"?" · "+r.credits+" credits":""}</small>{payments&&r.whop_payment_id&&<small>Reference: {r.whop_payment_id}</small>}</div>)}
 <small>Latest 50 linked records. {payments?"For official invoices and cancellations, use Whop.":"Commission status is recorded by Crelavo, not a guarantee of payout."}</small></>}
 </section>;
}
