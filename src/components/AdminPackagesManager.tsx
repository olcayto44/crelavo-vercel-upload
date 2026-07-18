"use client";

import { useEffect, useMemo, useState } from "react";
import { dronePurchasePackages, packages, specialPurchaseProducts, topUpPackages } from "@/lib/data";
import { productionPackages, productionTypes } from "@/lib/production";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiHeaders } from "@/lib/admin-client-auth";

type EditablePackage = {
  id: string;
  name: string;
  billing: string;
  price: string;
  priceUsd: number;
  setupFeeUsd: number;
  credits: number;
  planType: string;
  serviceCategory?: string;
  description: string;
  renderQueue?: string;
  monthlyStripePriceEnv?: string;
  yearlyStripePriceEnv?: string;
  stripePriceEnv?: string;
  monthlyPaymentLinkUrl?: string;
  yearlyPaymentLinkUrl?: string;
  paymentLinkUrl?: string;
};

type EditableProductionPackage = {
  id: string;
  productionType: string;
  name: string;
  credits: number;
  description: string;
  deliverables: string[];
};

type StripeReadiness = {
  ready: boolean;
  paymentLinkFallbackReady?: boolean;
  earlyLaunchReady?: boolean;
  missingCore?: string[];
  required: string[];
  missing: string[];
  packageCount: number;
  paymentLinksConfigured?: number;
  note: string;
};

function toEditablePackage(item: any): EditablePackage {
  return {
    id: String(item.id),
    name: String(item.name),
    billing: String(item.billing ?? "Monthly"),
    price: String(item.price ?? "$0"),
    priceUsd: Number(item.priceUsd ?? 0),
    setupFeeUsd: Number(item.setupFeeUsd ?? 0),
    credits: Number(item.credits ?? 0),
    planType: String(item.planType ?? "subscription"),
    serviceCategory: item.serviceCategory ? String(item.serviceCategory) : "",
    description: String(item.description ?? ""),
    renderQueue: String(item.renderQueue ?? "Standard render queue"),
    monthlyStripePriceEnv: item.monthlyStripePriceEnv ? String(item.monthlyStripePriceEnv) : "",
    yearlyStripePriceEnv: item.yearlyStripePriceEnv ? String(item.yearlyStripePriceEnv) : "",
    stripePriceEnv: item.stripePriceEnv ? String(item.stripePriceEnv) : "",
    monthlyPaymentLinkUrl: item.monthlyPaymentLinkUrl ? String(item.monthlyPaymentLinkUrl) : "",
    yearlyPaymentLinkUrl: item.yearlyPaymentLinkUrl ? String(item.yearlyPaymentLinkUrl) : "",
    paymentLinkUrl: item.paymentLinkUrl ? String(item.paymentLinkUrl) : ""
  };
}

function toEditableProductionPackage(item: any): EditableProductionPackage {
  return {
    id: String(item.id),
    productionType: String(item.productionType),
    name: String(item.name),
    credits: Number(item.credits ?? 0),
    description: String(item.description ?? ""),
    deliverables: Array.isArray(item.deliverables) ? item.deliverables.map(String) : []
  };
}

export function AdminPackagesManager() {
  const [creditPlans, setCreditPlans] = useState<EditablePackage[]>([...packages, ...topUpPackages, ...dronePurchasePackages, ...specialPurchaseProducts].map(toEditablePackage));
  const [productionPlans, setProductionPlans] = useState<EditableProductionPackage[]>(productionPackages.map(toEditableProductionPackage));
  const [selectedCreditId, setSelectedCreditId] = useState(creditPlans[0]?.id ?? "");
  const [selectedProductionId, setSelectedProductionId] = useState(productionPlans[0]?.id ?? "");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [message, setMessage] = useState("Package config loads from defaults until saved to platform config.");
  const [saving, setSaving] = useState(false);
  const [stripeReadiness, setStripeReadiness] = useState<StripeReadiness | null>(null);

  const selectedCredit = creditPlans.find((item) => item.id === selectedCreditId) ?? creditPlans[0];
  const selectedProduction = productionPlans.find((item) => item.id === selectedProductionId) ?? productionPlans[0];

  const groupedProductionPlans = useMemo(() => productionTypes.map((type) => ({
    type,
    plans: productionPlans.filter((plan) => plan.productionType === type.id)
  })).filter((group) => group.plans.length > 0), [productionPlans]);

  async function loadStripeReadiness(email = adminEmail) {
    if (!email.trim()) return;
    const response = await fetch("/api/admin/stripe-readiness", { headers: adminApiHeaders(email, adminToken) });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setStripeReadiness(data as StripeReadiness);
  }

  useEffect(() => {
    if (!adminEmail.trim()) return;
    let cancelled = false;
    fetch("/api/admin/packages", { headers: adminApiHeaders(adminEmail, adminToken) })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled || !data.config) return;
        const nextCreditPlans = Array.isArray(data.config.creditPackages) ? data.config.creditPackages.map(toEditablePackage) : [];
        const nextProductionPlans = Array.isArray(data.config.productionPackages) ? data.config.productionPackages.map(toEditableProductionPackage) : [];
        if (nextCreditPlans.length) {
          setCreditPlans(nextCreditPlans);
          setSelectedCreditId(nextCreditPlans[0].id);
        }
        if (nextProductionPlans.length) {
          setProductionPlans(nextProductionPlans);
          setSelectedProductionId(nextProductionPlans[0].id);
        }
      setMessage(data.fallback ? "Default package config loaded. Save once to publish it to platform config." : "Saved package config loaded from platform config.");
      loadStripeReadiness(adminEmail);
    })
      .catch(() => {
        if (!cancelled) setMessage("Package config could not be loaded; defaults remain visible.");
      });
    return () => { cancelled = true; };
  }, [adminEmail, adminToken]);

  async function savePackageConfig() {
    if (!adminEmail.trim()) {
      setMessage("Enter ADMIN_EMAIL before saving package config.");
      return;
    }
    setSaving(true);
    setMessage("Saving package config...");
    try {
      const response = await fetch("/api/admin/packages", {
        method: "POST",
        headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
        body: JSON.stringify({ config: { creditPackages: creditPlans, productionPackages: productionPlans } })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not save package config");
      await loadStripeReadiness(adminEmail);
      setMessage("Package config saved. Assistant planning, production reserve and Whop checkout routing now read this config.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save package config.");
    } finally {
      setSaving(false);
    }
  }

  function updateCredit(field: keyof EditablePackage, value: string) {
    setCreditPlans((current) => current.map((item) => item.id === selectedCredit.id ? {
      ...item,
      [field]: field === "priceUsd" || field === "setupFeeUsd" || field === "credits" ? Number(value) || 0 : value
    } : item));
  }

  function updateProduction(field: keyof EditableProductionPackage, value: string) {
    setProductionPlans((current) => current.map((item) => item.id === selectedProduction.id ? {
      ...item,
      [field]: field === "credits" ? Number(value) || 0 : field === "deliverables" ? value.split("\n").map((line) => line.trim()).filter(Boolean) : value
    } : item));
  }

  function addCreditPlan(planType: "subscription" | "topup" | "service_subscription", template: "standard" | "drone" | "growth" = "standard") {
    const id = template === "drone" ? `drone_credit_${Date.now()}` : template === "growth" ? `growth_intelligence_custom_${Date.now()}` : `${planType}_${Date.now()}`;
    const isService = planType === "service_subscription";
    const isDrone = template === "drone";
    const isGrowth = template === "growth";
    const isSubscription = planType === "subscription" || isService;
    const next: EditablePackage = {
      id,
      name: isGrowth ? "New Growth Intelligence Service Plan" : isService ? "New Live Sales Service Plan" : isDrone ? "New Drone Credit Pack" : planType === "subscription" ? "New Subscription Package" : "New Top-up Package",
      billing: isService ? "Monthly service plan" : isDrone ? "One-time drone credit purchase" : planType === "subscription" ? "Monthly" : "One-time top-up",
      price: isGrowth ? "$499/mo" : isService ? "$249/mo" : isDrone ? "$299" : planType === "subscription" ? "$49/mo" : "$15",
      priceUsd: isGrowth ? 499 : isService ? 249 : isDrone ? 299 : planType === "subscription" ? 49 : 15,
      setupFeeUsd: isGrowth ? 29 : isService ? 25 : isDrone ? 29 : planType === "subscription" ? 5 : 0,
      credits: isService ? 0 : isDrone ? 2600 : planType === "subscription" ? 5000 : 1200,
      planType,
      serviceCategory: isGrowth ? "growth_intelligence" : isService ? "live_sales_agent" : isDrone ? "drone_video" : "",
      description: isGrowth ? "Monthly AI Growth Intelligence service plan. Keep credits at 0; describe competitor limits, monitoring frequency, report delivery and alert channels." : isService ? "Monthly AI live sales agent service plan. Keep credits at 0; describe fair-use hours, platform limit and pay-as-you-go provider/API policy." : isDrone ? "One-time Drone / Satellite Video credit pack. Keep it on the separate drone page, but activate credits like a normal top-up." : "New package draft. Edit credits, price, queue and description before publishing.",
      renderQueue: isSubscription ? "Priority render queue" : "Standard render queue",
      monthlyStripePriceEnv: isSubscription ? `STRIPE_PRICE_${id.toUpperCase()}_MONTHLY` : "",
      yearlyStripePriceEnv: planType === "subscription" ? `STRIPE_PRICE_${id.toUpperCase()}_YEARLY` : "",
      stripePriceEnv: planType === "topup" ? `STRIPE_PRICE_${id.toUpperCase()}` : "",
      monthlyPaymentLinkUrl: "",
      yearlyPaymentLinkUrl: "",
      paymentLinkUrl: ""
    };
    setCreditPlans((current) => [...current, next]);
    setSelectedCreditId(id);
    setMessage(isGrowth ? "New Growth Intelligence service plan draft created. Add competitor limits, monitoring cadence and Payment Link before publishing." : isService ? "New AI Live Sales service plan draft created. Add fair-use hours and Payment Link before publishing." : isDrone ? "New Drone credit pack draft created. Add credits and one-time Payment Link before publishing." : "New package draft created. Edit the fields below.");
  }

  function addProductionPlan(productionType: string = productionTypes[0]?.id ?? "video") {
    const id = productionType === "live_sales_agent" ? `live_sales_agent_custom_${Date.now()}` : `production_${Date.now()}`;
    const next: EditableProductionPackage = {
      id,
      productionType,
      name: productionType === "live_sales_agent" ? "Custom Live Sales Agent Plan" : "New production package",
      credits: 0,
      description: productionType === "live_sales_agent" ? "Custom AI live sales agent service plan. Edit price, fair-use hours, API usage policy and features before publishing." : "New production package draft.",
      deliverables: productionType === "live_sales_agent" ? ["Fair-use live hours", "Product link/details", "Live FAQ", "CTA/discount playbook", "Pay-as-you-go API cost estimate", "Provider readiness checklist"] : ["Preview", "Final delivery", "Revision note"]
    };
    setProductionPlans((current) => [...current, next]);
    setSelectedProductionId(id);
    setMessage(productionType === "live_sales_agent" ? "New AI Live Sales Agent package draft created. Edit hours, price text and features below." : "New production package draft created. Edit the fields below.");
  }

  function deleteCreditPlan() {
    if (creditPlans.length <= 1) {
      setMessage("At least one credit package must remain.");
      return;
    }
    setCreditPlans((current) => current.filter((item) => item.id !== selectedCredit.id));
    setSelectedCreditId(creditPlans.find((item) => item.id !== selectedCredit.id)?.id ?? "");
    setMessage("Credit package removed from draft config. Use Save to platform config to publish removal.");
  }

  function deleteProductionPlan() {
    if (productionPlans.length <= 1) {
      setMessage("At least one production package must remain.");
      return;
    }
    setProductionPlans((current) => current.filter((item) => item.id !== selectedProduction.id));
    setSelectedProductionId(productionPlans.find((item) => item.id !== selectedProduction.id)?.id ?? "");
    setMessage("Production package removed from draft config. Use Save to platform config to publish removal.");
  }

  if (!selectedCredit || !selectedProduction) return null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="card admin-wide-card">
        <span className="badge">Payment package editor</span>
        <h2>Credit, service and Drone payment packages</h2>
        <p style={{ color: "var(--muted)" }}>Select any package card to edit it. Normal credit products, AI Live Sales monthly/yearly service plans, Growth Intelligence monthly/yearly service plans and Drone credit packs are managed here for Whop plan mapping, direct checkout fallback links and legacy env references.</p>
        <div className="admin-production-editor" style={{ marginBottom: 14 }}>
          <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
          <div className="field"><label>Save package config</label><button className="btn" type="button" onClick={savePackageConfig} disabled={saving}>{saving ? "Saving..." : "Save to platform config"}</button></div>
          <div className="field"><label>Payment readiness</label><button className="btn secondary" type="button" onClick={() => loadStripeReadiness()} disabled={!adminEmail.trim()}>Check payment env</button></div>
        </div>
        {stripeReadiness ? (
          <div className={`workspace-action-note ${stripeReadiness.ready ? "success" : "warning"}`}>
            <strong>{stripeReadiness.ready ? "Payment env ready" : "Payment env missing"}</strong><br />
            {stripeReadiness.note}<br />
            Mode: {stripeReadiness.ready ? "Full payment API checkout" : stripeReadiness.earlyLaunchReady ? "Early launch with direct checkout + manual activation" : stripeReadiness.paymentLinkFallbackReady ? "Direct checkout links configured, core env still missing" : "Not ready"}.<br />
            Packages checked: {stripeReadiness.packageCount}. Payment links configured: {stripeReadiness.paymentLinksConfigured ?? 0}. Missing core env: {stripeReadiness.missingCore?.length ? stripeReadiness.missingCore.join(", ") : "None"}. Missing env names: {stripeReadiness.missing.length ? stripeReadiness.missing.join(", ") : "None"}.
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <button className="btn" type="button" onClick={() => addCreditPlan("subscription")}>Add subscription package</button>
          <button className="btn secondary" type="button" onClick={() => addCreditPlan("topup")}>Add top-up package</button>
          <button className="btn secondary" type="button" onClick={() => addCreditPlan("service_subscription")}>Add Live Sales service plan</button>
          <button className="btn secondary" type="button" onClick={() => addCreditPlan("service_subscription", "growth")}>Add Growth Intelligence service plan</button>
          <button className="btn secondary" type="button" onClick={() => addCreditPlan("topup", "drone")}>Add Drone credit pack</button>
          <span className="badge">{message}</span>
        </div>
        <div className="admin-package-grid">
          {creditPlans.map((plan) => (
            <button className={`card admin-category-card admin-select-card ${selectedCredit.id === plan.id ? "active-billing-plan" : ""}`} key={plan.id} type="button" onClick={() => setSelectedCreditId(plan.id)}>
              <span className="badge">{plan.planType}</span>
              <h2>{plan.name}</h2>
              <p>{plan.price} / {plan.credits.toLocaleString()} credits</p>
              <p>{plan.description}</p>
              <span className="btn">Edit package</span>
            </button>
          ))}
        </div>
        <div className="card selected-billing-card" style={{ marginTop: 14 }}>
          <span className="badge">Selected package</span>
          <h2>{selectedCredit.name}</h2>
          {selectedCredit.planType === "service_subscription" ? <div className="workspace-action-note warning" style={{ marginBottom: 12 }}>This service product must keep Credits at 0. Set Service category to live_sales_agent or growth_intelligence so checkout routes, metadata and admin review stay aligned; admin verifies the Whop payment without adding normal account credits.</div> : null}
          <div className="admin-production-editor">
            <div className="field"><label>Package ID</label><input value={selectedCredit.id} onChange={(event) => updateCredit("id", event.target.value)} /></div>
            <div className="field"><label>Name</label><input value={selectedCredit.name} onChange={(event) => updateCredit("name", event.target.value)} /></div>
            <div className="field"><label>Billing</label><input value={selectedCredit.billing} onChange={(event) => updateCredit("billing", event.target.value)} /></div>
            <div className="field"><label>Price label</label><input value={selectedCredit.price} onChange={(event) => updateCredit("price", event.target.value)} /></div>
            <div className="field"><label>Price USD</label><input type="number" value={selectedCredit.priceUsd} onChange={(event) => updateCredit("priceUsd", event.target.value)} /></div>
            <div className="field"><label>24-hour preview setup fee USD</label><input type="number" value={selectedCredit.setupFeeUsd} onChange={(event) => updateCredit("setupFeeUsd", event.target.value)} /></div>
            <div className="field"><label>Credits</label><input type="number" value={selectedCredit.credits} onChange={(event) => updateCredit("credits", event.target.value)} /></div>
            <div className="field"><label>Plan type</label><select value={selectedCredit.planType} onChange={(event) => updateCredit("planType", event.target.value)}><option value="subscription">subscription</option><option value="topup">topup</option><option value="service_subscription">service_subscription</option></select></div>
            <div className="field"><label>Service category</label><select value={selectedCredit.serviceCategory ?? ""} onChange={(event) => updateCredit("serviceCategory", event.target.value)}><option value="">none</option><option value="live_sales_agent">live_sales_agent</option><option value="growth_intelligence">growth_intelligence</option><option value="drone_video">drone_video</option></select></div>
            <div className="field"><label>Render queue</label><input value={selectedCredit.renderQueue ?? ""} onChange={(event) => updateCredit("renderQueue", event.target.value)} /></div>
            <div className="field"><label>Monthly legacy env</label><input value={selectedCredit.monthlyStripePriceEnv ?? ""} onChange={(event) => updateCredit("monthlyStripePriceEnv", event.target.value)} placeholder="STRIPE_PRICE_PRO_MONTHLY" /></div>
            <div className="field"><label>Yearly legacy env</label><input value={selectedCredit.yearlyStripePriceEnv ?? ""} onChange={(event) => updateCredit("yearlyStripePriceEnv", event.target.value)} placeholder="STRIPE_PRICE_PRO_YEARLY" /></div>
            <div className="field"><label>Top-up legacy env</label><input value={selectedCredit.stripePriceEnv ?? ""} onChange={(event) => updateCredit("stripePriceEnv", event.target.value)} placeholder="STRIPE_PRICE_TOPUP_CREATOR" /></div>
            <div className="field"><label>Monthly direct checkout URL</label><input value={selectedCredit.monthlyPaymentLinkUrl ?? ""} onChange={(event) => updateCredit("monthlyPaymentLinkUrl", event.target.value)} placeholder="https://checkout.example.com/..." /></div>
            <div className="field"><label>Yearly direct checkout URL</label><input value={selectedCredit.yearlyPaymentLinkUrl ?? ""} onChange={(event) => updateCredit("yearlyPaymentLinkUrl", event.target.value)} placeholder="https://checkout.example.com/..." /></div>
            <div className="field"><label>One-time direct checkout URL</label><input value={selectedCredit.paymentLinkUrl ?? ""} onChange={(event) => updateCredit("paymentLinkUrl", event.target.value)} placeholder="https://checkout.example.com/..." /></div>
            <div className="field admin-notes-field"><label>Description</label><textarea value={selectedCredit.description} onChange={(event) => updateCredit("description", event.target.value)} /></div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="button" onClick={() => setMessage("Package draft updated in this page. Use Save to platform config to publish it.")}>Apply package changes</button>
            <button className="btn secondary" type="button" onClick={deleteCreditPlan}>Remove selected package</button>
          </div>
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Production package editor</span>
        <h2>Production packages</h2>
        <p style={{ color: "var(--muted)" }}>Website, SaaS, mobile app, e-commerce, video, AI Live Sales Agent and file delivery packages can be edited, added or removed here. For Live Sales Agent, write the price, fair-use hours and API usage policy in the name/description/features.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={() => addProductionPlan()}>Add production package</button>
          <button className="btn secondary" type="button" onClick={() => addProductionPlan("live_sales_agent")}>Add AI Live Sales Agent package</button>
        </div>
        <div className="admin-package-grid" style={{ marginTop: 14 }}>
          {groupedProductionPlans.map((group) => (
            <div className="card admin-category-card" key={group.type.id}>
              <span className="badge">{group.type.id}</span>
              <h2>{group.type.label}</h2>
              <div className="plan-feature-groups">
                {group.plans.map((plan) => (
                  <button className={`admin-inline-select ${selectedProduction.id === plan.id ? "active" : ""}`} key={plan.id} type="button" onClick={() => setSelectedProductionId(plan.id)}>
                    <b>{plan.name} · {plan.credits.toLocaleString()} credits</b>
                    <small>{plan.description}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="card selected-billing-card" style={{ marginTop: 14 }}>
          <span className="badge">Selected production package</span>
          <h2>{selectedProduction.name}</h2>
          <div className="admin-production-editor">
            <div className="field"><label>Package ID</label><input value={selectedProduction.id} onChange={(event) => updateProduction("id", event.target.value)} /></div>
            <div className="field"><label>Production type</label><select value={selectedProduction.productionType} onChange={(event) => updateProduction("productionType", event.target.value)}>{productionTypes.map((type) => <option value={type.id} key={type.id}>{type.label}</option>)}</select></div>
            <div className="field"><label>Name</label><input value={selectedProduction.name} onChange={(event) => updateProduction("name", event.target.value)} /></div>
            <div className="field"><label>Credits</label><input type="number" value={selectedProduction.credits} onChange={(event) => updateProduction("credits", event.target.value)} /></div>
            <div className="field admin-notes-field"><label>Description</label><textarea value={selectedProduction.description} onChange={(event) => updateProduction("description", event.target.value)} /></div>
            <div className="field admin-notes-field"><label>Features / deliverables, one per line</label><textarea value={selectedProduction.deliverables.join("\n")} onChange={(event) => updateProduction("deliverables", event.target.value)} /></div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="button" onClick={() => setMessage("Production package draft updated in the admin page. Use Save to platform config to publish it.")}>Apply production package changes</button>
            <button className="btn secondary" type="button" onClick={deleteProductionPlan}>Remove selected production package</button>
          </div>
        </div>
      </section>
    </div>
  );
}
