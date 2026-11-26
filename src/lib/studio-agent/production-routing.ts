import {createHash} from "node:crypto";
import {getCategory} from "@/lib/crelavo/categoryCatalog";
import {z} from "zod";
// A provider name in a catalogue never establishes runtime readiness.
export function selectProductionRoute(categoryId:string,operation:string){
 if(categoryId==="website"&&operation==="generate_website")return {id:"website-paid-ai-v1",provider:"openai",model:"gpt-6.1-terra",adapterImplemented:true,remoteProviderCostMicroUSD:null,realAI:true,fallbackAllowed:false} as const;
 if(categoryId==="website"&&operation==="generate_website_ai_copy")return {id:"website-ai-copy-v1",provider:"openai",model:"gpt-6.1-terra",adapterImplemented:true,remoteProviderCostMicroUSD:null,realAI:true,fallbackAllowed:false} as const;
 if(categoryId==="image"&&operation==="image_generate")return {id:"image-minimax-v1",provider:"minimax",model:"image-01",adapterImplemented:true,remoteProviderCostMicroUSD:null,realAI:true,fallbackAllowed:false} as const;
 return null;
}
// Evidence-only route inventory: route selection is not execution authority.
export function productionRouteInventory(categoryId:string){
 const operations=categoryId==="website"?["generate_website","generate_website_ai_copy"]:categoryId==="image"?["image_generate"]:[];
 return {categoryId,routes:operations.map(operation=>({operation,...selectProductionRoute(categoryId,operation)!,executionReady:false as const,requiresExplicitApproval:true as const,requiresVerifiedArtifact:true as const})),executionReady:false as const};
}
const quoteInput=z.strictObject({userId:z.string().uuid(),projectId:z.string().uuid(),productionId:z.string().uuid(),planHash:z.string().regex(/^[a-f0-9]{64}$/),packId:z.enum(["landing_page","business_website"]),storedCredits:z.number().int().positive(),estimatedCredits:z.number().int().positive()});
export function websiteProductionQuote(raw:unknown){
 const v=quoteInput.parse(raw);
 const pack=getCategory("website")?.packs.find(p=>p.id===v.packId);
 if(!pack||!Number.isSafeInteger(pack.credits)||pack.credits!==v.storedCredits||pack.credits!==v.estimatedCredits)throw Error("website_tariff_changed");
 const route=selectProductionRoute("website","generate_website")!;
 const quote={version:"website-quote-v1",userId:v.userId,projectId:v.projectId,productionId:v.productionId,planHash:v.planHash,packId:v.packId,credits:v.storedCredits,creditAccount:"production",routeId:route.id};
 return {quoteHash:createHash("sha256").update(JSON.stringify(quote)).digest("hex"),credits:quote.credits,packId:quote.packId,planHash:quote.planHash,creditAccount:quote.creditAccount,route,providerCostMicroUSD:null,platformOperatingCostMicroUSD:null,executionReady:false as const};
}
