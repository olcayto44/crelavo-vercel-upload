import {requireAdminPermission} from "@/lib/admin-guard";
import {supabaseAdmin} from "@/lib/supabase";
import {HOME_HERO_KEY,normalizeHeroIds,readHeroSelection} from "@/lib/home-hero-config";
import {getConfiguredShowcaseVideos} from "@/lib/showcase-video-config";
export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
export async function GET(request:Request){
 const access=await requireAdminPermission(request,"owner");if(!access.ok)return access.response;
 try{const [selection,videos]=await Promise.all([readHeroSelection(),getConfiguredShowcaseVideos()]);
 return reply({...selection,videos:videos.filter(v=>v.publishStatus==="published").map(v=>({id:v.id,title:v.title,kicker:v.kicker,orientation:v.orientation}))})
 }catch{return reply({error:"Hero ayarları okunamadı."},503)}
}
export async function POST(request:Request){
 const access=await requireAdminPermission(request,"owner");if(!access.ok)return access.response;
 const b=await request.json().catch(()=>null),ids=normalizeHeroIds(b?.ids);
 if(ids===null||!(b?.revision===null||typeof b?.revision==="string"))return reply({error:"Geçersiz seçim."},400);
 try{
 const [current,videos]=await Promise.all([readHeroSelection(),getConfiguredShowcaseVideos()]);
 if(current.revision!==b.revision)return reply({error:"Ayarlar başka bir oturumda değişti. Yeniden yükleyin."},409);
 if(ids.some(id=>!videos.some(v=>v.id===id&&v.publishStatus==="published")))return reply({error:"Yalnızca yayınlanmış videolar seçilebilir."},400);
 const db=supabaseAdmin(),row={key:HOME_HERO_KEY,value:{ids},description:"Homepage hero playlist; separate from showcase catalog",updated_at:new Date().toISOString()};
 const r=current.revision===null?await db.from("platform_configs").insert(row).select("updated_at").single():await db.from("platform_configs").update(row).eq("key",HOME_HERO_KEY).eq("updated_at",current.revision).select("updated_at").maybeSingle();
 if(r.error?.code==="23505"||(!r.error&&!r.data))return reply({error:"Ayarlar değişti. Yeniden yükleyin."},409);
 if(r.error)throw r.error;
 if(!r.data)return reply({error:"Ayarlar değişti. Yeniden yükleyin."},409);
 return reply({ids,revision:r.data.updated_at,customized:true});
 }catch{return reply({error:"Hero ayarları kaydedilemedi."},503)}
}
