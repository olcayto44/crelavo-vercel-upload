import { AdminShell } from "@/components/AdminShell";
import { connectedAccountGuardrails, connectedProviderLabels } from "@/lib/connected-account-constants";
import { supabaseAdmin } from "@/lib/supabase";

async function safeLoad<T>(loader: () => PromiseLike<{ data: T | null; error: any }>, fallback: T) {
  try {
    const { data, error } = await loader();
    if (error) return { data: fallback, error: error.message as string };
    return { data: data ?? fallback, error: "" };
  } catch (error) {
    return { data: fallback, error: error instanceof Error ? error.message : "Connection data unavailable" };
  }
}

async function loadConnectionData() {
  const supabase = supabaseAdmin();
  const [accounts, jobs, legacyAds, legacyStores] = await Promise.all([
    safeLoad(() => supabase.from("connected_accounts").select("id, user_id, provider, account_type, display_name, external_account_id, store_url, status, token_expires_at, last_verified_at, error_message, created_at, updated_at").order("created_at", { ascending: false }).limit(80), [] as any[]),
    safeLoad(() => supabase.from("connected_account_jobs").select("id, user_id, connected_account_id, production_id, provider, job_type, status, approval_required, error_message, created_at, updated_at").order("created_at", { ascending: false }).limit(80), [] as any[]),
    safeLoad(() => supabase.from("connected_ad_accounts").select("id, user_id, platform, account_name, external_account_id, status, created_at, updated_at").order("created_at", { ascending: false }).limit(20), [] as any[]),
    safeLoad(() => supabase.from("connected_commerce_stores").select("id, user_id, platform, store_name, store_url, external_store_id, status, created_at, updated_at").order("created_at", { ascending: false }).limit(20), [] as any[])
  ]);

  return {
    accounts: accounts.data,
    jobs: jobs.data,
    legacyAds: legacyAds.data,
    legacyStores: legacyStores.data,
    error: [accounts.error, jobs.error, legacyAds.error, legacyStores.error].filter(Boolean).join(" | ")
  };
}

export default async function AdminConnectionsPage() {
  const data = await loadConnectionData();
  const socialAccounts = data.accounts.filter((item) => item.account_type === "social");
  const commerceAccounts = data.accounts.filter((item) => item.account_type === "commerce");
  const connected = data.accounts.filter((item) => item.status === "connected");
  const blockedJobs = data.jobs.filter((item) => item.status === "blocked" || item.status === "approval_required");

  return (
    <AdminShell title="Connected Accounts & Stores" description="Unified V1 monitor for social/store connections, export-ready delivery, draft upload jobs and one-click publish guardrails.">
      {data.error ? <p className="form-message">{data.error}</p> : null}

      <section className="admin-info-grid">
        <div><span>Unified accounts</span><strong>{data.accounts.length}</strong><small>TikTok, YouTube, Instagram/Meta, Shopify, WooCommerce</small></div>
        <div><span>Connected</span><strong>{connected.length}</strong><small>Token or live connection record exists.</small></div>
        <div><span>Social / commerce</span><strong>{socialAccounts.length} / {commerceAccounts.length}</strong><small>Split by account type.</small></div>
        <div><span>Guarded jobs</span><strong>{blockedJobs.length}</strong><small>Approval required or blocked before mutation.</small></div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Unified connected_accounts</span>
        <h2>Social and store accounts</h2>
        <div className="admin-table-wrap">
          <table className="table"><thead><tr><th>Provider</th><th>Type</th><th>Name</th><th>User</th><th>Target</th><th>Status</th><th>Verified</th></tr></thead><tbody>
            {data.accounts.map((item) => <tr key={item.id}><td>{connectedProviderLabels[item.provider as keyof typeof connectedProviderLabels] ?? item.provider}</td><td>{item.account_type}</td><td>{item.display_name}</td><td>{item.user_id}</td><td>{item.store_url || item.external_account_id || "-"}</td><td>{item.status}</td><td>{item.last_verified_at ?? "-"}</td></tr>)}
          </tbody></table>
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Upload / publish jobs</span>
        <h2>Draft upload and one-click publish queue</h2>
        <div className="admin-table-wrap">
          <table className="table"><thead><tr><th>Provider</th><th>Job</th><th>User</th><th>Production</th><th>Status</th><th>Approval</th><th>Error</th></tr></thead><tbody>
            {data.jobs.map((item) => <tr key={item.id}><td>{item.provider}</td><td>{item.job_type}</td><td>{item.user_id}</td><td>{item.production_id ?? "-"}</td><td>{item.status}</td><td>{item.approval_required ? "required" : "not required"}</td><td>{item.error_message ?? "-"}</td></tr>)}
          </tbody></table>
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Safety policy</span>
        <h2>Public and product guardrails</h2>
        <ul>{connectedAccountGuardrails.map((note) => <li key={note}>{note}</li>)}</ul>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Legacy records</span>
        <h2>Previous ad/store tables kept for migration safety</h2>
        <div className="admin-info-grid">
          <div><span>Legacy social accounts</span><strong>{data.legacyAds.length}</strong><small>connected_ad_accounts</small></div>
          <div><span>Legacy stores</span><strong>{data.legacyStores.length}</strong><small>connected_commerce_stores</small></div>
        </div>
      </section>
    </AdminShell>
  );
}
