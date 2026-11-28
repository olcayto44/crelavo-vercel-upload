import {z} from "zod";
import {normalizeVideoBriefUrl} from "./model-url-brief";
export const MODEL_DRAFT_BUCKET="model-private-drafts";
export const MODEL_DRAFT_MAX_BYTES=2600000;
export const ModelDraftImage=z.object({name:z.string().max(120),jpeg:z.string().min(4).max(240000).regex(/^[A-Za-z0-9+/]+={0,2}$/)}).strict();
export const ModelDraft=z.object({version:z.literal(1),model:z.literal("magi-2"),mode:z.number().int().min(0).max(3),prompt:z.string().max(1100),duration:z.number().int().min(4).max(30),ratio:z.enum(["16:9","9:16","21:9","4:3","3:4","1:1"]),audio:z.boolean(),refs:z.string().max(400),sourceUrl:z.string().max(400),productFacts:z.string().max(420),images:z.array(ModelDraftImage).max(10),rights:z.boolean()}).strict().superRefine((d,c)=>{if(d.images.length&&(d.mode===0||!d.rights||d.mode===1&&d.images.length!==1))c.addIssue({code:"custom",message:"invalid_references"});if(d.sourceUrl&&normalizeVideoBriefUrl(d.sourceUrl)!==d.sourceUrl)c.addIssue({code:"custom",message:"invalid_source"});if(d.mode===3&&d.prompt.length>650)c.addIssue({code:"custom",message:"invalid_prompt"})});
export type ModelDraftData=z.infer<typeof ModelDraft>;
export type DraftImage=z.infer<typeof ModelDraftImage>;
export function modelDraftObjectKey(userId:string){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))throw Error("invalid_owner");return userId+"/magi-2.json"}
