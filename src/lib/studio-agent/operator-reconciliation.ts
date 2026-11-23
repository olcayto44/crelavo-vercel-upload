import {z} from "zod";
import {ConversationError} from "./conversation-contract";
const decision=z.strictObject({userId:z.string().uuid(),requestId:z.string().uuid(),evidenceId:z.string().uuid(),reason:z.string().trim().min(3).max(500)});
// Server-only adapter; intentionally no HTTP route or operator UI is exposed.
// authenticate must verify the operator session; DB independently checks active role and reviewed evidence.
export async function reconcileAsOperator(raw:unknown,deps:{authenticate:()=>Promise<{id:string}>;rpc:(name:string,args:Record<string,unknown>)=>Promise<{data:unknown;error:unknown}>}){
 let actor:{id:string};try{actor=await deps.authenticate();z.string().uuid().parse(actor.id);}catch{throw new ConversationError("operator_not_authorized",403);}
 const input=decision.parse(raw);const{data,error}=await deps.rpc("studio_agent_operator_reconcile",{p_actor:actor.id,p_user:input.userId,p_request:input.requestId,p_evidence:input.evidenceId,p_reason:input.reason});
 if(error)throw new ConversationError("operator_reconciliation_rejected",409);return data;
}