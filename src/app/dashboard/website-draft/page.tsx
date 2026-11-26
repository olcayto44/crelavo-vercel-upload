import Link from "next/link";
import WebsiteDraftWorkspace from "./WebsiteDraftWorkspace";
export const metadata={title:"Website Studio — Özel taslak",robots:{index:false,follow:false}};
export default function WebsiteDraftPage(){return <main style={{padding:"20px",background:"#110e1b",color:"#f4f0ff",minHeight:"100vh"}}><h1>Website Studio</h1><p>Hesabınıza özel tasarım taslağı. Sayfaları, responsive görünümü ve SEO ayarlarını düzenleyin ve kaydedin. Bu alan ücretli AI üretimi, yayınlama veya ticari ZIP teslimatı yapmaz.</p><Link href="/dashboard/website-builder">Üretim ve teslimat ekranı</Link><WebsiteDraftWorkspace/></main>;}
