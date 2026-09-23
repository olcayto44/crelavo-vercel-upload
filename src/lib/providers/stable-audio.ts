import { optionalEnv } from "./env";

function key(){return String(optionalEnv("STABLE_AUDIO_API_KEY")||optionalEnv("STABILITY_API_KEY")||"").trim();}
export function stableAudioConfigured(){return Boolean(key());}
export async function generateStableAudio(input:{prompt:string;durationSeconds:number}):Promise<Uint8Array>{
  const apiKey=key(); if(!apiKey) throw new Error("STABILITY_API_KEY missing on this host.");
  const form=new FormData(); form.append("prompt", input.prompt.slice(0,1000)); form.append("duration", String(Math.max(4,Math.min(15,Math.round(input.durationSeconds))))); form.append("output_format", "mp3");
  const response=await fetch("https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,Accept:"audio/mpeg"},body:form});
  if(!response.ok) throw new Error(`Stable Audio request failed: ${response.status} ${(await response.text()).slice(0,500)}`);
  return new Uint8Array(await response.arrayBuffer());
}
