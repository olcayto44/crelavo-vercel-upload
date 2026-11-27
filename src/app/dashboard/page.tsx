import Link from "next/link";
import {CustomerPage} from "@/components/CustomerDashboard";
import {CreditBalanceCard} from "@/components/CreditBalanceCard";
import {StudioDiscovery} from "@/components/StudioDiscovery";
const tiles=[["Website","/dashboard/studio/website","Plan and review a website."],["AI Video","/dashboard/studio/video","Plan your video."],["Images","/dashboard/studio/image","Plan a visual project."]] as const;
export default function DashboardPage(){return <CustomerPage active="/dashboard" title="Your workspace" description="Start a project, manage your files and check your available credits.">
 <section className="card" style={{display:"grid",gap:12,padding:20,marginBottom:16}}><h2>Start creating</h2><p>Choose a category and review the plan before any paid production.</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link className="btn" href="/dashboard/studio">Open Studio</Link><Link className="btn secondary" href="/dashboard/productions">My projects</Link></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(180px,100%),1fr))",gap:10}}>{tiles.map(([label,href,description])=><Link className="card" key={href} href={href} style={{display:"grid",gap:4,textDecoration:"none"}}><strong>{label}</strong><small style={{color:"#b6c5da"}}>{description}</small></Link>)}</div></section>
 <CreditBalanceCard compact/>
 <StudioDiscovery privateWorkspace/>
 <details style={{marginTop:22}}><summary style={{cursor:"pointer",fontWeight:650}}>More services and support</summary><div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:12}}>{[["Growth Intelligence","/dashboard/growth-intelligence"],["Partners","/dashboard/partners"],["Live Sales","/dashboard/live-sales-agent"],["Drone","/dashboard/drone-shoot"],["Support","/dashboard/contact"]].map(([label,href])=><Link key={href} className="btn secondary" href={href}>{label}</Link>)}</div></details>
 </CustomerPage>}
