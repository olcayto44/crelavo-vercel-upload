// Explicit preview branch allowlist shared by all Website pilot entry points.
export const websiteCommercialAcceptanceBranch = "feat/studio-stage-image-20261127";
export function websitePilotBranchAllowed(branch:string|undefined){
 return ["feat/central-production-dispatch-20261125","release/commercial-five-track-20261126",websiteCommercialAcceptanceBranch].includes(branch??"");
}
