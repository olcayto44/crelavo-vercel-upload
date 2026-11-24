import "server-only";
import { executePaidWebsiteProduction } from "@/lib/assistant-work/website-paid-production";
import { centralWebsiteAdapterEnabled, dispatchWebsiteAdapter } from "./production-adapter";

// Intentionally not reachable from an API or assistant tool executor yet.
// A future authenticated orchestrator must derive the context/binding from storage.
export function executeCentralWebsiteAdapter(action:unknown, serverContext:unknown, persistedBinding:unknown){
 return dispatchWebsiteAdapter(action,serverContext,persistedBinding,{enabled:()=>centralWebsiteAdapterEnabled(),execute:executePaidWebsiteProduction});
}
