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

function ProviderIcon({ provider }: { provider: ConnectedProvider }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true };
  if (provider === "youtube") return <svg {...common}><path d="M4.5 7.4c.2-1.1 1.1-2 2.2-2.2C8.5 5 12 5 12 5s3.5 0 5.3.2c1.1.2 2 1.1 2.2 2.2.2 1.2.2 4.6.2 4.6s0 3.4-.2 4.6c-.2 1.1-1.1 2-2.2 2.2-1.8.2-5.3.2-5.3.2s-3.5 0-5.3-.2c-1.1-.2-2-1.1-2.2-2.2-.2-1.2-.2-4.6-.2-4.6s0-3.4.2-4.6Z" fill="currentColor"/><path d="m10.4 15.3 4.6-3.3-4.6-3.3v6.6Z" fill="#fff"/></svg>;
  if (provider === "tiktok") return <svg {...common}><path d="M14.8 3c.4 2.9 2 4.7 4.5 5v3.3c-1.6.1-3.1-.4-4.4-1.3v5.7c0 3.4-2.1 5.3-5 5.3-2.8 0-5.1-2-5.1-4.8 0-3.2 2.8-5.3 6.2-4.7v3.4c-1.5-.5-2.7.2-2.7 1.4 0 1 .8 1.6 1.7 1.6 1.1 0 1.7-.7 1.7-2.1V3h3.1Z" fill="currentColor"/></svg>;
  if (provider === "instagram") return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="2"/><circle cx="16.8" cy="7.2" r="1.1" fill="currentColor"/></svg>;
  if (provider === "meta") return <svg {...common}><path d="M4 14.2C4 10 6.1 6.5 8.9 6.5c1.8 0 3.1 1.2 4.2 2.9 1-1.7 2.2-2.9 4-2.9 2.3 0 3.9 2.1 3.9 5.2 0 3.3-1.7 5.8-4.1 5.8-1.6 0-2.8-1-4.1-3.1-1.3 2.1-2.5 3.1-4.2 3.1C6 17.5 4 16.2 4 14.2Zm2.4-.1c0 .8.8 1.3 1.8 1.3 1.1 0 1.9-.9 3.2-3.1-1-1.8-1.7-2.7-2.7-2.7-1.3 0-2.3 2-2.3 4.5Zm7.9-1.8c1.2 2.2 2 3.1 3.1 3.1.9 0 1.4-1.1 1.4-3.4 0-1.5-.6-2.4-1.6-2.4-1 0-1.8.9-2.9 2.7Z" fill="currentColor"/></svg>;
  if (provider === "shopify") return <svg {...common}><path d="M7.2 8.5 8 20.2h8.4l.9-11.7H7.2Z" fill="currentColor"/><path d="M9.2 8.5c.1-2.7 1.4-4.7 3.3-4.7s3.1 2 3.2 4.7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><path d="M10.2 12.1c.8-.5 2.1-.7 3.1-.2.9.4 1.2 1.4.7 2.1-.4.6-1 .8-2 .9-.9.1-1.3.2-1.5.6-.2.5.3.9 1.1 1 .8.1 1.8-.1 2.6-.6" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/></svg>;
  return <svg {...common}><path d="M5 7.5h14v10.2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7.5Z" stroke="currentColor" strokeWidth="2"/><path d="M8.5 7.5a3.5 3.5 0 0 1 7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 12h6M9 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

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
  const selectedLimit = jobRecords[Object.keys(jobRecords)[0] || ""]?.result?.workerPlan?.formatValidation;
  const defaultFormatNotes = ["TikTok/Instagram: prefer 9:16 or 4:5", "YouTube: decide Shorts 9:16 or long-form 16:9", "Shopify/WooCommerce: product_id is required for store uploads", "Captions/hashtags must be reviewed before publish."];

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

  async function startOAuth(provider: ConnectedProvider) {
    const { userId, token } = await currentUser();
    if (!userId) return setMessage("You must sign in before starting OAuth.");
    const commerce = provider === "shopify";
    const response = await fetch(commerce ? "/api/commerce/shopify/oauth/start" : "/api/ads/oauth/start", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(commerce ? { user_id: userId, shop: storeUrl } : { user_id: userId, platform: provider })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) return setMessage(data.error ?? `${connectedProviderLabels[provider]} OAuth could not be started.`);
    window.location.href = data.url;
  }

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
        <div className="connection-launch-panel">
          <div className="connection-launch-section">
            <strong>Social OAuth</strong>
            <div className="connection-launch-grid">
              {socialProviders.map((provider) => (
                <button className={`connection-launch-button ${provider}`} type="button" key={provider} onClick={() => startOAuth(provider)}>
                  <span className="connection-launch-icon"><ProviderIcon provider={provider} /></span>
                  <span><b>{connectedProviderLabels[provider]}</b><small>Hesabı bağla</small></span>
                </button>
              ))}
            </div>
          </div>
          <div className="connection-launch-section">
            <strong>E-commerce</strong>
            <div className="connection-launch-grid commerce">
              <button className="connection-launch-button shopify" type="button" onClick={() => startOAuth("shopify")}>
                <span className="connection-launch-icon"><ProviderIcon provider="shopify" /></span>
                <span><b>Shopify</b><small>Mağazayı bağla</small></span>
              </button>
              <button className="connection-launch-button woocommerce" type="button" onClick={() => { setSelectedProvider("woocommerce"); setMessage("WooCommerce için mağaza URL, consumer key ve consumer secret gerekir. Mağaza yoksa bu adım beklemede kalır."); }}>
                <span className="connection-launch-icon"><ProviderIcon provider="woocommerce" /></span>
                <span><b>WooCommerce</b><small>REST doğrula</small></span>
              </button>
            </div>
          </div>
        </div>
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
        <p>This is the safe current customer-facing mode: downloadable video/image/caption/hashtag/product-media notes without claiming live publishing automation.</p>
        <ul>{(selectedLimit?.hints?.length ? selectedLimit.hints : defaultFormatNotes).map((note: string) => <li key={note}>{note}</li>)}</ul>
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
