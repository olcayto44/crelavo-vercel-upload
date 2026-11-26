import {websitePilotScope,websitePilotProviderKey,websiteImagePilotConnection} from "./website-pilot-provider";
export const websiteImageRoutes=[
 {provider:"openai",model:"gpt-image-2.6-flare",version:"website-openai-flare-pilot-v1",credits:260,max_micro_usd:40000},
 {provider:"minimax",model:"image-01",version:"website-image-01-pilot-v1",credits:90,max_micro_usd:10000},
 {provider:"fal",model:"fal-ai/flux/schnell",version:"website-fal-flux-pilot-v1",credits:90,max_micro_usd:10000},
 {provider:"stability",model:"core",version:"website-stability-core-pilot-v1",credits:260,max_micro_usd:40000},
 {provider:"replicate",model:"black-forest-labs/flux-schnell",version:"website-replicate-flux-pilot-v1",credits:90,max_micro_usd:10000}
] as const;
export type WebsiteImageRoute=typeof websiteImageRoutes[number];
export function websiteImageCandidates(user:string,env:NodeJS.ProcessEnv=process.env){
 if(!websitePilotScope(env)||user!==env.STUDIO_WEBSITE_AI_TEST_USER_ID)return [];
 const minimax=websiteImagePilotConnection(env);
 const openai=websitePilotProviderKey(env);
 return websiteImageRoutes.flatMap(route=>{
 const key=route.provider==="openai"?openai:route.provider==="minimax"?(minimax.canaryId===user?minimax.apiKey:""):env.STUDIO_WEBSITE_REUSE_PREVIEW_IMAGE_ALTERNATIVES==="true"?(route.provider==="fal"?(env.FAL_KEY||env.FAL_API_KEY):route.provider==="stability"?(env.STABILITY_API_KEY||env.STABILITY_AI_API_KEY||env.STABILITYAI_API_KEY):(env.REPLICATE_API_TOKEN||env.REPLICATE_API_KEY))?.trim()||"":"";

 return key?[{route,key}]:[];
 });
}
export async function verifyWebsiteOpenAIImageModel(key:string,transport:typeof fetch=fetch){
 try{const r=await transport("https://api.openai.com/v1/models/gpt-image-2.6-flare",{method:"GET",redirect:"error",signal:AbortSignal.timeout(8000),headers:{Authorization:"Bearer "+key}});if(!r.ok)return false;return (await r.json())?.id==="gpt-image-2.6-flare";}catch{return false;}
}

// Availability status is separate from actual paid generation. No keys returned to clients.
export function websiteImageProviderInventory(env:NodeJS.ProcessEnv=process.env){
 return [
 {id:"openai",configured:!!env.OPENAI_API_KEY?.trim(),adapter:"available"},
 {id:"minimax",configured:!!(env.MINIMAX_API_KEY?.trim()||env.MINIMAX_KEY?.trim()),adapter:"available"},
 {id:"fal",configured:!!(env.FAL_API_KEY?.trim()||env.FAL_KEY?.trim()),adapter:"available"},
 {id:"stability",configured:!!(env.STABILITY_API_KEY?.trim()||env.STABILITY_AI_API_KEY?.trim()||env.STABILITYAI_API_KEY?.trim()),adapter:"available"},
 {id:"replicate",configured:!!(env.REPLICATE_API_TOKEN?.trim()||env.REPLICATE_API_KEY?.trim()),adapter:"available"}
 ];
}

/** Read-only account/model checks before quoting. No paid request, retry or secret output. */
export async function verifyWebsiteImageCandidate(provider:WebsiteImageRoute["provider"],key:string,transport:typeof fetch=fetch){
 if(provider==="openai")return verifyWebsiteOpenAIImageModel(key,transport);
 if(provider==="minimax")return !!key.trim(); // the existing MiniMax key is a configuration signal, not successful inference.
 if(!key.trim())return false;
 try{
 const url=provider==="fal"?"https://api.fal.ai/v1/models/pricing?endpoint_id=fal-ai%2Fflux%2Fschnell":provider==="stability"?"https://api.stability.ai/v1/user/balance":"https://api.replicate.com/v1/account";
 const r=await transport(url,{method:"GET",redirect:"error",signal:AbortSignal.timeout(8000),headers:{Authorization:(provider==="fal"?"Key ":"Bearer ")+key,Accept:"application/json"}});
 if(!r.ok){await r.body?.cancel().catch(()=>{});return false;}
 const reader=r.body?.getReader();if(!reader)return false;let count=0;const chunks:string[]=[];const decoder=new TextDecoder();try{for(;;){const {done,value}=await reader.read();if(done)break;count+=value.byteLength;if(count>32768)return false;chunks.push(decoder.decode(value,{stream:true}));}chunks.push(decoder.decode());}finally{await reader.cancel().catch(()=>{});}
 const body=JSON.parse(chunks.join(""));
 if(provider==="fal")return Array.isArray(body.prices)&&body.prices.some((p:{endpoint_id?:string;unit_price?:number;currency?:string;unit?:string})=>p.endpoint_id==="fal-ai/flux/schnell"&&p.currency==="USD"&&p.unit==="megapixel"&&typeof p.unit_price==="number"&&p.unit_price>0&&p.unit_price<=.003);
 if(provider==="stability")return typeof body.credits==="number"&&body.credits>=3;
 return typeof body.username==="string"&&body.username.length>0;
 }catch{return false;}
}
