import { AdminShell } from "@/components/AdminShell";
import { AdminSampleVideoManager } from "@/components/AdminSampleVideoManager";
import { sampleVideos } from "@/lib/sample-videos";

export default function AdminSampleVideosPage() {
  return (
    <AdminShell title="Sample Output Videos" description="Manage the videos shown in the Explore sample outputs section on the homepage and sample detail pages.">
      <AdminSampleVideoManager initialVideos={sampleVideos} />
    </AdminShell>
  );
}
