import {createHash} from "node:crypto";
import {z} from "zod";
import {estimateMagiCost,type MagiProvider} from "./model-production-contract";
import {preflightModelJob,type VerifiedModelAsset} from "./model-media-contract";
export const ModelJobInput=z.object({
 requestKey:z.string().uuid(),modelId:z.literal("magi-2"),provider:z.enum(["higgsfield","kie"]),
 mode:z.enum(["text","image","reference"]),prompt:z.string().trim().min(1).max(15000),
 duration:z.number().int().min(4).max(30),ratio:z.enum(["16:9","9:16","21:9","4:3","3:4","1:1"]),
 audio:z.boolean(),assetIds:z.array(z.string().uuid()).max(20)
}).strict().superRefine((v,c)=>{if(new Set(v.assetIds).size!==v.assetIds.length)c.addIssue({code:"custom",message:"duplicate_asset"})});
export type ModelJobPlanInput=z.infer<typeof ModelJobInput>;
export function prepareBlockedModelJob(owner:string,raw:unknown,assets:VerifiedModelAsset[]){
 const input=ModelJobInput.parse(raw);
 const byId=new Map(assets.map(a=>[a.id,a]));
 if(byId.size!==assets.length||assets.length!==input.assetIds.length)throw Error("asset_mismatch");
 const ordered=input.assetIds.map(id=>{const a=byId.get(id);if(!a)throw Error("asset_missing");return a});
 const {requestKey,modelId,provider,assetIds,...settings}=input;
 const preflight=preflightModelJob(owner,provider,settings,ordered,"https://media.crelavo.com");
 const plan={version:1,...settings,assetIds,assetDigests:ordered.map(a=>a.sha256)};
 const planHash=createHash("sha256").update(JSON.stringify(plan)).digest("hex");
 return {requestKey,modelId,provider,plan,planHash,estimate:estimateMagiCost(input.duration,provider as MagiProvider),preflight};
}
