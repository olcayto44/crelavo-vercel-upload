"use client";

import { useMemo, useState } from "react";
import { partnerCommissionTiers, partnerPackageCommissionRules, partnerStatusCommissionAdjustments } from "@/lib/partner-program";

export function PartnerCommissionSimulator() {
  const [tierId, setTierId] = useState(partnerCommissionTiers[1]?.id ?? "growth_creator");
  const [packageGroup, setPackageGroup] = useState(partnerPackageCommissionRules[2]?.packageGroup ?? "Growth Intelligence service plans");
  const [status, setStatus] = useState("approved");
  const [overridePercent, setOverridePercent] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("499");

  const result = useMemo(() => {
    const tier = partnerCommissionTiers.find((item) => item.id === tierId) ?? partnerCommissionTiers[0];
    const packageRule = partnerPackageCommissionRules.find((item) => item.packageGroup === packageGroup) ?? partnerPackageCommissionRules[0];
    const adjustment = partnerStatusCommissionAdjustments.find((item) => item.status === status) ?? partnerStatusCommissionAdjustments[0];
    const manual = Number(overridePercent);
    const amount = Number(purchaseAmount) || 0;
    const marginProtectedPercent = Math.min(tier.defaultPercent, packageRule.defaultPercent);
    const basePercent = Number.isFinite(manual) && overridePercent.trim() !== "" ? Math.max(0, Math.min(60, manual)) : marginProtectedPercent;
    const adjustedPercent = adjustment.adjustment <= -100 ? 0 : Math.max(0, Math.min(60, basePercent + adjustment.adjustment));
    return {
      tier,
      packageRule,
      adjustment,
      amount,
      basePercent,
      adjustedPercent,
      commission: Number(((amount * adjustedPercent) / 100).toFixed(2))
    };
  }, [overridePercent, packageGroup, purchaseAmount, status, tierId]);

  return (
    <section className="card admin-wide-card" style={{ marginTop: 20 }}>
      <span className="badge">Commission editor preview</span>
      <h2>Adjust commission by package margin, tier, status and custom override</h2>
      <p style={{ color: "var(--muted)" }}>This is the admin-side calculation UI. After API/database setup, these values can be saved per partner and used for payout records. The default calculation protects margin by using the lower of partner-tier percent and package-margin percent unless admin overrides it.</p>
      <div className="brief-two-col">
        <div className="field">
          <label>Partner tier</label>
          <select value={tierId} onChange={(event) => setTierId(event.target.value)}>
            {partnerCommissionTiers.map((tier) => <option value={tier.id} key={tier.id}>{tier.label} — {tier.defaultPercent}%</option>)}
          </select>
        </div>
        <div className="field">
          <label>Partner status</label>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {partnerStatusCommissionAdjustments.map((item) => <option value={item.status} key={item.status}>{item.label}</option>)}
          </select>
        </div>
      </div>
      <div className="brief-two-col">
        <div className="field">
          <label>Package margin group</label>
          <select value={packageGroup} onChange={(event) => setPackageGroup(event.target.value)}>
            {partnerPackageCommissionRules.map((rule) => <option value={rule.packageGroup} key={rule.packageGroup}>{rule.packageGroup} — {rule.defaultPercent}%</option>)}
          </select>
        </div>
        <div className="field"><label>Purchase amount ($)</label><input value={purchaseAmount} onChange={(event) => setPurchaseAmount(event.target.value)} placeholder="499" /></div>
      </div>
      <div className="brief-two-col">
        <div className="field"><label>Custom commission override (%)</label><input value={overridePercent} onChange={(event) => setOverridePercent(event.target.value)} placeholder="Optional manual approval, example: 22" /></div>
        <div className="field"><label>Selected margin note</label><input value={result.packageRule.marginProfile} readOnly /></div>
      </div>
      <div className="admin-info-grid" style={{ marginTop: 16 }}>
        <div><span>Base percent</span><strong>{result.basePercent}%</strong><small>{result.tier.followerRange}</small></div>
        <div><span>Status adjustment</span><strong>{result.adjustment.adjustment > 0 ? `+${result.adjustment.adjustment}%` : result.adjustment.adjustment <= -100 ? "Paused" : "No change"}</strong><small>{result.adjustment.note}</small></div>
        <div><span>Final commission</span><strong>{result.adjustedPercent}%</strong><small>Clamped between 0% and 60%</small></div>
        <div><span>Estimated payout</span><strong>${result.commission.toLocaleString()}</strong><small>For ${result.amount.toLocaleString()} purchase</small></div>
      </div>
    </section>
  );
}
