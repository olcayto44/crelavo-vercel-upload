"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type ConnectedStore = {
  id: string;
  platform: string;
  store_name: string;
  store_url: string;
  status: string;
};

type SocialPlatform = "meta" | "instagram" | "tiktok" | "youtube" | "linkedin" | "x";

const socialPlatforms: { id: SocialPlatform; label: string; helper: string; placeholder: string }[] = [
  { id: "meta", label: "Facebook / Meta Ads", helper: "Future Facebook/Meta Ads export and campaign planning", placeholder: "Meta Business account / ad account name" },
  { id: "instagram", label: "Instagram / Reels", helper: "Future Reels, stories and Instagram export planning", placeholder: "Instagram business account name" },
  { id: "tiktok", label: "TikTok", helper: "Future TikTok organic/video ad planning", placeholder: "TikTok Ads or profile name" },
  { id: "youtube", label: "YouTube / Shorts", helper: "Shorts and channel video upload preparation", placeholder: "YouTube channel name" },
  { id: "linkedin", label: "LinkedIn", helper: "B2B post and company page planning", placeholder: "LinkedIn company page" },
  { id: "x", label: "X / Twitter", helper: "Tweet, media post and campaign export planning", placeholder: "X account or brand profile" }
];

export function ConnectedAccountsPanel() {
  const [message, setMessage] = useState("");
  const [stores, setStores] = useState<ConnectedStore[]>([]);
  const [storeUrl, setStoreUrl] = useState("https://your-shopify-store.com");
  const [storeName, setStoreName] = useState("My store");
  const [platform, setPlatform] = useState("shopify");
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<SocialPlatform>("instagram");
  const [socialAccountName, setSocialAccountName] = useState("My Instagram business account");
  const [socialGoal, setSocialGoal] = useState("Organic + paid export planning");
  const [loading, setLoading] = useState(false);
  const selectedSocial = socialPlatforms.find((item) => item.id === selectedSocialPlatform) ?? socialPlatforms[0];

  async function currentUserId() {
    const { data } = await supabaseBrowser().auth.getUser();
    return data.user?.id ?? "";
  }

  async function loadStores() {
    const userId = await currentUserId();
    if (!userId) {
      setMessage("You must sign in to connect accounts and stores.");
      return;
    }

    const response = await fetch(`/api/commerce/stores?user_id=${encodeURIComponent(userId)}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error ?? "Stores could not be loaded.");
      return;
    }
    setStores(Array.isArray(data.stores) ? data.stores : []);
  }

  useEffect(() => {
    loadStores();
  }, []);

  async function connectAd(platformName: SocialPlatform) {
    const userId = await currentUserId();
    if (!userId) return setMessage("You must sign in to prepare a future social media connection.");
    setMessage(`${selectedSocial.label} planning record is being prepared...`);

    const response = await fetch("/api/ads/oauth/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, platform: platformName, account_name: socialAccountName, goal: socialGoal })
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.url) window.location.href = data.url;
    else setMessage(data.error ?? "OAuth connection is not live yet. Final API/env setup is required before direct account connection.");
  }

  async function connectStore() {
    const userId = await currentUserId();
    if (!userId) return setMessage("You must sign in to connect a store.");
    setLoading(true);
    setMessage("Store connection is being saved...");

    const response = await fetch("/api/commerce/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, platform, store_name: storeName, store_url: storeUrl })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Store could not be connected.");
      return;
    }

    setMessage("Store target saved for export planning. Direct store push remains blocked until final API/env setup.");
    await loadStores();
  }

  return (
    <div className="grid connection-grid">
      <div className="card connection-card">
        <span className="badge">Future social targets</span>
        <h3>Prepare Facebook, Instagram, TikTok, YouTube, LinkedIn and X targets</h3>
        <p>Choose the platform and account name for future export planning. Direct OAuth and publishing wait for final API/env setup.</p>
        <div className="field"><label>Platform</label><select value={selectedSocialPlatform} onChange={(event) => setSelectedSocialPlatform(event.target.value as SocialPlatform)}>{socialPlatforms.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></div>
        <div className="field"><label>Account / channel name</label><input value={socialAccountName} onChange={(event) => setSocialAccountName(event.target.value)} placeholder={selectedSocial.placeholder} /></div>
        <div className="field"><label>Planning goal</label><select value={socialGoal} onChange={(event) => setSocialGoal(event.target.value)}><option>Organic export planning</option><option>Paid ads planning</option><option>Organic + paid export planning</option><option>ROAS review planning only</option></select></div>
        <div className="connection-selected-platform">
          <strong>{selectedSocial.label}</strong>
          <span>{selectedSocial.helper}</span>
        </div>
        <button className="btn" type="button" onClick={() => connectAd(selectedSocialPlatform)}>Prepare {selectedSocial.label}</button>
      </div>

      <div className="card connection-card">
        <span className="badge">E-commerce export target</span>
        <h3>Prepare Shopify / Amazon / Trendyol targets</h3>
        <p>After production from a product link, visuals, videos, descriptions and ad assets can be exported manually now. Direct store push is post-launch/API dependent.</p>
        <div className="field"><label>Platform</label><select value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="shopify">Shopify</option><option value="amazon">Amazon</option><option value="trendyol">Trendyol</option><option value="woocommerce">WooCommerce</option><option value="custom">Custom store</option></select></div>
        <div className="field"><label>Store name</label><input value={storeName} onChange={(event) => setStoreName(event.target.value)} /></div>
        <div className="field"><label>Store URL</label><input value={storeUrl} onChange={(event) => setStoreUrl(event.target.value)} /></div>
        <button className="btn" type="button" onClick={connectStore} disabled={loading}>{loading ? "Saving..." : "Save store target"}</button>
      </div>

      <div className="card connection-card">
        <span className="badge">Saved store targets</span>
        <h3>Export targets</h3>
        {stores.length === 0 ? <p>No connected store yet. A store appears here after it is connected.</p> : (
          <div className="admin-info-grid compact-info-grid">
            {stores.map((store) => (
              <div key={store.id}><span>{store.platform}</span><strong>{store.store_name}</strong><small>{store.status} - {store.store_url}</small></div>
            ))}
          </div>
        )}
      </div>

      <div className="card connection-card">
        <span className="badge">Export-first flow</span>
        <h3>One line from production to delivery</h3>
        <p>The user gives a brief/link, tracks the system, downloads the final package and uses manual export notes now. Direct connected publishing is post-launch/API dependent.</p>
      </div>

      {message ? <p className="form-message connection-message">{message}</p> : null}
    </div>
  );
}
