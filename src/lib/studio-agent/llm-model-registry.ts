export type VerifiedLLMModel={providerId:string;modelId:string;verifiedAt:string;documentationUrl:string;documentationStatus:200;accountVerified:false;contextLimit:number;supportsStructuredOutput:true;supportsToolProposals:true;supportsNoReasoning:boolean;inputRateFloor:number;outputRateFloor:number};
// Public official docs GET verified on this date; not account entitlement or inference.
const models:VerifiedLLMModel[]=[
 {providerId:"openai",modelId:"gpt-6.1-terra",verifiedAt:"2026-11-22T18:07:51.640Z",documentationUrl:"https://developers.openai.com/api/docs/models/gpt-6.1-terra",documentationStatus:200,accountVerified:false,contextLimit:1050000,supportsStructuredOutput:true,supportsToolProposals:true,supportsNoReasoning:true,inputRateFloor:3000000,outputRateFloor:5000000},
 {providerId:"openai",modelId:"gpt-6-astra",verifiedAt:"2026-11-22T18:07:51.811Z",documentationUrl:"https://developers.openai.com/api/docs/models/gpt-6-astra",documentationStatus:200,accountVerified:false,contextLimit:1050000,supportsStructuredOutput:true,supportsToolProposals:true,supportsNoReasoning:false,inputRateFloor:25000000,outputRateFloor:50000000},
];
export function verifiedLLMModels(){return structuredClone(models);}
export function selectVerifiedLLMModel(providerId:string,modelId:string,now=Date.now()){
 const m=models.find(m=>m.providerId===providerId&&m.modelId===modelId);
 if(!m)throw new Error("model_not_officially_verified");
 if(now-Date.parse(m.verifiedAt)>30*86400000||Date.parse(m.verifiedAt)-now>86400000)throw new Error("model_documentation_refresh_required");
 return structuredClone(m);
}