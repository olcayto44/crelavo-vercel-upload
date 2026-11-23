import { Suspense } from "react";
import { StudioWebsiteV2 } from "@/components/StudioWebsiteV2";
export const dynamic = "force-dynamic";
export default function StudioV2Page() {
  return <Suspense fallback={<div style={{minHeight:"100vh",background:"#0b0912"}} />}><StudioWebsiteV2 /></Suspense>;
}
