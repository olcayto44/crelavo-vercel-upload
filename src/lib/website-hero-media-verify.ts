import sharp from "sharp";
import {WebsiteHeroMediaList,type WebsiteHeroMediaInput} from "./website-hero-media";
// Never fetch external URLs. Bound bytes and decoded pixels; reject mismatched or animated media.
export async function verifyWebsiteHeroMedia(raw:unknown):Promise<WebsiteHeroMediaInput[]>{
 const items=WebsiteHeroMediaList.parse(raw);
 for(const item of items){
  const bytes=Buffer.from(item.image_data,"base64");
  if(bytes.length>135000||bytes.toString("base64")!==item.image_data||bytes.subarray(0,4).toString()!=="RIFF"||bytes.subarray(8,12).toString()!=="WEBP")throw Error("invalid_media_bytes");
  const image=sharp(bytes,{limitInputPixels:1440*1440,failOn:"error"});
  const metadata=await image.metadata();
  if(metadata.format!=="webp"||metadata.width!==item.width||metadata.height!==item.height||(metadata.pages??1)!==1)throw Error("invalid_media_metadata");
  await image.raw().toBuffer(); // Verify the actual image decodes within the pixel limit.
 }
 return items;
}
