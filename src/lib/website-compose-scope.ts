import {WebsiteDesignSpec} from "./website-design-schema";
import {resolveWebsiteIndustryScope} from "./website-industry-scope";
// The imported provider artifact remains immutable. This is a separate,
// owner-reviewed editable composition, not proof of implemented modules.
export function composeWebsiteScope(raw:unknown,scope:unknown){
 const design=WebsiteDesignSpec.parse(raw);
 if(!scope)return {design,requestedModules:[],scopeApplied:false as const};
 const next=WebsiteDesignSpec.parse({...design,industryScope:scope});
 const selected=next.industryScope!;
 const plan=resolveWebsiteIndustryScope(selected.sector,selected.extraModules);
 return {design:next,requestedModules:plan.modules.map(m=>m.id),scopeApplied:true as const};
}
