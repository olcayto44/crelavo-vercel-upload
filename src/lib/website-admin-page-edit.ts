import {z} from "zod";
import {WebsiteDesignSpec} from "./website-design-schema";
export const WebsiteAdminPageEdit=z.strictObject({title:z.string().trim().min(1).max(70),description:z.string().trim().min(1).max(160),headline:z.string().trim().min(1).max(100),lead:z.string().trim().min(1).max(320),nav:z.string().trim().min(1).max(40).optional(),sections:z.array(z.strictObject({heading:z.string().trim().min(1).max(80),body:z.string().trim().min(1).max(700),hiddenOn:z.array(z.enum(["mobile","tablet","desktop"])).optional()})).min(1).max(5).optional(),faq:z.array(z.strictObject({question:z.string().trim().min(1).max(120),answer:z.string().trim().min(1).max(500)})).max(5).optional()});
export function editWebsiteAdminPage(raw:unknown,slug:string,fields:unknown){
 const design=WebsiteDesignSpec.parse(raw),patch=WebsiteAdminPageEdit.parse(fields);
 if(!design.pages.some(p=>p.slug===slug))throw Error("page_not_found");
 return WebsiteDesignSpec.parse({...design,pages:design.pages.map(p=>p.slug===slug?{...p,...patch}:p)});
}
