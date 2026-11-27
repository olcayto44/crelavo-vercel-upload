import {z} from "zod";
import {WebsiteDesignSpec} from "./website-design-schema";
export const WebsiteAdminPageEdit=z.strictObject({title:z.string().trim().min(1).max(70),description:z.string().trim().min(1).max(160),headline:z.string().trim().min(1).max(100),lead:z.string().trim().min(1).max(320)});
export function editWebsiteAdminPage(raw:unknown,slug:string,fields:unknown){
 const design=WebsiteDesignSpec.parse(raw),patch=WebsiteAdminPageEdit.parse(fields);
 if(!design.pages.some(p=>p.slug===slug))throw Error("page_not_found");
 return WebsiteDesignSpec.parse({...design,pages:design.pages.map(p=>p.slug===slug?{...p,...patch}:p)});
}
