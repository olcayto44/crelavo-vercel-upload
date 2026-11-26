import {z} from "zod";
import {WebsiteDesignSpec,defaultWebsiteResponsiveSettings} from "./website-design-schema";
export const WebsiteRevisionCommand=z.discriminatedUnion("op",[
 z.strictObject({op:z.literal("palette"),value:z.enum(["ink","sand","forest"])}),
 z.strictObject({op:z.literal("layout"),value:z.enum(["editorial","gallery","service"])}),
 z.strictObject({op:z.literal("headline"),page:z.string(),value:z.string().min(1).max(100)}),
 z.strictObject({op:z.literal("lead"),page:z.string(),value:z.string().min(1).max(320)}),
 z.strictObject({op:z.literal("section"),page:z.string(),heading:z.string().min(1).max(80),body:z.string().min(1).max(700)}),
 z.strictObject({op:z.literal("pageSeo"),page:z.string(),title:z.string().min(1).max(70),description:z.string().min(1).max(160)}),
 z.strictObject({op:z.literal("replaceSection"),page:z.string(),index:z.number().int().min(0).max(4),heading:z.string().min(1).max(80),body:z.string().min(1).max(700)}),
 z.strictObject({op:z.literal("moveSection"),page:z.string(),from:z.number().int().min(0).max(4),to:z.number().int().min(0).max(4)}),
 z.strictObject({op:z.literal("headingSize"),device:z.enum(["mobile","tablet","desktop"]),value:z.number().int().min(24).max(96)})
]);
export const WebsiteRevisionProposal=z.strictObject({expectedRevision:z.number().int().nonnegative(),commands:z.array(WebsiteRevisionCommand).min(1).max(10)});
// Pure application to the exact current design; never mutates a saved project,
// calls a provider, changes ownership, publishes or spends credits.
export function applyWebsiteRevision(current:unknown,revision:number,raw:unknown){
 const d=WebsiteDesignSpec.parse(current),p=WebsiteRevisionProposal.parse(raw);
 if(!Number.isSafeInteger(revision)||p.expectedRevision!==revision||revision>=Number.MAX_SAFE_INTEGER)throw Error("stale_revision");
 for(const command of p.commands){
 if(command.op==="palette"){d.palette=command.value;continue;}
 if(command.op==="layout"){d.layout=command.value;continue;}
 if(command.op==="headingSize"){d.responsive??=structuredClone(defaultWebsiteResponsiveSettings);d.responsive[command.device]={...d.responsive[command.device],headingSize:command.value} as never;continue;}
 const page=d.pages.find(v=>v.slug===command.page);if(!page)throw Error("unknown_page");
 if(command.op==="headline")page.headline=command.value;
 if(command.op==="lead")page.lead=command.value;
 if(command.op==="section")page.sections.push({heading:command.heading,body:command.body});
 if(command.op==="pageSeo"){page.title=command.title;page.description=command.description;}
 if(command.op==="replaceSection"){const previous=page.sections[command.index];if(!previous)throw Error("unknown_section");page.sections[command.index]={...previous,heading:command.heading,body:command.body};}
 if(command.op==="moveSection"){if(command.from>=page.sections.length||command.to>=page.sections.length)throw Error("unknown_section");const [section]=page.sections.splice(command.from,1);page.sections.splice(command.to,0,section);}
 }
 const next=WebsiteDesignSpec.parse(d);
 if(JSON.stringify(next)===JSON.stringify(WebsiteDesignSpec.parse(current)))throw Error("no_changes");
 return {design:next,revision:revision+1,publicationReady:false as const};
}
// Explicit local command examples only, not a natural-language AI service.
// Unknown/ambiguous instructions fail rather than silently choosing a change.
export function parseWebsiteDemoRequest(message:string,revision:number,page:string="home"){
 if(message.length>1500)throw Error("request_too_long");
 const commands:z.infer<typeof WebsiteRevisionCommand>[]=[];
 for(const line of message.split(/\r?\n/).map(v=>v.trim()).filter(Boolean)){
 const [key,...rest]=line.split(":");const value=rest.join(":").trim(),k=key.trim().toLocaleLowerCase("tr-TR");
 if(k==="renk"&&["koyu","açık","yeşil"].includes(value.toLocaleLowerCase("tr-TR"))){commands.push({op:"palette",value:({"koyu":"ink","açık":"sand","yeşil":"forest"} as const)[value.toLocaleLowerCase("tr-TR") as "koyu"|"açık"|"yeşil"]});continue;}
 if(k==="tasarım"&&["editoryal","galeri","hizmet"].includes(value.toLocaleLowerCase("tr-TR"))){commands.push({op:"layout",value:({"editoryal":"editorial","galeri":"gallery","hizmet":"service"} as const)[value.toLocaleLowerCase("tr-TR") as "editoryal"|"galeri"|"hizmet"]});continue;}
 if(k==="başlık"&&value){commands.push({op:"headline",page,value});continue;}
 if(k==="açıklama"&&value){commands.push({op:"lead",page,value});continue;}
 if(k==="bölüm"&&value.includes("|")){const [heading,body,...extra]=value.split("|").map(s=>s.trim());if(extra.length)throw Error("unsupported_command");commands.push({op:"section",page,heading,body});continue;}
 throw Error("unsupported_command");
 }
 return WebsiteRevisionProposal.parse({expectedRevision:revision,commands});
}
