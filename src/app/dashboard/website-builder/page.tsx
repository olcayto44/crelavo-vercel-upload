import { Suspense } from "react";
import { WebsiteBuilderForm } from "@/components/WebsiteBuilderForm";
export default function WebsiteBuilderPage() {
 return <main style={{minHeight:"100vh",background:"#0c0914",color:"#f5f0ff",padding:"24px 16px"}}>
  <div style={{maxWidth:1200,margin:"0 auto"}}>
   
   <h1 style={{fontSize:23,margin:"0 0 10px"}}>Website Builder — üretim ve teslimat</h1>
   <Suspense fallback={null}><WebsiteBuilderForm /></Suspense>
  </div>
 </main>;
}
