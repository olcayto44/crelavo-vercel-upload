import { AdminShell } from "@/components/AdminShell";
import { AdminBlogManager } from "@/components/AdminBlogManager";
export default function AdminBlogPage() {
  return <AdminShell title="Blog / SEO yazıları" description="Yazı ekle, taslak kaydet, SEO alanlarını düzenle ve yayınla. Mevcut rehberler korunur."><AdminBlogManager /></AdminShell>;
}
