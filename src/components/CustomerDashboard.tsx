import Link from "next/link";
const destinations = [
 ["Overview", "/dashboard"], ["Studio", "/dashboard/studio"], ["My projects", "/dashboard/productions"], ["Credits", "/dashboard/credits"], ["Billing", "/dashboard/billing"], ["Settings", "/dashboard/settings"]
] as const;
export function CustomerNav({active}:{active?:string}) {
 return <nav aria-label="Customer dashboard" className="customer-navigation" style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:8,marginBottom:24}}>
  {destinations.map(([label,href])=><Link key={href} href={href} aria-current={href===active?"page":undefined} style={{fontSize:13,fontWeight:650,padding:"8px 13px",borderRadius:10,border:"1px solid #344358",background:href===active?"#164e63":"#111c2e",color:"#f1f5f9",textDecoration:"none"}}>{label}</Link>)}
 </nav>;
}
export function CustomerPage({active,title,description,children}:{active:string;title:string;description?:string;children:React.ReactNode}) {
 return <main className="container section dashboard-shell-layout dashboard-postlaunch-shell"><div style={{gridColumn:"1 / -1",width:"100%",minWidth:0,maxWidth:1120,margin:"0 auto",padding:"20px 12px 56px",color:"#f1f5f9"}}><CustomerNav active={active}/><h1 style={{fontSize:"clamp(26px,4vw,36px)",margin:"0 0 8px"}}>{title}</h1>{description&&<p style={{color:"#b6c5da",marginBottom:24,maxWidth:720}}>{description}</p>}{children}</div></main>;
}
