import type { AssistantPlan } from "./plan-signature.ts";
import type { LegacyRoute } from "./legacy-provider-route";
export type ProductionChainStep = {id:string;kind:"video"|"voiceover"|"music"|"subtitles"|"assembly";dependsOn:string[];prompt?:string;durationSeconds?:number;provider?:string;status:"planned"};
export type ProductionChain = {version:1;status:"requires_execution_adapter";durationSeconds:number;steps:ProductionChainStep[];automaticRetry:false;statusMayDispatch:false};
export function productionDurationSeconds(value: unknown, fallback=5) {
  if (value == null || String(value).trim()==="") return fallback;
  const text=String(value).trim().toLowerCase();
  const match=text.match(/^(\d+(?:\.\d+)?)\s*(s|sec|seconds?|sn|saniye|m|min|minutes?|dk|dakika)?$/);
  if(!match)throw new Error("production_duration_invalid");
  const seconds=Number(match[1]) * (/^(m|min|minute|minutes|dk|dakika)$/.test(match[2] || "")?60:1);
  if(!Number.isFinite(seconds) || seconds<=0 || seconds>600 || !Number.isInteger(seconds))throw new Error("production_duration_invalid");
  return seconds;
}
export function buildProductionChain(route: LegacyRoute | undefined, extras: Record<string,string>, plan: AssistantPlan): ProductionChain | undefined {
  if(route?.kind!=="video" || !["minimax","runway","fal","kling","replicate"].includes(route.provider))return;
  const duration=productionDurationSeconds(extras.duration);
  const speech=Boolean(plan.spokenScript.trim());
  const sound=String(extras.sound || "none");
  const music=!["none","silent","no_audio","no_music","provider_audio"].includes(sound);
  const subtitles=["true","on","yes","burn_in"].includes(String(extras.subtitles || "").toLowerCase());
  if(duration<=15 && !speech && !music && !subtitles)return;
  const steps:ProductionChainStep[]=[];
  // Until a reviewed shot script exists, keep the original direction intact, not fabricated story beats.
  let remaining=duration,index=1;
  while(remaining>0){let length=Math.min(15,remaining);if(remaining>15 && remaining-15<5)length=remaining-5;if(length<5)throw new Error("production_segment_duration_invalid");steps.push({id:"video-"+index++,kind:"video",dependsOn:[],prompt:plan.visualDirection,durationSeconds:length,provider:route.provider,status:"planned"});remaining-=length;}
  if(speech)steps.push({id:"voiceover",kind:"voiceover",dependsOn:[],prompt:plan.spokenScript,status:"planned"});
  if(music)steps.push({id:"music",kind:"music",dependsOn:[],prompt:sound,status:"planned"});
  if(subtitles)steps.push({id:"subtitles",kind:"subtitles",dependsOn:speech?["voiceover"]:steps.filter(step=>step.kind==="video").map(step=>step.id),status:"planned"});
  steps.push({id:"assembly",kind:"assembly",dependsOn:steps.map(step=>step.id),status:"planned"});
  return {version:1,status:"requires_execution_adapter",durationSeconds:duration,steps,automaticRetry:false,statusMayDispatch:false};
}
