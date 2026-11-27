import {CATEGORIES,getCategory} from "./crelavo/categoryCatalog";
type Query=Record<string,string|string[]|undefined>;
const first=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;
export function customerStudioPath(query:Query={}){
 const category=first(query.category)?.toLowerCase().replaceAll("-","_");
 const type=first(query.type)?.trim().toLowerCase();
 const selected=getCategory(category)||(!category&&type?CATEGORIES.find(c=>c.id===type||c.type.toLowerCase()===type||c.label.toLowerCase()===type):undefined);
 const lang=first(query.uiLang)?.toLowerCase();
 return "/dashboard/studio"+(selected?"/"+selected.id.replaceAll("_","-"):"")+(lang&&["en","tr","de","es","fr","ar"].includes(lang)?"?uiLang="+lang:"");
}
