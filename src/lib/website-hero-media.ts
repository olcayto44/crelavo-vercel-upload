import {z} from "zod";
const encoded=z.string().min(24).max(180000).regex(/^[A-Za-z0-9+/]+={0,2}$/);
export const WebsiteHeroMedia=z.strictObject({page_slug:z.string().regex(/^[a-z][a-z0-9-]{0,48}$/),image_data:encoded,alt:z.string().trim().min(1).max(160).refine(v=>!/[<>\u0000-\u001f\u007f]/.test(v)),width:z.number().int().min(1).max(1440),height:z.number().int().min(1).max(1440),provenance:z.literal("owner_uploaded_rights_attested"),version:z.number().int().positive()});
export type WebsiteHeroMediaInput=z.infer<typeof WebsiteHeroMedia>;
export const WebsiteHeroMediaList=z.array(WebsiteHeroMedia).max(6).refine(v=>new Set(v.map(m=>m.page_slug)).size===v.length,"duplicate page media");
