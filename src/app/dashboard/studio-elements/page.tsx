import "../studio-tools.css";
import LocalAssetLibrary from "@/components/studio/LocalAssetLibrary";
export const metadata = { title: "Crelavo Studio Elements", robots: { index: false, follow: false } };
export default function ElementsPage() {
 return <main className="studio-tool-page"><LocalAssetLibrary allowAnonymousLocalSave={false} cloudSyncEnabled={false} /></main>;
}
