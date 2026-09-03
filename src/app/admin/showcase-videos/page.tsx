import { AdminShell } from "@/components/AdminShell";
import { AdminShowcaseVideoManager } from "@/components/AdminShowcaseVideoManager";
import { getFallbackShowcaseVideos } from "@/lib/showcase-video-config";

export default function AdminShowcaseVideosPage() {
  return <AdminShell title="Showcase Videos" description="Add, edit, publish, reorder or remove the public showcase video detail pages and their SEO metadata."><AdminShowcaseVideoManager initialVideos={getFallbackShowcaseVideos()} /></AdminShell>;
}
