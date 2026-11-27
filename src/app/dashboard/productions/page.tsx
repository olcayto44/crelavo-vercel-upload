import Link from "next/link";
import {CustomerPage} from "@/components/CustomerDashboard";
import {CustomerProjectList} from "@/components/CustomerProjectList";
import {DashboardFooter} from "@/components/DashboardFooter";
export default function MyProductionsPage(){return <><CustomerPage active="/dashboard/productions" title="My projects" description="Find your saved projects and open their delivery details."><div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}><Link className="btn" href="/dashboard/studio">New project</Link><Link className="btn secondary" href="/dashboard/staged-productions">Staged image projects</Link></div><CustomerProjectList/></CustomerPage><DashboardFooter/></>}
