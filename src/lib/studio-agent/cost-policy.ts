import {ConversationError} from "./conversation-contract";
export type CostPolicy={version:string;model:string;inputLimit:number;outputLimit:number;requestMicroUSD:number;totalMicroUSD:number;userRPM:number;systemRPM:number;inputRate:number;outputRate:number};
export function readCostPolicy():CostPolicy{
 const env=process.env;const integer=(key:string,max:number)=>{const v=Number(env[key]);if(!Number.isSafeInteger(v)||v<1||v>max)throw new ConversationError("cost_policy_missing");return v;};
 const version=env.STUDIO_AGENT_COST_POLICY_VERSION||"",model=env.STUDIO_AGENT_MODEL_SNAPSHOT||"";
 if(!/^[a-zA-Z0-9._-]{1,64}$/.test(version)||model!=="gpt-6.1-terra")throw new ConversationError("supported_model_not_configured");
 const policy={version,model,inputLimit:integer("STUDIO_AGENT_MAX_INPUT_TOKENS",16000),outputLimit:integer("STUDIO_AGENT_MAX_OUTPUT_TOKENS",1200),requestMicroUSD:integer("STUDIO_AGENT_REQUEST_MICRO_USD",50000),totalMicroUSD:integer("STUDIO_AGENT_TOTAL_MICRO_USD",1000000),userRPM:integer("STUDIO_AGENT_USER_RPM",10),systemRPM:integer("STUDIO_AGENT_SYSTEM_RPM",100),inputRate:integer("STUDIO_AGENT_INPUT_MICRO_USD_PER_MILLION",10000000),outputRate:integer("STUDIO_AGENT_OUTPUT_MICRO_USD_PER_MILLION",20000000)};
 // Conservative standard/cache-write upper bound. No fast, regional, tools, or paid cache-retention options.
 if(policy.inputRate<3000000||policy.outputRate<5000000)throw new ConversationError("provider_price_underestimated");return policy;
}
export function maximumMicroUSD(input:number,output:number,policy:CostPolicy){const cost=Math.ceil((input*policy.inputRate+output*policy.outputRate)/1000000);if(!Number.isSafeInteger(cost)||input<0||output<0||input>policy.inputLimit||output>policy.outputLimit||cost>policy.requestMicroUSD)throw new ConversationError("request_budget_exceeded",413);return cost;}