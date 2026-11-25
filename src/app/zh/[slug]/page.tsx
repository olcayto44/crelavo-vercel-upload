import {notFound} from "next/navigation";
import {globalCategoryId,globalCategoryProfiles} from "@/lib/category-global-content";
import {globalCategoryMeta,localizedCategoryVisibility} from "@/lib/category-global-meta";
import {GlobalCategoryPage} from "@/components/GlobalCategoryPage";
export const dynamic="force-dynamic";
export function generateStaticParams(){return Object.values(globalCategoryProfiles).map(p=>({slug:p.zh.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const id=globalCategoryId("zh",slug);return id?globalCategoryMeta(id,"zh"):{}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const id=globalCategoryId("zh",slug);if(!id||(await localizedCategoryVisibility(id)).draft)notFound();return <GlobalCategoryPage id={id} locale="zh"/>}
