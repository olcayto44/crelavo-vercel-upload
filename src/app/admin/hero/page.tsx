import { AdminHeroManager } from "@/components/AdminHeroManager";
import { AdminShell } from "@/components/AdminShell";
import { getFallbackShowcaseVideos } from "@/lib/showcase-video-config";
export default function AdminHeroPage() { return <AdminShell title="Hero yönetimi" description="Ana sayfanın büyük Hero alanında dönecek videoları seç, sırala ve kaldır."><AdminHeroManager initialVideos={getFallbackShowcaseVideos()} /></AdminShell>; }
