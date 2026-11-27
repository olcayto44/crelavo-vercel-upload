import type {Metadata} from "next";
import {CustomerPage} from "@/components/CustomerDashboard";
import {OwnedProductionDetail} from "@/components/OwnedProductionDetail";
import {extractProductionId} from "@/lib/production-url";
export const metadata:Metadata={title:"My project | Crelavo",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function ProductionWorkspacePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;return <CustomerPage active="/dashboard/productions" title="Project details"><OwnedProductionDetail id={extractProductionId(id)}/></CustomerPage>;
}
