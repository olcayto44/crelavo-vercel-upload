import "../studio-tools.css";
import LocalImageEditor from "@/components/studio/LocalImageEditor";
export const metadata = { title: "Crelavo Studio — Image Editor", robots: { index: false, follow: false } };
export default function ImageEditorPage() { return <main className="studio-tool-page"><LocalImageEditor /></main>; }
