import { parseAssistantStorageUrl } from "../assistant-work/storage-ownership.ts";
// Manager verifies ownership before this bounded, same-storage download.
export async function downloadAssistantVoiceReference(url: string): Promise<Blob> {
  const base = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const parsed = parseAssistantStorageUrl(url,base);
  const source = new URL(url);
  if (!parsed || source.protocol !== "https:" || source.username || source.password || source.hash) throw new Error("owned_material_required");
  const response = await fetch(url,{method:"GET",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(15000)});
  const mime = String(response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!response.ok || !response.body || !["audio/mpeg","audio/mp3","audio/wav","audio/x-wav","audio/wave","audio/mp4","audio/x-m4a","audio/ogg"].includes(mime)) { await response.body?.cancel(); throw new Error("voice_reference_download_failed"); }
  const limit = 20*1024*1024;
  if (Number(response.headers.get("content-length"))>limit) {await response.body.cancel();throw new Error("voice_reference_too_large");}
  const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit)throw new Error("voice_reference_too_large");chunks.push(value);}} finally {await reader.cancel();}
  if(!size)throw new Error("voice_reference_download_failed");
  return new Blob(chunks as BlobPart[],{type:mime});
}
