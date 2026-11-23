import LocalAssetLibrary from "@/components/studio/LocalAssetLibrary";
export const metadata = { title: "Crelavo Studio Elements", robots: { index: false, follow: false } };
export default function ElementsPage() {
 return <LocalAssetLibrary allowAnonymousLocalSave={process.env.VERCEL_ENV === "preview"} />;
}
