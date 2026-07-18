import { AdminShell } from "@/components/AdminShell";
import { AdminCategoryManager } from "@/components/AdminCategoryManager";

export default function AdminCategoriesPage() {
  return (
    <AdminShell title="Category Cards" description="Manage the production category cards, pricing/credit information and production options shown across the site.">
      <AdminCategoryManager />
    </AdminShell>
  );
}
