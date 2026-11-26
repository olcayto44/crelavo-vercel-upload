import {websiteDesignPilotEnabled} from "@/lib/website-design-pilot-gate";
import {verifyWebsiteHeroMedia} from "@/lib/website-hero-media-verify";
import {buildWebsiteSelfHostedBundle} from "@/lib/website-selfhost-bundle";
import {buildWebsiteReviewBundle} from "@/lib/website-review-bundle";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"};
// Preview-only computation from caller-supplied data; never fetches tenant records
// or treats a caller-supplied snapshot as ownership or paid-delivery evidence.
export async function POST(request:Request){
 if(!websiteDesignPilotEnabled())return Response.json({ok:false},{status:404,headers});
 if(!request.headers.get("content-type")?.includes("application/json"))return Response.json({ok:false},{status:415,headers});
 try{const reader=request.body?.getReader();if(!reader)throw Error();let bytes=0,raw="";const decoder=new TextDecoder();try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1750000){await reader.cancel();return Response.json({ok:false},{status:413,headers});}raw+=decoder.decode(value,{stream:true});}}finally{reader.releaseLock();}raw+=decoder.decode();const input=JSON.parse(raw);if(!input||typeof input!=="object")throw Error();const heroMedia=await verifyWebsiteHeroMedia(input.heroMedia??[]);const selfHost=new URL(request.url).searchParams.get("format")==="selfhost";const result=selfHost?buildWebsiteSelfHostedBundle({...input,heroMedia}):buildWebsiteReviewBundle({...input,heroMedia});return new Response(new Uint8Array(result.zip).buffer,{headers:{...headers,"Content-Type":"application/zip","Content-Disposition":selfHost?'attachment; filename="crelavo-independent-website-candidate.zip"':'attachment; filename="crelavo-private-site-review.zip"'}});
 }catch{return Response.json({ok:false,code:"review_invalid"},{status:400,headers});}
}
