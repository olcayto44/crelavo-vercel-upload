import { AdminShell } from "@/components/AdminShell";
import { AdminInbox } from "@/components/AdminInbox";
import { supabaseAdmin } from "@/lib/supabase";
import type { AdminInboxRow } from "@/lib/admin-inbox";

export const dynamic = "force-dynamic";

export default async function AdminInboxPage() {
  let rows: AdminInboxRow[] = [];
  let errorMessage: string | undefined;
  try {
    const { data, error } = await supabaseAdmin().from("lead_captures").select("id,email,source,offer,status,ip_address,page_url,landing_url,referrer,utm_source,utm_campaign,metadata,created_at").order("created_at", { ascending: false }).limit(300);
    if (error) errorMessage = "Veri bağlantısını veya admin yapılandırmasını kontrol edip yeniden dene.";
    else rows = (data ?? []) as AdminInboxRow[];
  } catch {
    errorMessage = "Veri bağlantısı şu anda kullanılamıyor. Admin yapılandırmasını kontrol edip yeniden dene.";
  }
  return <AdminShell title="Gelen kutusu" description="İletişim, destek ve lead kayıtlarını ara; mesajı açarak tüm ayrıntıları incele."><AdminInbox rows={rows} errorMessage={errorMessage} /></AdminShell>;
}
