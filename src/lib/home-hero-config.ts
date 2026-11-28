import {supabaseAdmin} from "@/lib/supabase";
export const HOME_HERO_KEY="homepage_hero_selection_v1";
export const DEFAULT_HOME_HERO_IDS=["crelavo-giant-fashion-city"];
export function normalizeHeroIds(value:unknown):string[]|null{
 if(!Array.isArray(value)||value.length>12||value.some(x=>typeof x!=="string"||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(x)||x.length>160))return null;
 const ids=value as string[];return new Set(ids).size===ids.length?ids:null;
}
export async function readHeroSelection(){
 const r=await supabaseAdmin().from("platform_configs").select("value,updated_at").eq("key",HOME_HERO_KEY).maybeSingle();
 if(r.error)throw r.error;
 if(!r.data)return {ids:DEFAULT_HOME_HERO_IDS,revision:null as string|null,customized:false};
 const ids=normalizeHeroIds(r.data.value?.ids);if(ids===null)throw Error("Invalid hero configuration");
 return {ids,revision:String(r.data.updated_at),customized:true};
}
export async function publicHeroSelection(){try{return await readHeroSelection()}catch{return {ids:DEFAULT_HOME_HERO_IDS,revision:null,customized:false}}}
