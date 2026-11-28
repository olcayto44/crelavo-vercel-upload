import {magiModel} from "./ai-models";
export type MagiMode="text"|"image"|"reference";
export type MagiProvider="higgsfield"|"kie";
export const magiProviderCatalog={
 higgsfield:{label:"Higgsfield",origin:"https://api.higgsfield.ai",usdMicroPerSecond:80000,pricingSource:"https://open.higgsfield.ai/models/sand/magi-2/text-to-video/api-reference",commercialApproval:"unverified"},
 kie:{label:"Kie.ai",origin:"https://api.kie.ai",usdMicroPerSecond:null,pricingSource:"https://docs.kie.ai/market/magi-2/text-to-video",commercialApproval:"unverified"}
} as const;
export const modelRenderGate={enabled:false,reason:"provider_access_commercial_approval_and_settlement_unverified"} as const;
export function estimateMagiCost(duration:number,provider:MagiProvider){if(!Number.isInteger(duration)||duration<magiModel.minSeconds||duration>magiModel.maxSeconds)return null;const rate=magiProviderCatalog[provider].usdMicroPerSecond;return rate===null?null:duration*rate}
type ReferenceAsset={kind:"image"|"video"|"audio";url:string;bytes:number;seconds?:number;mime:string};
// Only trusted worker-owned assets may eventually enter this pure builder.
// It performs no network IO, authorization, storage, dispatch or credit mutation.
export type MagiRequest={mode:MagiMode;prompt:string;duration:number;ratio:string;audio:boolean;assets:ReferenceAsset[]};
export function buildMagiPayload(provider:MagiProvider,input:MagiRequest,approvedMediaOrigin:string){
 if(!["higgsfield","kie"].includes(provider)||!["text","image","reference"].includes(input.mode)||!Number.isInteger(input.duration)||input.duration<4||input.duration>30||!magiModel.ratios.some(r=>r===input.ratio)||typeof input.audio!=="boolean"||typeof input.prompt!=="string"||input.prompt.length>15000||!input.prompt.trim()||!Array.isArray(input.assets)||input.assets.length>20)throw Error("invalid_model_parameters");
 const origin=new URL(approvedMediaOrigin);if(origin.protocol!=="https:"||origin.origin!==approvedMediaOrigin||origin.username||origin.password)throw Error("invalid_media_origin");
 const grouped:{image:string[];video:string[];audio:string[]}={image:[],video:[],audio:[]};const seconds={video:0,audio:0};const seen=new Set<string>();
 for(const a of input.assets){if(!a||!["image","video","audio"].includes(a.kind))throw Error("invalid_reference");
 const url=new URL(a.url);if(url.origin!==origin.origin||url.username||url.password||url.hash||!url.pathname.startsWith("/model-assets/")||seen.has(url.href))throw Error("untrusted_reference");
 seen.add(url.href);
 const allowed=a.kind==="image"?["image/png","image/jpeg","image/webp"]:a.kind==="video"?["video/mp4","video/quicktime"]:["audio/mpeg","audio/wav"];
 const limit=a.kind==="image"?30000000:a.kind==="video"?200000000:15000000;
 if(!allowed.includes(a.mime)||!Number.isInteger(a.bytes)||a.bytes<=0||a.bytes>=limit)throw Error("invalid_reference");
 if(a.kind!=="image"){if(typeof a.seconds!=="number"||!Number.isFinite(a.seconds)||a.seconds<2||a.seconds>30)throw Error("invalid_reference_duration");seconds[a.kind]+=a.seconds;}
 grouped[a.kind].push(url.href);
 }
 if(grouped.image.length>10||grouped.video.length>5||grouped.audio.length>5||seconds.video>30||seconds.audio>30)throw Error("reference_limit");
 if(input.mode==="text"&&seen.size||input.mode==="image"&&(grouped.image.length!==1||grouped.video.length||grouped.audio.length)||input.mode==="reference"&&!seen.size)throw Error("reference_mode_mismatch");
 const fields={prompt:input.prompt.trim(),duration:input.duration,resolution:"1080p",aspect_ratio:input.ratio,generate_audio:input.audio};
 const model=input.mode==="text"?"text-to-video":input.mode==="image"?"image-to-video":"reference-to-video";
 const body={...fields,...(input.mode==="image"?{image_url:grouped.image[0]}:input.mode==="reference"?{...(grouped.image.length?{image_urls:grouped.image}:{}),...(grouped.video.length?{video_urls:grouped.video}:{}),...(grouped.audio.length?{audio_urls:grouped.audio}:{})}:{})};
 // Kie reference/image serialization remains intentionally unavailable until its full schemas are verified.
 if(provider==="kie"&&input.mode!=="text")throw Error("provider_schema_unverified");
 return provider==="higgsfield"?{provider,url:magiProviderCatalog.higgsfield.origin+"/sand/magi-2/"+model,body}:{provider,url:magiProviderCatalog.kie.origin+"/api/v1/jobs/createTask",body:{model:"magi-2/"+model,input:body}};
}
