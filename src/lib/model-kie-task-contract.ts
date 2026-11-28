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

// Offline request preparation only. Shared validation checks mode, owned-media origin,
// content type, byte size, duration and cardinality before mapping provider-specific fields.
export function kieMagiRequest(input:MagiRequest,approvedMediaOrigin:string){
 if(input.mode==="text")return kieTextRequest(input);
 buildMagiPayload("higgsfield",input,approvedMediaOrigin);
 const common={prompt:input.prompt.trim(),duration:input.duration,resolution:"1080p",generate_audio:input.audio};
 const byKind=(kind:"image"|"audio"|"video")=>input.assets.filter(a=>a.kind===kind).map(a=>new URL(a.url).href);
 const images=byKind("image"),audio=byKind("audio"),video=byKind("video");
 // The image-mode output inherits the source image ratio; do not send aspect_ratio.
 if(input.mode==="image")return {provider:"kie" as const,url:"https://api.kie.ai/api/v1/jobs/createTask",body:{model:"magi-2/image-to-video",input:{...common,first_frame_url:images[0]}}};
 // The published reference example confirms image/audio field names. Fail closed
 // on video references until the exact provider schema is independently verified.
 if(video.length)throw Error("kie_video_reference_schema_pending");
 return {provider:"kie" as const,url:"https://api.kie.ai/api/v1/jobs/createTask",body:{model:"magi-2/reference-to-video",input:{...common,aspect_ratio:input.ratio,...(images.length?{reference_image_urls:images}:{}),...(audio.length?{reference_audio_urls:audio}:{})}}};
}
// Account-screen quotation captured 2026-11-28. Not an authoritative live tariff or a receipt.
export const kieMagiDraftPrice={observedAt:"2026-11-28",source:"account_pricing_screen_user_reported",microUsdPerSecond:88000,milliKieCreditsPerSecond:17600,approved:false} as const;
export function estimateKieMagiDraft(seconds:number){
 if(!Number.isInteger(seconds)||seconds<4||seconds>30)return null;
 return {microUsd:seconds*kieMagiDraftPrice.microUsdPerSecond,milliKieCredits:seconds*kieMagiDraftPrice.milliKieCreditsPerSecond,approved:false as const};
}

// Provider-reported credit consumption is observational evidence, not a paid invoice.
// This parser deliberately never accepts unknown tasks, models or negative/invalid consumption.
export function readKieUsage(raw:unknown,expectedId:string){
 const d=z.object({code:z.literal(200),data:z.object({taskId,model:z.string().regex(/^[a-zA-Z0-9_./-]{1,150}$/),state:z.enum(["waiting","queuing","generating","success","fail"]),creditsConsumed:z.number().finite().min(0).max(100000000).nullable().optional()})}).parse(raw).data;
 if(d.taskId!==taskId.parse(expectedId))throw Error("provider_task_mismatch");
 const terminal=d.state==="success"||d.state==="fail";
 return {model:d.model,state:d.state,reportedKieCredits:terminal?d.creditsConsumed??null:null,settlement:"not_verified" as const};
}
