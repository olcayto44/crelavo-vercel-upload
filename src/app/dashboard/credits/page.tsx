import Link from "next/link";
import {CustomerPage} from "@/components/CustomerDashboard";
import {CreditBalanceCard} from "@/components/CreditBalanceCard";
export default function DashboardCreditsPage(){return <CustomerPage active="/dashboard/credits" title="Your credits" description="Review your balance before buying more credits."><CreditBalanceCard/><div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:20}}><Link className="btn" href="/pricing">Buy credits or choose a plan</Link><Link className="btn secondary" href="/dashboard/billing">Manage billing</Link><Link className="btn secondary" href="/dashboard/studio">Return to Studio</Link></div></CustomerPage>}
