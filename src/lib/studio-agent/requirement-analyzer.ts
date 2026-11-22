import { createBriefFieldsSchema, getCategoryContract } from "./requirements";
import type { ProviderInput } from "./conversation-contract";
import type { AdvancedState } from "./advanced-contract";
const normalize=(s:string)=>s.toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\u0131/g,"i").trim();
const escape=(s:string)=>s.replace(/[.*+?^$()|[\]\\]/g,"\\$&");
const aliases:Record<string,string[]>={
 english:["in english","ingilizce"],turkish:["in turkish","turkce"],german:["in german","almanca"],french:["in french","fransizca"],spanish:["in spanish","ispanyolca"],arabic:["in arabic","arapca"],
 landing_page:["landing page","tanitim sayfasi"],service_business_website:["service website","hizmet sitesi"],corporate_website:["corporate website","kurumsal site"],portfolio_website:["portfolio website","portfolyo sitesi"],
 preview_first:["preview only","only preview","yalnizca onizleme"],preview_source_files:["preview and source files","preview plus source files"],
 "16x9":["16:9","horizontal","yatay"],"9x16":["9:16","vertical","dikey"],"1x1":["1:1","square","kare"],
 "8_seconds":["8 seconds","8 saniye"],"15_seconds":["15 seconds","15 saniye"],
 instrumental_bgm:["instrumental music","background music","fon muzigi"],ai_voice_over:["voice over","voice-over","seslendirme"],no_music:["no music","muziksiz"],
 prompt_to_video:["text to video","text-to-video","metinden video"],image_to_video:["image to video","image-to-video","gorselden video"],voice_to_video:["audio to video","sesten video"],
};
// Deliberately bounded rules: exact labeled clauses plus catalog choices and a few
// documented conversational patterns. Unknown prose is never invented as facts.
export function analyzeMockInput(input:ProviderInput){
 const c=getCategoryContract(input.project.categoryId),message=input.message,lower=normalize(message);
 const patch:Record<string,string>={},evidence:Record<string,string>={},conflicts:AdvancedState["conflicts"]=[];
 const add=(id:string,value:string,quote:string)=>{if(createBriefFieldsSchema(c.id).safeParse({[id]:value}).success){patch[id]=value;evidence[id]=quote.slice(0,1000);}};
 for(const f of c.fields.filter(f=>!f.serverOnly&&f.kind!=="references")){
  const clauses=message.split(/[\n;]/),explicit=clauses.map(line=>({line,match:line.match(/^\s*([^:]+)\s*:\s*(.+)$/)})).filter(x=>x.match&&[normalize(f.id),normalize(f.label)].includes(normalize(x.match[1])));
  if(explicit.length){
   const values=explicit.map(x=>x.match![2].trim()).map(value=>f.kind==="select"?f.options.find(o=>[normalize(o),normalize(o.replace(/_/g," ")),...(aliases[o]||[])].includes(normalize(value)))||value:value);
   const unique=[...new Set(values)];if(unique.length>1){conflicts.push({fieldId:f.id,values:unique.map(v=>v.slice(0,1000)).slice(0,20)});continue;}
   add(f.id,values[0],explicit[0].line.trim());continue;
  }
  if(f.kind==="select"){
   const preferred=lower.includes("instead of")?lower.split("instead of")[0]:lower.includes("yerine")?lower.split("yerine").at(-1)!:lower;
   const found=f.options.filter(option=>[normalize(option),normalize(option.replace(/_/g," ")),...(aliases[option]||[])].some(v=>new RegExp("(?:^|[\\s,;.])"+escape(v)+"(?:$|[\\s,;.!])").test(preferred)));
   if(found.length===1)add(f.id,found[0],message.slice(0,1000));
   if(found.length>1)conflicts.push({fieldId:f.id,values:found.slice(0,20)});
  }
 }
 if(c.id==="website"&&!patch.business_name){const m=message.match(/(?:business|company|brand) name (?:is|to)\s+([^.;\n,]+)/i)||message.match(/(?:website|site) for\s+([^.;\n,]+)/i);if(m)add("business_name",m[1].trim(),m[0]);}
 const idea=/\b(?:create|build|make|prepare|want|need)\b/.test(lower)&&/\b(?:website|site|app|video|image|poster|campaign|brand|document|lesson|project|animation|story|voice|avatar|series)\b/.test(lower);
 if(idea&&!input.project.snapshot.fields.brief&&!patch.brief)add("brief",message,message.slice(0,1000));
 return {patch,evidence,conflicts};
}