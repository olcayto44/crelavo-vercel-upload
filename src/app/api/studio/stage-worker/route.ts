import {timingSafeEqual} from "node:crypto";
import {stageEnvironment} from "@/lib/studio-agent/stage-environment";
import {workerStageTick} from "@/lib/studio-agent/stage-service";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=120;
export async function GET(request:Request){
 const expected=process.env.CRON_SECRET?.trim(),actual=request.headers.get("authorization")??"",wanted="Bearer "+expected;
 if(!expected||Buffer.byteLength(actual)!==Buffer.byteLength(wanted)||!timingSafeEqual(Buffer.from(actual),Buffer.from(wanted)))return Response.json({ok:false},{status:401});
 const e=stageEnvironment();if(!e)return Response.json({ok:false,code:"worker_disabled"},{status:503});
 try{return Response.json({ok:true,...await workerStageTick(e)},{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({ok:false,code:"worker_unconfirmed"},{status:503});}
}
