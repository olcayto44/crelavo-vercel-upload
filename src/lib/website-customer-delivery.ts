// Shared fail-closed customer delivery and administration contract.
export function websiteHasAdminPackage(output:any){return output?.websiteAssistant?.packId==="website_basic_admin"&&Boolean(output?.plan?.approvedIndustryScope);}
export function websiteDeliveryVersion(output:any){return {version:Number(output?.websiteDesignVersion??1),cmsVersion:Number(output?.websiteCMSVersion??0)};}
export function websiteDeliveryVersionMatches(output:any,params:URLSearchParams){
 const v=websiteDeliveryVersion(output);
 return (!params.has("version")||params.get("version")===String(v.version))&&(!params.has("cmsVersion")||params.get("cmsVersion")===String(v.cmsVersion));
}
