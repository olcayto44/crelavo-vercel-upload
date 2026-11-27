import {Suspense} from "react";
import {redirect} from "next/navigation";
import AssistantPage from "@/components/assistant-work/AssistantPage";
import {customerStudioPath} from "@/lib/customer-studio-route";
export default async function AssistantWorkspacePage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const query=await searchParams;
 // Preserve explicit historical revision handoffs until Studio supports their full context.
 if(typeof query.requestType==="string"&&query.requestType.trim()&&typeof query.idea==="string"&&query.idea.trim())return <Suspense fallback={null}><AssistantPage/></Suspense>;
 redirect(customerStudioPath(query));
}
