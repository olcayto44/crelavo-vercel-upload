import Link from "next/link";
import WebsiteDraftWorkspace from "./WebsiteDraftWorkspace";
export const metadata={title:"Website Studio",robots:{index:false,follow:false}};
export default async function WebsiteDraftPage({searchParams}:{searchParams:Promise<{projectId?:string|string[]}>}){
 const params=await searchParams,projectId=typeof params.projectId==="string"?params.projectId:undefined;
 return <main style={{padding:"20px",background:"#110e1b",color:"#f4f0ff",minHeight:"100vh"}}><h1>Website Studio</h1><p>{projectId?"Üretilmiş sitenizi düzenleyin, kaydedin, önceki sürümü geri yükleyin ve kaynak dosyalarını indirin. Crelavo sitenizi internette yayınlamaz.":"Hesabınıza özel tasarım taslağı. Sayfaları, responsive görünümü ve SEO ayarlarını düzenleyin ve kaydedin."}</p><Link href="/dashboard/website-builder">Üretim ve teslimat ekranı</Link><WebsiteDraftWorkspace projectId={projectId}/></main>;
}
