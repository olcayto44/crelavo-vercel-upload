"use client";

import { useEffect, useMemo, useState } from "react";
import { connectedAccountGuardrails, connectedProviderLabels, type ConnectedProvider } from "@/lib/connected-account-constants";
import { supabaseBrowser } from "@/lib/supabase";

type ConnectedAccount = {
  id: string;
  provider: ConnectedProvider;
  account_type: "social" | "commerce";
  display_name: string;
  external_account_id: string;
  store_url: string | null;
  status: string;
  token_present?: boolean;
  refresh_token_present?: boolean;
  updated_at?: string;
};

type StoreProduct = {
  id: string;
  title: string;
  status: string;
  handle: string;
  image?: string | null;
};

type ExportPackItem = {
  provider: ConnectedProvider;
  label: string;
  status: string;
  mediaUrl: string;
  title: string;
  caption: string;
  hashtags: string[];
  format: string;
  guardrail: string;
};

const socialProviders: ConnectedProvider[] = ["tiktok", "youtube", "instagram", "meta"];
const commerceProviders: ConnectedProvider[] = ["shopify", "woocommerce"];
const allProviders: ConnectedProvider[] = [...socialProviders, ...commerceProviders];

export function ConnectedAccountsPanel() {
  const [message, setMessage] = useState("");
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ConnectedProvider>("instagram");
  const [displayName, setDisplayName] = useState("My Instagram business account");
  const [externalId, setExternalId] = useState("my-instagram-business-account");
  const [storeUrl, setStoreUrl] = useState("https://your-shopify-store.com");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [exportTitle, setExportTitle] = useState("New Crelavo production");
  const [exportCaption, setExportCaption] = useState("Review this caption before publishing.");
  const [exportPack, setExportPack] = useState<ExportPackItem[]>([]);
  const [products, setProducts] = useState<Record<string, StoreProduct[]>>({});
  const [selectedProduct, setSelectedProduct] = useState<Record<string, string>>({});
  const [readiness, setReadiness] = useState<Record<string, string>>({});
  const [jobRecords, setJobRecords] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const selectedIsCommerce = commerceProviders.includes(selectedProvider);
  const connectedCount = useMemo(() => accounts.filter((account) => account.status === "connected").length, [accounts]);

  async function currentUser() {
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token ?? "";
    const userId = data.session?.user?.id ?? "";
    return { userId, token };
  }

  async function loadAccounts() {
    const { userId, token } = await currentUser();
    if (!userId || !token) {
      setMessage("You must sign in to connect accounts and stores.");
      return;
    }

    const response = await fetch(`/api/connected-accounts?user_id=${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error ?? "Connected accounts could not be loaded.");
      return;
    }
    setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function saveAccount(status: "oauth_ready" | "connected") {
    const { userId, token } = await currentUser();
    if (!userId || !token) return setMessage("You must sign in to save a connected account.");
    setLoading(true);
    setMessage("Connection record is being saved...");

    const response = await fetch("/api/connected-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        user_id: userId,
        provider: selectedProvider,
        display_name: displayName,
        external_account_id: externalId || displayName,
        store_url: selectedIsCommerce ? storeUrl : "",
        status,
        access_token: accessToken,
        refresh_token: refreshToken,
        scopes: selectedIsCommerce ? ["store_media", "product_update", "draft_upload"] : ["media_upload", "draft_create", "publish_after_approval"]
      })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Connection could not be saved.");
      return;
    }

    setMessage(status === "connected" ? "Connected account saved. Direct publish/upload still requires final user approval." : "OAuth-ready planning record saved. Use this until live OAuth/token exchange is complete.");
    setAccessToken("");
    setRefreshToken("");
    await loadAccounts();
  }

  async function generateExportPack() {
    const { userId, token } = await currentUser();
    if (!userId || !token) return setMessage("You must sign in to create an export-ready pack.");
    const response = await fetch("/api/connected-accounts/export-ready", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        user_id: userId,
        title: exportTitle,
        caption: exportCaption,
        target_providers: allProviders,
        hashtags: ["#ai", "#videomarketing", "#ecommerce"]
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error ?? "Export pack could not be created.");
    setExportPack(Array.isArray(data.pack) ? data.pack : []);
    setMessage("Export-ready pack created. This is safe for download/manual handoff; direct publishing is still approval-gated.");
  }

  async function checkReadiness() {
    const { userId, token } = await currentUser();
    if (!userId || !token) return setMessage("You must sign in to check connection readiness.");
    const response = await fetch("/api/connected-accounts/readiness", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error ?? "Readiness could not be checked.");
    const next: Record<string, string> = {};
    for (const item of Array.isArray(data.accounts) ? data.accounts : []) next[item.id] = `${item.readiness?.status}: ${item.readiness?.action}`;
    setReadiness(next);
    setMessage("Connected account readiness checked.");
  }

  async function loadProducts(account: ConnectedAccount) {
    const { userId, token } = await currentUser();
    if (!userId || !token) return setMessage("You must sign in to load store products.");
    const response = await fetch(`/api/commerce/products?user_id=${encodeURIComponent(userId)}&connected_account_id=${encodeURIComponent(account.id)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error ?? "Products could not be loaded.");
    setProducts((current) => ({ ...current, [account.id]: Array.isArray(data.products) ? data.products : [] }));
    setMessage(`${connectedProviderLabels[account.provider]} products loaded for approval-gated upload selection.`);
  }

  async function refreshAccount(account: ConnectedAccount) {
    const { userId, token } = await currentUser();
    if (!userId || !token) return setMessage("You must sign in to refresh this account.");
    const response = await fetch("/api/connected-accounts/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, connected_account_id: account.id })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error ?? "Refresh could not be completed.");
    setReadiness((current) => ({ ...current, [account.id]: `${data.readiness?.status}: ${data.readiness?.action}` }));
    setMessage(`${connectedProviderLabels[account.provider]} token refresh checked.`);
    await loadAccounts();
  }

  async function runJob(account: ConnectedAccount, jobId: string, mode: "run" | "retry") {
    const { userId, token } = await currentUser();
    if (!userId || !token) return setMessage("You must sign in to run this worker plan.");
    const response = await fetch(`/api/connected-accounts/jobs/${jobId}/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: userId, final_user_approval: true })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error ?? "Worker plan could not be updated.");
    setJobRecords((current) => ({ ...current, [account.id]: data.job }));
    setMessage(`${connectedProviderLabels[account.provider]} ${mode} recorded as ${data.job?.status}. Provider mutation remains guard-controlled.`);
  }

  async function createPublishJob(account: ConnectedAccount, jobType: "draft_upload" | "one_click_publish" | "store_upload") {
    const { userId, token } = await currentUser();
    if (!userId || !token) return setMessage("You must sign in to create a publish/upload job.");
    const response = await fetch("/api/connected-accounts/publish-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        user_id: userId,
        connected_account_id: account.id,
        provider: account.provider,
        job_type: jobType,
        final_user_approval: jobType !== "one_click_publish",
        title: exportTitle,
        caption: exportCaption,
        media_url: "dashboard_delivery_asset",
        product_id: selectedProduct[account.id] || "",
        target: account.store_url || account.external_account_id
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.error ?? "Publish/upload job could not be created.");
    if (data.job?.id) setJobRecords((current) => ({ ...current, [account.id]: data.job }));
    setMessage(`${connectedProviderLabels[account.provider]} ${jobType} job recorded as ${data.job?.status}. No live platform mutation happens without explicit final approval.`);
  }

  return (
    <div className="grid connection-grid">
      <div className="card connection-card">
        <span className="badge">Connected accounts V1</span>
        <h3>Social and store account records</h3>
        <p>Save OAuth-ready or connected records for TikTok, YouTube, Instagram/Meta, Shopify and WooCommerce. Tokens are stored server-side and hidden from the UI.</p>
        <div className="field"><label>Provider</label><select value={selectedProvider} onChange={(event) => setSelectedProvider(event.target.value as ConnectedProvider)}>{allProviders.map((provider) => <option value={provider} key={provider}>{connectedProviderLabels[provider]}</option>)}</select></div>
        <div className="field"><label>Display name</label><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></div>
        <div className="field"><label>External account/store ID</label><input value={externalId} onChange={(event) => setExternalId(event.target.value)} placeholder="channel, business account, store id or handle" /></div>
        {selectedIsCommerce ? <div className="field"><label>Store URL</label><input value={storeUrl} onChange={(event) => setStoreUrl(event.target.value)} /></div> : null}
        <div className="field"><label>Access token</label><input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Optional; leave empty for oauth_ready" type="password" /></div>
        <div className="field"><label>Refresh token</label><input value={refreshToken} onChange={(event) => setRefreshToken(event.target.value)} placeholder="Optional refresh token" type="password" /></div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn secondary" type="button" onClick={() => saveAccount("oauth_ready")} disabled={loading}>{loading ? "Saving..." : "Save OAuth-ready"}</button>
          <button className="btn" type="button" onClick={() => saveAccount("connected")} disabled={loading}>{loading ? "Saving..." : "Save connected"}</button>
        </div>
      </div>

      <div className="card connection-card">
        <span className="badge">Export-ready pack</span>
        <h3>Prepare platform/store delivery pack first</h3>
        <p>This is the safe current customer-facing mode: downloadable video/image/caption/hashtag/product-media notes without claiming automatic publishing.</p>
        <div className="field"><label>Export title</label><input value={exportTitle} onChange={(event) => setExportTitle(event.target.value)} /></div>
        <div className="field"><label>Caption draft</label><textarea value={exportCaption} onChange={(event) => setExportCaption(event.target.value)} /></div>
        <button className="btn" type="button" onClick={generateExportPack}>Create export-ready pack</button>
      </div>

      <div className="card connection-card">
        <span className="badge">Saved accounts</span>
        <h3>{accounts.length} records · {connectedCount} connected</h3>
        <button className="btn secondary" type="button" onClick={checkReadiness}>Check readiness / token expiry</button>
        {accounts.length === 0 ? <p>No connected account yet. Save an OAuth-ready or connected target first.</p> : (
          <div className="admin-info-grid compact-info-grid">
            {accounts.map((account) => (
              <div key={account.id}>
                <span>{connectedProviderLabels[account.provider] ?? account.provider}</span>
                <strong>{account.display_name}</strong>
                <small>{account.status} · token {account.token_present ? "stored" : "not stored"} · {account.store_url || account.external_account_id}</small>
                {readiness[account.id] ? <small>{readiness[account.id]}</small> : null}
                {account.account_type === "commerce" ? (
                  <div style={{ marginTop: 8 }}>
                    <button className="btn secondary" type="button" onClick={() => loadProducts(account)}>Load products</button>
                    {products[account.id]?.length ? (
                      <select value={selectedProduct[account.id] ?? ""} onChange={(event) => setSelectedProduct((current) => ({ ...current, [account.id]: event.target.value }))}>
                        <option value="">Select product for upload</option>
                        {products[account.id].map((product) => <option value={product.id} key={product.id}>{product.title} · {product.status}</option>)}
                      </select>
                    ) : null}
                  </div>
                ) : null}
                {jobRecords[account.id] ? <small>Last job: {jobRecords[account.id].job_type} · {jobRecords[account.id].status} · {jobRecords[account.id].error_message ?? "guarded"}</small> : null}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                  <button className="btn secondary" type="button" onClick={() => refreshAccount(account)}>Refresh token</button>
                  <button className="btn secondary" type="button" onClick={() => createPublishJob(account, account.account_type === "commerce" ? "store_upload" : "draft_upload")}>Create draft job</button>
                  <button className="btn secondary" type="button" onClick={() => createPublishJob(account, "one_click_publish")}>Test publish guard</button>
                  {jobRecords[account.id]?.id ? <button className="btn secondary" type="button" onClick={() => runJob(account, jobRecords[account.id].id, "retry")}>Retry job</button> : null}
                  {jobRecords[account.id]?.id ? <button className="btn secondary" type="button" onClick={() => runJob(account, jobRecords[account.id].id, "run")}>Run worker plan</button> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card connection-card">
        <span className="badge">Safety guard</span>
        <h3>No silent social/store mutation</h3>
        <ul>{connectedAccountGuardrails.map((note) => <li key={note}>{note}</li>)}</ul>
      </div>

      {exportPack.length > 0 ? (
        <section className="card admin-wide-card" style={{ gridColumn: "1 / -1" }}>
          <span className="badge">Generated export pack</span>
          <h3>Download/manual handoff assets</h3>
          <div className="admin-category-grid">
            {exportPack.map((item) => (
              <div className="card admin-category-card" key={item.provider}>
                <span className="badge">{item.status}</span>
                <h3>{item.label}</h3>
                <p>{item.caption}</p>
                <small>{item.format}</small>
                <div className="social-export-detail-list"><span><small>Hashtags</small><strong>{item.hashtags.join(" ")}</strong></span><span><small>Guardrail</small><strong>{item.guardrail}</strong></span></div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {message ? <p className="form-message connection-message">{message}</p> : null}
    </div>
  );
}
