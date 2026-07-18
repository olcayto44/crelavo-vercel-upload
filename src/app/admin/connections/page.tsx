import { AdminShell } from "@/components/AdminShell";
import { supabaseAdmin } from "@/lib/supabase";

async function loadConnectionData() {
  const supabase = supabaseAdmin();
  const [ads, stores, jobs] = await Promise.all([
    supabase.from("connected_ad_accounts").select("id, user_id, platform, account_name, external_account_id, status, created_at, updated_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("connected_commerce_stores").select("id, user_id, platform, store_name, store_url, external_store_id, status, created_at, updated_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("ad_campaign_jobs").select("id, user_id, production_id, platform, campaign_name, daily_budget, audience_mode, status, created_at, updated_at").order("created_at", { ascending: false }).limit(50)
  ]);

  return {
    adAccounts: ads.data ?? [],
    stores: stores.data ?? [],
    adJobs: jobs.data ?? [],
    error: ads.error?.message ?? stores.error?.message ?? jobs.error?.message ?? ""
  };
}

export default async function AdminConnectionsPage() {
  const data = await loadConnectionData();

  return (
    <AdminShell title="Connected Accounts & Stores" description="Phase-2 backlog view for future social/store integrations, export targets and planned publish jobs. Direct OAuth, planned publish jobs and store push remain blocked until final API/env setup.">
      {data.error ? <p className="form-message">{data.error}</p> : null}

      <section className="admin-info-grid">
        <div><span>Social accounts</span><strong>{data.adAccounts.length}</strong><small>Meta, Instagram, TikTok, YouTube, LinkedIn, X</small></div>
        <div><span>Stores</span><strong>{data.stores.length}</strong><small>Shopify/Amazon/Trendyol/WooCommerce</small></div>
        <div><span>Ad plans</span><strong>{data.adJobs.length}</strong><small>Planned publish/export queue</small></div>
        <div><span>Admin role</span><strong>Backlog monitor</strong><small>Live automation waits for final API/env setup</small></div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Future social targets</span>
        <h2>Social ad and publishing account plans</h2>
        <div className="admin-table-wrap">
          <table className="table"><thead><tr><th>Platform</th><th>Account</th><th>User</th><th>External ID</th><th>Status</th><th>Updated</th></tr></thead><tbody>
            {data.adAccounts.map((item) => <tr key={item.id}><td>{item.platform}</td><td>{item.account_name}</td><td>{item.user_id}</td><td>{item.external_account_id}</td><td>{item.status}</td><td>{item.updated_at ?? item.created_at}</td></tr>)}
          </tbody></table>
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Connected commerce stores</span>
        <h2>E-commerce stores</h2>
        <div className="admin-table-wrap">
          <table className="table"><thead><tr><th>Platform</th><th>Store</th><th>User</th><th>URL</th><th>Status</th><th>Updated</th></tr></thead><tbody>
            {data.stores.map((item) => <tr key={item.id}><td>{item.platform}</td><td>{item.store_name}</td><td>{item.user_id}</td><td>{item.store_url}</td><td>{item.status}</td><td>{item.updated_at ?? item.created_at}</td></tr>)}
          </tbody></table>
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Planned publish jobs</span>
        <h2>Ad / social export planning queue</h2>
        <div className="admin-table-wrap">
          <table className="table"><thead><tr><th>Platform</th><th>Campaign</th><th>User</th><th>Production</th><th>Budget</th><th>Status</th></tr></thead><tbody>
            {data.adJobs.map((item) => <tr key={item.id}><td>{item.platform}</td><td>{item.campaign_name}</td><td>{item.user_id}</td><td>{item.production_id ?? "-"}</td><td>{item.daily_budget}</td><td>{item.status}</td></tr>)}
          </tbody></table>
        </div>
      </section>
    </AdminShell>
  );
}
