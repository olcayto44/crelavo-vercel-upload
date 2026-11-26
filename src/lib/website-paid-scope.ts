import type {WebsiteModuleId} from "./website-industry-scope";
import type {WebsiteDesignSpecInput} from "./website-design-schema";
export const adminWebsitePack="website_basic_admin";
const moduleFeatures:Record<string,WebsiteModuleId[]>={"product catalog":["catalog"],"order requests":["catalog","orders"],"customer accounts":["accounts"],"booking requests":["booking"],"blog cms":["cms"]};
export function paidWebsiteScope(packId:string,features:string[]):WebsiteDesignSpecInput["industryScope"]{
 if(packId!==adminWebsitePack)return undefined;
 const extra=new Set<WebsiteModuleId>(["cms","forms"]);
 for(const feature of features){const key=feature.trim().toLowerCase();if(Object.prototype.hasOwnProperty.call(moduleFeatures,key))for(const module of moduleFeatures[key])extra.add(module);}
 return {sector:"custom",extraModules:[...extra].sort()};
}
export function samePaidWebsiteScope(a:unknown,b:unknown){if(!a||!b)return !a&&!b;const x=a as {sector?:unknown;extraModules?:unknown},y=b as {sector?:unknown;extraModules?:unknown};return x.sector===y.sector&&Array.isArray(x.extraModules)&&Array.isArray(y.extraModules)&&JSON.stringify([...x.extraModules].sort())===JSON.stringify([...y.extraModules].sort());}
export function paidWebsiteScopeAllowed(packId:string,features:string[]){
 return packId===adminWebsitePack||!features.some(f=>Object.prototype.hasOwnProperty.call(moduleFeatures,f.trim().toLowerCase()));
}
