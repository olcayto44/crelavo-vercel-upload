import {cookies} from "next/headers";
import {z} from "zod";
import {ADMIN_SESSION_COOKIE,getAdminSessionPayload,getExpectedAdminEmail} from "@/lib/admin-session";
import {kieTaskStatusUrl,readKieUsage} from "@/lib/model-kie-task-contract";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"private, no-store"}});
let lastQuery=0;
export async function POST(req:Request){
 try{
 const owner=getExpectedAdminEmail(),jar=await cookies(),session=getAdminSessionPayload(jar.get(ADMIN_SESSION_COOKIE)?.value??"");
 if(!owner||session?.email!==owner||process.env.VERCEL_ENV!=="preview"||process.env.VERCEL_GIT_COMMIT_REF!=="feat/crelavo-premium-v3-20261128"||req.headers.get("origin")!==new URL(req.url).origin)return reply({error:"FORBIDDEN"},403);
 const reader=req.body?.getReader();if(!reader)return reply({error:"INVALID"},400);
 const chunks:Uint8Array[]=[];let size=0;try{for(;;){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>1024){await reader.cancel();return reply({error:"INVALID"},400)}chunks.push(v.value)}}finally{reader.releaseLock()}
 const p=z.object({taskId:z.string().regex(/^[a-zA-Z0-9_-]{1,200}$/)}).strict().safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));if(!p.success)return reply({error:"INVALID"},400);
 const key=process.env.KIE_API_KEY?.trim();if(!key)return reply({error:"KEY_MISSING"},503);
 if(Date.now()-lastQuery<2000)return reply({error:"RATE_LIMIT"},429);lastQuery=Date.now();
 const r=await fetch(kieTaskStatusUrl(p.data.taskId),{method:"GET",headers:{Authorization:"Bearer "+key,Accept:"application/json"},redirect:"error",cache:"no-store",signal:AbortSignal.timeout(8000)});
 if(!r.ok)return reply({error:"PROVIDER_UNAVAILABLE"},502);
 const usage=readKieUsage(await r.json(),p.data.taskId);
 return reply({usage});
 }catch{return reply({error:"TASK_NOT_VERIFIED"},502)}
}
