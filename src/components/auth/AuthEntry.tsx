"use client";
import {useEffect} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAuth} from "./AuthProvider";
export function AuthEntry({next}:{next:string}){
 const {user,loading,openAuth}=useAuth(),router=useRouter();
 useEffect(()=>{if(user&&!loading)router.replace(next);},[user,loading,next,router]);
 return <main className="container section" style={{maxWidth:520,margin:"32px auto",minHeight:"52vh"}}><section className="card" style={{padding:24,display:"grid",gap:14}}><h1>Welcome to Crelavo</h1><p>Sign in to your workspace with Google or a secure email link. Use the email associated with your account or purchase.</p><button type="button" className="btn" disabled={loading} onClick={()=>openAuth("login",{next})}>{loading?"Checking session…":"Sign in"}</button><Link href="/pricing">New to Crelavo? Explore plans</Link><Link href="/auth/forgot-password">Reset an existing password</Link><Link href="/auth/resend-confirmation">Resend confirmation email</Link><Link href="/contact">Need account support?</Link></section></main>;
}
