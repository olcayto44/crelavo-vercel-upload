import {z} from "zod";
import {renderWebsiteDesignCandidate} from "./website-design-candidate";
import {buildWebsiteSelfHostedBundle} from "./website-selfhost-bundle";
const id=z.string().uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
const Rows=z.array(z.object({productionId:id,designHash:hash,design:z.unknown()})).length(1);
// Input must originate from the authenticated owner-only settled-artifact RPC.
// No arbitrary caller payload is proof of settlement.
export function buildSettledWebsiteCandidate(raw:unknown,productionId:string){
 const [row]=Rows.parse(raw);
 if(row.productionId!==productionId)throw Error("production_mismatch");
 const rendered=renderWebsiteDesignCandidate(row.design);
 if(rendered.manifest.designHash!==row.designHash)throw Error("design_hash_mismatch");
 return buildWebsiteSelfHostedBundle({design:row.design,revision:1,catalog:[],articles:[],heroMedia:[]});
}
