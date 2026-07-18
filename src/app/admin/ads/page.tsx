import { AdminAdSlotManager } from "@/components/AdminAdSlotManager";
import { AdminShell } from "@/components/AdminShell";
import { defaultAdSlots } from "@/lib/ad-config";

export default function AdminAdsPage() {
  return (
    <AdminShell title="Ad slots" description="Manage ad code, size, preview, active/passive/paused states, campaign promo copy and visible site placements.">
      <section className="card admin-wide-card">
        <span className="badge">Ad management</span>
        <h3>Ad slot code, campaign promo and sizes</h3>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Each ad slot can use safe static sponsor HTML or campaign promo JSON. Script, iframe, javascript URLs and hacklink patterns are blocked server-side before public rendering.</p>
        <AdminAdSlotManager initialSlots={defaultAdSlots} />
      </section>
    </AdminShell>
  );
}
