import "./video-workspace.css";
import { Suspense } from "react";
import LocalVideoEditor from "@/components/studio/LocalVideoEditor";
export const metadata = { title: "Crelavo Studio — Video Editor", robots: { index: false, follow: false } };
export default function StudioVideoEditorPage() {
 return <main className="studio-tool-page">
  <Suspense fallback={<p>Loading editor…</p>}><LocalVideoEditor allowAnonymousLocalSave={process.env.VERCEL_ENV === "preview"} /></Suspense>
 </main>;
}
