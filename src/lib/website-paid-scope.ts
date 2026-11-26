import type {WebsiteModuleId} from "./website-industry-scope";
import type {WebsiteDesignSpecInput} from "./website-design-schema";
export const adminWebsitePack="website_basic_admin";
const moduleFeatures:Record<string,WebsiteModuleId[]>={"product catalog":["catalog"],"order requests":["catalog","orders"],"customer accounts":["accounts"],"booking requests":["booking"],"blog cms":["cms"]};
export function paidWebsiteScope(packId:string,features:string[]):WebsiteDesignSpecInput["industryScope"]{
 if(packId!==adminWebsitePack)return undefined;
 const extra=new Set<WebsiteModuleId>(["cms","forms"]);
 for(const feature of features)for(const module of moduleFeatures[feature.trim().toLowerCase()]??[])extra.add(module);
 return {sector:"custom",extraModules:[...extra].sort()};
}
export function samePaidWebsiteScope(a:unknown,b:unknown){return JSON.stringify(a??null)===JSON.stringify(b??null);}
export function paidWebsiteScopeAllowed(packId:string,features:string[]){
 return packId===adminWebsitePack||!features.some(f=>Object.hasOwn(moduleFeatures,f.trim().toLowerCase()));
}
