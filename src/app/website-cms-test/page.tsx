import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {WebsiteCmsPilot} from "./WebsiteCmsPilot";
import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Isolated Website CMS test",robots:{index:false,follow:false}};
export default function Page(){
 const e=process.env,origin="https://bwzxdxqgrgbsvndinmrv.supabase.co",key=e.STUDIO_AGENT_TEST_PUBLISHABLE_KEY;
 if(!websiteDesignPilotEnabled()||!key?.startsWith("sb_publishable_"))notFound();
 return <WebsiteCmsPilot origin={origin} publishableKey={key}/>;
}
