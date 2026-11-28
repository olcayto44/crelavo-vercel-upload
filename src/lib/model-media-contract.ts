// Shared server-side validation of verified model media. No network or credit mutation.
import {buildMagiPayload,type MagiRequest,type MagiProvider} from "./model-production-contract";
export const MODEL_MEDIA_BUCKET="model-original-quarantine";
export const MODEL_MEDIA_TEST_MAX_BYTES=50000000;
type Kind="image"|"video"|"audio";
export type VerifiedModelAsset={id:string;user_id:string;model_id:string;kind:Kind;mime:string;bytes:number;object_key:string;state:string;sha256:string|null;duration_ms:number|null};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function modelAssetKey(owner:string,id:string){
 if(!uuid.test(owner)||!uuid.test(id))throw Error("invalid_asset_identity");
 return owner.toLowerCase()+"/"+id.toLowerCase()+"/original";
}
export function verifiedModelReferences(owner:string,modelId:string,assets:VerifiedModelAsset[],mediaOrigin:string):MagiRequest["assets"]{
 if(!uuid.test(owner)||assets.length>20)throw Error("invalid_asset_set");
 const origin=new URL(mediaOrigin);
 if(origin.protocol!=="https:"||origin.origin!==mediaOrigin||origin.username||origin.password)throw Error("invalid_media_origin");
 const seen=new Set<string>();
 return assets.map(a=>{
 if(a.user_id!==owner||a.model_id!==modelId||a.state!=="verified"||!a.sha256||!(/^[0-9a-f]{64}$/).test(a.sha256)||a.object_key!==modelAssetKey(owner,a.id)||seen.has(a.id)||!Number.isSafeInteger(a.bytes)||a.bytes<=0||a.bytes>MODEL_MEDIA_TEST_MAX_BYTES)throw Error("unverified_asset");
 seen.add(a.id);
 if(a.kind==="image"){if(!["image/jpeg","image/png","image/webp"].includes(a.mime)||a.bytes>=30000000||a.duration_ms!==null)throw Error("invalid_image")}
 else if(a.kind==="video"||a.kind==="audio"){const allowed=a.kind==="video"?["video/mp4","video/quicktime"]:["audio/mpeg","audio/wav"];if(!allowed.includes(a.mime)||a.kind==="audio"&&a.bytes>=15000000||typeof a.duration_ms!=="number"||!Number.isInteger(a.duration_ms)||a.duration_ms<2000||a.duration_ms>30000)throw Error("invalid_timed_asset")}
 else throw Error("invalid_kind");
 // Placeholder for future authenticated, time-limited worker delivery; never a public bucket URL.
 return {kind:a.kind,mime:a.mime,bytes:a.bytes,...(a.duration_ms===null?{}:{seconds:a.duration_ms/1000}),url:origin.origin+"/model-assets/"+a.id};
 });
}
// Planning-only preflight. Does not return credentials, call a provider, or create a job.
export function preflightModelJob(owner:string,provider:MagiProvider,input:Omit<MagiRequest,"assets">,assets:VerifiedModelAsset[],mediaOrigin:string){
 const refs=verifiedModelReferences(owner,"magi-2",assets,mediaOrigin);
 buildMagiPayload(provider,{...input,assets:refs},mediaOrigin);
 return {modelId:"magi-2",provider,assetCount:refs.length,renderingEnabled:false,dispatchAllowed:false} as const;
}
