import Link from "next/link";
import {CustomerPage} from "@/components/CustomerDashboard";
import {CustomerAccountRecords} from "@/components/CustomerAccountRecords";
export default function DashboardPartnersPage(){return <CustomerPage active="/dashboard/partners" title="Partner program" description="Your approved account and recorded commissions."><CustomerAccountRecords section="partner"/><div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}><Link className="btn" href="/affiliate">Program & application</Link><Link className="btn secondary" href="/dashboard/contact">Partner support</Link></div></CustomerPage>}
