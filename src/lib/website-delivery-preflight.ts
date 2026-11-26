import {createHash} from "node:crypto";
import {buildWebsiteSelfHostedBundle} from "./website-selfhost-bundle";
export function inspectWebsiteDelivery(payload:unknown){
 const result=buildWebsiteSelfHostedBundle(payload);
 // Bind approval to the exact bytes, including media, runtime and setup guide.
 const sha256=createHash("sha256").update(result.zip).digest("hex");
 return {result,review:{revision:result.report.revision,designHash:result.report.designHash,sha256,bytes:result.zip.length,files:result.entries.length,coverage:result.report.moduleCoverage,releaseReady:false as const,commercialDelivery:false as const}};
}
