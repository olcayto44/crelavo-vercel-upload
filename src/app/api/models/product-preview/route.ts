import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
import {supportedProductUrl,parseProductMetadata} from "@/lib/model-product-metadata";
import {retrieveProductHtml} from "@/lib/model-product-fetch";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const recent=new Map<string,{count:number;until:number}>();
let active=0;
function permit(id:string){const now=Date.now();for(const [key,r] of recent)if(r.until<=now)recent.delete(key);if(recent.size>=2000&&!recent.has(id))return false;const r=recent.get(id)??{count:0,until:now+60000};if(r.count>=3)return false;r.count++;recent.set(id,r);return true;}
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(req:Request){
 const token=bearerTokenFromRequest(req);if(!token)return reply({error:"SIGN_IN"},401);
 if(req.headers.get("origin")!==new URL(req.url).origin)return reply({error:"INVALID_ORIGIN"},403);
 if(Number(req.headers.get("content-length")??0)>2048)return reply({error:"INVALID_INPUT"},400);
 try{
 const {data,error}=await supabaseAdmin().auth.getUser(token);if(error||!data.user)return reply({error:"SIGN_IN"},401);
 const reader=req.body?.getReader();if(!reader)return reply({error:"INVALID_INPUT"},400);
 let size=0;const chunks:Uint8Array[]=[];for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>2048){await reader.cancel();return reply({error:"INVALID_INPUT"},400)}chunks.push(r.value)}
 const b=JSON.parse(Buffer.concat(chunks).toString("utf8"));if(typeof b.url!=="string"||b.authorized!==true)return reply({error:"INVALID_INPUT"},400);
 const url=supportedProductUrl(b.url);if(!url)return reply({error:"UNSUPPORTED_LINK"},422);
 if(active>=5||!permit(data.user.id))return reply({error:"RATE_LIMIT"},429);
 active++;try{const html=await retrieveProductHtml(url),metadata=parseProductMetadata(html,url.href);if(!metadata.title)return reply({error:"UNAVAILABLE"},422);return reply({metadata,verified:false,renderingEnabled:false})}finally{active--}
 }catch{return reply({error:"UNAVAILABLE"},422)}
}
