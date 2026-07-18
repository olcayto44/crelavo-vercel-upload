import { AdminDeliveryCreditRatesManager } from "@/components/AdminDeliveryCreditRatesManager";
import { AdminShell } from "@/components/AdminShell";

export default function AdminDeliveryCreditRatesPage() {
  return (
    <AdminShell title="Delivery Credit Rates" description="Manage extra credit rates for file delivery options such as ZIP, source code, README, subtitles, 4K export and editable files.">
      <AdminDeliveryCreditRatesManager />
    </AdminShell>
  );
}
