import { parseAssistantStorageUrl } from "../assistant-work/storage-ownership.ts";
// Ownership must be checked by the manager; this independently prevents SSRF and unbounded downloads.
export async function downloadAssistantImageReference(url: string, aspectRatio = "1:1"): Promise<Blob> {
  const base=process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const parsed=parseAssistantStorageUrl(url,base);
  if (!parsed || new URL(url).protocol !== "https:") throw new Error("owned_material_required");
  const response=await fetch(url,{method:"GET",redirect:"error",signal:AbortSignal.timeout(15000),cache:"no-store"});
  const mime=String(response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!response.ok || !response.body || !["image/png","image/jpeg","image/webp"].includes(mime)) throw new Error("reference_image_download_failed");
  const limit=10*1024*1024;
  if (Number(response.headers.get("content-length"))>limit) { await response.body.cancel(); throw new Error("reference_image_too_large"); }
  const reader=response.body.getReader(); const chunks: Uint8Array[]=[]; let size=0;
  try {
    while (true) { const {done,value}=await reader.read(); if(done)break; size+=value.byteLength; if(size>limit)throw new Error("reference_image_too_large"); chunks.push(value); }
  } finally { await reader.cancel(); }
  if (!size) throw new Error("reference_image_download_failed");
  const ratios: Record<string,[number,number]>={"16:9":[1344,768],"9:16":[768,1344],"1:1":[1024,1024]};
  const [width,height]=ratios[aspectRatio] || ratios["1:1"];
  const {default:sharp}=await import("sharp");
  const image=await sharp(Buffer.concat(chunks),{limitInputPixels:40000000}).rotate().resize(width,height,{fit:"contain",background:"#ffffff"}).png().toBuffer();
  return new Blob([new Uint8Array(image)],{type:"image/png"});
}
