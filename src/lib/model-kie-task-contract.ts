// Kie MAGI-2 text job contract, based on the documented createTask and recordInfo APIs.
import {z} from "zod";
import {buildMagiPayload,type MagiRequest,modelRenderGate} from "./model-production-contract";
const taskId=z.string().regex(/^[a-zA-Z0-9_-]{1,200}$/);
const createResult=z.object({code:z.literal(200),data:z.object({taskId})});
const statusResult=z.object({code:z.literal(200),data:z.object({taskId,state:z.string().max(40),resultJson:z.string().max(65536).nullable().optional()})});
export function kieTextRequest(input:MagiRequest){
 if(input.mode!=="text")throw Error("kie_media_schema_pending");
 return buildMagiPayload("kie",input,"https://media.crelavo.com");
}
export function kieTaskStatusUrl(id:string){
 return "https://api.kie.ai/api/v1/jobs/recordInfo?taskId="+encodeURIComponent(taskId.parse(id));
}
export function readKieCreated(raw:unknown){return createResult.parse(raw).data.taskId}
export function readKieStatus(raw:unknown,expectedId:string){
 const r=statusResult.parse(raw).data;
 if(r.taskId!==taskId.parse(expectedId))throw Error("provider_task_mismatch");
 if(r.state==="fail")return {state:"reconcile_required",reason:"provider_failed_receipt_required"} as const;
 if(r.state==="success"){
 // URLs from the provider are untrusted. No download, automatic success or settlement.
 const result=z.object({resultUrls:z.array(z.string().max(4096)).min(1).max(5)}).parse(JSON.parse(r.resultJson??"null"));
 if(result.resultUrls.some(u=>{try{const p=new URL(u);return p.protocol!=="https:"||!!p.username||!!p.password||!!p.port}catch{return true}}))throw Error("invalid_result_url");
 return {state:"reconcile_required",reason:"private_delivery_and_cost_verification_required",candidateCount:result.resultUrls.length} as const;
 }
 if(["waiting","queuing","generating"].includes(r.state))return {state:"pending"} as const;
 return {state:"reconcile_required",reason:"unknown_provider_state"} as const;
}
// A documented request is not permission to spend. Production remains disabled.
export function requireKieCommercialActivation(){if(!modelRenderGate.enabled)throw Error(modelRenderGate.reason);throw Error("approved_transport_not_connected")}
