import { Suspense } from "react";
import LocalVideoEditor from "@/components/studio/LocalVideoEditor";
export const metadata = { title: "Crelavo Studio — Video Editor", robots: { index: false, follow: false } };
export default function StudioVideoEditorPage() {
 return <main style={{ background: "#110e1b", color: "#f4f0ff", minHeight: "100dvh" }}>
  <Suspense fallback={<p>Loading editor…</p>}><LocalVideoEditor allowAnonymousLocalSave={process.env.VERCEL_ENV === "preview"} /></Suspense>
 </main>;
}
