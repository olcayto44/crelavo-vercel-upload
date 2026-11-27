import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {WebsiteCmsPilot} from "../WebsiteCmsPilot";
import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Website Studio – private review",robots:{index:false,follow:false}};
export default function Page(){
 const e=process.env,key=e.STUDIO_AGENT_TEST_PUBLISHABLE_KEY;
 if(!websiteDesignPilotEnabled()||!key?.startsWith("sb_publishable_"))notFound();
 return <WebsiteCmsPilot origin="https://bwzxdxqgrgbsvndinmrv.supabase.co" publishableKey={key} reviewOnly/>;
}
