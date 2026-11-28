import {CATEGORIES} from "./crelavo/categoryCatalog";
import {categoryLanguagePaths} from "./category-global-content";
import {isRetiredCategoryPath} from "./retired-categories";
const origin="https://www.crelavo.com";
const languages=["en-US","tr-TR","de-DE","fr-FR","zh-Hans"] as const;
export const seoAuditLanguages=languages;
export function auditPublicSitemap(entries:readonly {url:string;alternates?:{languages?:Record<string,string|undefined>}}[]|null){
 const seen=new Map<string,{url:string;alternates?:{languages?:Record<string,string|undefined>}}>(),invalid:string[]=[],privatePaths:string[]=[],retired:string[]=[],duplicates:string[]=[],noncanonical:string[]=[];
 for(const entry of entries??[]){
  try{const u=new URL(entry.url);if(u.origin!==origin||u.search||u.hash){noncanonical.push(entry.url);continue;}const path=u.pathname.replace(/\/+$/,"")||"/";if(/^\/(admin|api|dashboard|auth|wp-admin)(\/|$)/.test(path))privatePaths.push(path);if(isRetiredCategoryPath(path))retired.push(path);if(seen.has(path))duplicates.push(path);else seen.set(path,entry);}catch{invalid.push(entry.url);}
 }
 const rows=CATEGORIES.map(c=>{const paths=categoryLanguagePaths(c.id);return {id:c.id,label:c.label,languages:languages.map(lang=>{const path=paths[lang];const entry=path?seen.get(path):undefined;const expected=Object.entries(paths).map(([tag,p])=>[tag,new URL(p,origin).href]);const reciprocal=!!entry&&expected.every(([tag,url])=>entry.alternates?.languages?.[tag]===url);return{lang,path:path??null,present:entries===null?null:!!entry,reciprocal:entries===null||!entry?null:reciprocal};})};});
 const cells=rows.flatMap(r=>r.languages);
 return{available:entries!==null,total:entries?.length??null,unique:entries===null?null:seen.size,expected:cells.length,present:entries===null?null:cells.filter(c=>c.present).length,reciprocal:entries===null?null:cells.filter(c=>c.reciprocal).length,invalid,privatePaths,retired,duplicates,noncanonical,rows};
}
