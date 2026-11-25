import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";import {renderWebsiteDesignCandidate} from "@/lib/website-design-candidate";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"};
export async function POST(request:Request){
 if(!websiteDesignPilotEnabled())return Response.json({ok:false},{status:404,headers});
 if(!request.headers.get("content-type")?.includes("application/json"))return Response.json({ok:false},{status:415,headers});
 try{const reader=request.body?.getReader();if(!reader)throw Error();let size=0;const decoder=new TextDecoder();let raw="";while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>48000){await reader.cancel();return Response.json({ok:false},{status:413,headers});}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();const result=renderWebsiteDesignCandidate(JSON.parse(raw));const css=result.files.find(f=>f.path==="styles.css")!.content;const html=result.files.filter(f=>f.path.endsWith(".html")).map(f=>({path:f.path,content:f.content.replace('<link rel="stylesheet" href="./styles.css">',()=>"<style>"+css+"</style>")}));return Response.json({ok:true,pages:html,manifest:result.manifest},{headers});}catch{return Response.json({ok:false,code:"invalid_design"},{status:400,headers});}
}
