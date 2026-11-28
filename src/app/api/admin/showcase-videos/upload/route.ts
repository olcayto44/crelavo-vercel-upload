import { requireAdminPermission } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";
import sharp from "sharp";
export const runtime="nodejs";
const MAX=4*1024*1024;
const BUCKET="public-showcase-media";
export async function POST(request:Request){
 const access=await requireAdminPermission(request,"content");
 if(!access.ok)return access.response;
 if(Number(request.headers.get("content-length")||0)>MAX+65536)return Response.json({error:"Dosya 4 MB sınırını aşıyor. Büyük videolar için doğrulanmış medya bağlantısı kullanın."},{status:413});
 try{
  const form=await request.formData(),file=form.get("file"),kind=form.get("kind");
  if(!(file instanceof File)||!file.size||file.size>MAX||!["video","thumbnail"].includes(String(kind)))return Response.json({error:"Geçerli dosya seçin (en fazla 4 MB)."},{status:400});
  let bytes:Buffer=Buffer.from(await file.arrayBuffer()),type:string,ext:string;
  if(kind==="thumbnail"){
   if(!["image/jpeg","image/png","image/webp"].includes(file.type))return Response.json({error:"JPG, PNG veya WebP gerekli."},{status:400});
   try{const img=sharp(bytes,{limitInputPixels:25_000_000});const meta=await img.metadata();if(!["jpeg","png","webp"].includes(meta.format||""))throw Error("format");bytes=Buffer.from(await img.rotate().resize({width:1600,height:1600,fit:"inside",withoutEnlargement:true}).webp({quality:88}).toBuffer());}catch{return Response.json({error:"Görsel içeriği geçersiz."},{status:400})}
   type="image/webp";ext="webp";
  }else{
   if(file.type!=="video/mp4"||bytes.length<24||bytes.toString("ascii",4,8)!=="ftyp")return Response.json({error:"Geçerli MP4 gerekli."},{status:400});
   type="video/mp4";ext="mp4";
  }
  const db=supabaseAdmin(),key="showcase/"+crypto.randomUUID()+"."+ext;
  const bucket=await db.storage.getBucket(BUCKET);
  if(bucket.error){const created=await db.storage.createBucket(BUCKET,{public:true,fileSizeLimit:MAX,allowedMimeTypes:["image/webp","video/mp4"]});if(created.error&&!/already exists/i.test(created.error.message))throw created.error;}
  else if(!bucket.data.public)throw Error("public showcase bucket not configured");
  const result=await db.storage.from(BUCKET).upload(key,bytes,{contentType:type,upsert:false});
  if(result.error)throw result.error;
  return Response.json({url:db.storage.from(BUCKET).getPublicUrl(key).data.publicUrl,kind,fileName:file.name},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Medya kaydedilemedi. Depolama yapılandırmasını kontrol edin."},{status:503});}
}
