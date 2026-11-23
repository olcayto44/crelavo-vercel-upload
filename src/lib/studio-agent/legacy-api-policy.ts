const transitiveQuarantine=["/api/admin/productions/debug","/api/admin/productions/force-ready","/api/admin/provider-tests","/api/preview","/api/produce/[kind]","/api/providers/readiness","/api/stability"];
// No flag enables legacy provider routes. Explicit migration is required.
const legacyPrefixes=["ads","ai-agents","assistant","assistant-chat","assistant-work","automation","apify","brand-kit","branding","bulk","chat","drone","generation","heygen","heygen-agent","lip-sync","live-sales-agent-chat","live-sales-agents","minimax","music-providers","productions","requests","website-content","website-plan","websites"];
export function legacyAPIBlocked():Response|null{return Response.json({ok:false,code:"legacy_api_quarantined",executionReady:false,safeToRetryAutomatically:false},{status:503,headers:{"Cache-Control":"no-store"}});}
export function apiQuarantined(pathname:string,environment:string|undefined){
 let normalized:string;try{normalized=decodeURIComponent(pathname).replace(/\\/g,"/");}catch{return true;}
 if(!normalized.startsWith("/api/"))return false;
 if(legacyPrefixes.includes(normalized.slice(5).split("/")[0])||transitiveQuarantine.some(p=>{const a=p.split("/"),b=normalized.split("/");return a.length===b.length&&a.every((v,i)=>v.startsWith("[")||v===b[i]);}))return true;
 if(environment!=="production")return !["/api/studio/conversation","/api/studio/website-preview","/api/auth/session","/api/auth/signout"].includes(normalized);
 return false;
}