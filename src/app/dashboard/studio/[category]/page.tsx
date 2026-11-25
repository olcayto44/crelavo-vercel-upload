import {notFound} from "next/navigation";import {getCategory} from "@/lib/crelavo/categoryCatalog";import StudioProductionPage from "../../studio-v2/page";
export const dynamic="force-dynamic";
export default async function CategoryStudio({params}:{params:Promise<{category:string}>}){const {category}=await params;if(!getCategory(category.replace(/-/g,"_")))notFound();return <StudioProductionPage/>}
