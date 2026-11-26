import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {WebsiteCmsPilot} from "./WebsiteCmsPilot";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Isolated Website CMS test",robots:{index:false,follow:false}};
export default function Page(){
 const e=process.env,origin="https://bwzxdxqgrgbsvndinmrv.supabase.co",key=e.STUDIO_AGENT_TEST_PUBLISHABLE_KEY;
 if(e.VERCEL_ENV!=="preview"||!["feat/central-production-dispatch-20261125","release/commercial-five-track-20261126"].includes(e.VERCEL_GIT_COMMIT_REF||"")||e.STUDIO_WEBSITE_TEST_CONNECTION_ENABLED!=="true"||e.STUDIO_AGENT_TEST_DATABASE_URL!==origin||e.STUDIO_AGENT_TEST_DATABASE_ORIGIN!==origin||!key?.startsWith("sb_publishable_"))notFound();
 return <WebsiteCmsPilot origin={origin} publishableKey={key}/>;
}
