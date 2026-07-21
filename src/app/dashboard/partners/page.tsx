import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { DEFAULT_PARTNER_CODE, cleanPartnerCode, normalizePartnerCode, partnerAssets, partnerCodeLookupCandidates, partnerCommissionDefaults, partnerLaunchChecklist, partnerPaymentProfiles, partnerPayoutReportingWindows, partnerReadinessChecks, partnerReferralLinks, partnerReferredMembers, partnerWorkflowStages } from "@/lib/partner-program";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type LiveReferralMember = typeof partnerReferredMembers[number];

type PartnerDashboardData = {
  source: "supabase" | "sample";
  partnerCode: string;
  paymentProfile: typeof partnerPaymentProfiles[number] | undefined;
  referralLink: typeof partnerReferralLinks[number] | undefined;
  ownReferrals: LiveReferralMember[];
};

function canonicalizePartnerPath(path: unknown, canonicalCode: string, fallbackPath: string) {
  const value = String(path ?? fallbackPath);
  return value.replace(/CLIPORA-(AITOOLS|NOCODE|AGENCY)/g, canonicalCode);
}

async function loadPartnerDashboardData(requestedCode: string, siteUrl: string): Promise<PartnerDashboardData> {
  const canonicalCode = normalizePartnerCode(requestedCode);
  const lookupCodes = partnerCodeLookupCandidates(requestedCode);
  const fallbackCode = canonicalCode || DEFAULT_PARTNER_CODE;
  const fallbackReferrals = partnerReferredMembers.filter((member) => member.partnerCode === fallbackCode || (!requestedCode && member.partnerCode === DEFAULT_PARTNER_CODE));
  const fallbackPaymentProfile = partnerPaymentProfiles.find((profile) => profile.partnerCode === fallbackCode) ?? partnerPaymentProfiles.find((profile) => profile.partnerCode === DEFAULT_PARTNER_CODE);
  const fallbackReferralLink = partnerReferralLinks.find((link) => link.partnerCode === fallbackCode) ?? partnerReferralLinks.find((link) => link.partnerCode === DEFAULT_PARTNER_CODE);

  if (!requestedCode) {
    return { source: "sample", partnerCode: DEFAULT_PARTNER_CODE, paymentProfile: fallbackPaymentProfile, referralLink: fallbackReferralLink, ownReferrals: partnerReferredMembers.filter((member) => member.partnerCode === DEFAULT_PARTNER_CODE) };
  }

  try {
    const supabase = supabaseAdmin();
    const { data: profile } = await supabase
      .from("partner_profiles")
      .select("partner_name,email,partner_code,status,commission_percent,tier,payout_status,payout_method,payout_email,bank_name,bank_account_holder,bank_iban,bank_swift,payout_verified_at,updated_at")
      .in("partner_code", lookupCodes)
      .limit(1)
      .maybeSingle();

    const { data: links } = await supabase
      .from("partner_referral_links")
      .select("link_type,path,status")
      .in("partner_code", lookupCodes);

    const { data: signupEvents } = await supabase
      .from("partner_referral_events")
      .select("email,event_type,created_at,metadata")
      .in("partner_code", lookupCodes)
      .eq("event_type", "signup")
      .order("created_at", { ascending: false })
      .limit(36);

    const { data: commissions } = await supabase
      .from("partner_commission_ledger")
      .select("customer_email,purchase_category,package_name,purchase_amount,commission_percent,commission_amount,payout_status,created_at")
      .in("partner_code", lookupCodes)
      .order("created_at", { ascending: false })
      .limit(36);

    if (!profile && !links?.length && !signupEvents?.length && !commissions?.length) {
      return { source: "sample", partnerCode: fallbackCode, paymentProfile: fallbackPaymentProfile, referralLink: fallbackReferralLink, ownReferrals: fallbackReferrals };
    }

    const linkByType = new Map((links ?? []).map((link) => [String(link.link_type), link]));
    const referralLink = {
      partnerCode: canonicalCode,
      slug: canonicalCode.toLowerCase(),
      status: String(profile?.status ?? linkByType.get("main")?.status ?? "active"),
      primaryPath: canonicalizePartnerPath(linkByType.get("main")?.path, canonicalCode, `/?ref=${canonicalCode}`),
      affiliatePath: canonicalizePartnerPath(linkByType.get("affiliate")?.path, canonicalCode, `/affiliate?ref=${canonicalCode}`),
      growthIntelligencePath: canonicalizePartnerPath(linkByType.get("growth_intelligence")?.path, canonicalCode, `/growth-intelligence?ref=${canonicalCode}`),
      dashboardPath: `/dashboard/partners?code=${canonicalCode}`,
      shareText: `Try Crelavo with my partner link: ${siteUrl}/?ref=${canonicalCode}`,
      note: profile?.partner_name ? `${profile.partner_name} partner dashboard` : "Live Supabase partner dashboard"
    };

    const paymentProfile = profile ? {
      partnerCode: canonicalCode,
      partner: String(profile.partner_name ?? "Approved partner"),
      email: String(profile.email ?? ""),
      payoutMethod: String(profile.payout_method ?? "Bank transfer"),
      accountHolder: String(profile.bank_account_holder ?? "Pending bank details"),
      bankName: String(profile.bank_name ?? "Pending"),
      iban: String(profile.bank_iban ?? "Pending"),
      swift: String(profile.bank_swift ?? "Pending"),
      country: String(profile.payout_email ?? profile.email ?? "Pending payout email"),
      lastIp: "",
      lastCountry: "",
      lastCity: "",
      status: String(profile.payout_status ?? "pending_bank_details"),
      lastUpdated: profile.updated_at ? new Date(String(profile.updated_at)).toLocaleDateString("en-US") : "Not updated yet",
      changePolicy: profile.payout_verified_at ? "Payout details are finance-verified. Email finance before any change." : "Partner must email finance before payout details are changed."
    } : undefined;

    const commissionByEmail = new Map((commissions ?? []).map((commission) => [String(commission.customer_email).toLowerCase(), commission]));
    const signupMembers = (signupEvents ?? []).map((event) => {
      const email = String(event.email ?? "unknown@example.com").toLowerCase();
      const commission = commissionByEmail.get(email);
      return {
        partnerCode: canonicalCode,
        memberName: email.split("@")[0] || "Referred member",
        memberEmail: email,
        signupDate: event.created_at ? new Date(String(event.created_at)).toLocaleDateString("en-US") : "Unknown",
        sourceChannel: "Referral signup",
        status: commission ? "paid" : "signed_up",
        packageCategory: String(commission?.purchase_category ?? "No purchase"),
        purchasedPlan: String(commission?.package_name ?? "No package yet"),
        purchaseAmountUsd: Number(commission?.purchase_amount ?? 0),
        commissionPercent: Number(commission?.commission_percent ?? 0),
        commissionUsd: Number(commission?.commission_amount ?? 0),
        payoutStatus: String(commission?.payout_status ?? "no commission yet"),
        period: "weekly"
      };
    });

    const signupEmails = new Set(signupMembers.map((member) => member.memberEmail));
    const commissionOnlyMembers = (commissions ?? [])
      .filter((commission) => !signupEmails.has(String(commission.customer_email).toLowerCase()))
      .map((commission) => ({
        partnerCode: canonicalCode,
        memberName: String(commission.customer_email).split("@")[0] || "Paid customer",
        memberEmail: String(commission.customer_email).toLowerCase(),
        signupDate: commission.created_at ? new Date(String(commission.created_at)).toLocaleDateString("en-US") : "Unknown",
        sourceChannel: "Manual purchase attribution",
        status: "paid",
        packageCategory: String(commission.purchase_category),
        purchasedPlan: String(commission.package_name),
        purchaseAmountUsd: Number(commission.purchase_amount ?? 0),
        commissionPercent: Number(commission.commission_percent ?? 0),
        commissionUsd: Number(commission.commission_amount ?? 0),
        payoutStatus: String(commission.payout_status ?? "pending_review"),
        period: "weekly"
      }));

    return { source: "supabase", partnerCode: canonicalCode, paymentProfile, referralLink, ownReferrals: [...signupMembers, ...commissionOnlyMembers] };
  } catch {
    return { source: "sample", partnerCode: fallbackCode, paymentProfile: fallbackPaymentProfile, referralLink: fallbackReferralLink, ownReferrals: fallbackReferrals };
  }
}

export default async function DashboardPartnersPage({ searchParams }: { searchParams?: Promise<{ code?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com";
  const requestedCode = cleanPartnerCode(resolvedSearchParams?.code);
  const { source, partnerCode, paymentProfile, referralLink, ownReferrals } = await loadPartnerDashboardData(requestedCode, siteUrl);
  const paidReferrals = ownReferrals.filter((member) => member.status === "paid");
  const noPurchaseReferrals = ownReferrals.filter((member) => member.status !== "paid");
  const totalRevenue = paidReferrals.reduce((sum, member) => sum + member.purchaseAmountUsd, 0);
  const totalCommission = paidReferrals.reduce((sum, member) => sum + member.commissionUsd, 0);
  const primaryReferralUrl = `${siteUrl}${referralLink?.primaryPath ?? `/?ref=${partnerCode}`}`;
  const affiliateReferralUrl = `${siteUrl}${referralLink?.affiliatePath ?? `/affiliate?ref=${partnerCode}`}`;
  const growthReferralUrl = `${siteUrl}${referralLink?.growthIntelligencePath ?? `/growth-intelligence?ref=${partnerCode}`}`;
  const payoutChangeEmail = `mailto:finance@crelavo.com?subject=${encodeURIComponent(`Affiliate payout details change request - ${partnerCode}`)}&body=${encodeURIComponent("Please review my affiliate payout details change request.\n\nPartner code:\nCurrent account holder:\nCurrent IBAN:\nRequested change:\nReason for change:\n")}`;

  return (
    <DashboardShell className="dashboard-postlaunch-shell">
      <section className="card">
        <span className="badge">Partner Rewards</span>
        <h1 style={{ marginTop: 8 }}>Referral and partner program</h1>
          <p style={{ color: "var(--muted)" }}>This area helps approved users and creators manage referral links, campaign assets, commission review and payout preparation from one partner dashboard.</p>
        <p className="workspace-action-note">Partner dashboard source: {source === "supabase" ? "Supabase partner profile, referral events and commission ledger" : "Sample fallback partner data"}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Link className="btn" href="/affiliate">Apply as partner</Link>
          <Link className="btn secondary" href="/dashboard/growth">Growth rewards</Link>
        </div>
      </section>

      <section className="admin-info-grid" style={{ marginTop: 20 }}>
        <div><span>Your partner code</span><strong>{partnerCode}</strong><small>Use this code in your approved referral links</small></div>
        <div><span>Referred members</span><strong>{ownReferrals.length}</strong><small>{paidReferrals.length} paid · {noPurchaseReferrals.length} no purchase yet</small></div>
        <div><span>Attributed sales</span><strong>${totalRevenue.toLocaleString()}</strong><small>Gross referred package value</small></div>
        <div><span>Estimated commission</span><strong>${totalCommission.toLocaleString()}</strong><small>Before final approval and Monday payout</small></div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <span className="badge">Payout bank details</span>
        <h2>Your affiliate payout account</h2>
        <p style={{ color: "var(--muted)" }}>After your partner account is approved, add and confirm your bank details here before your first Monday payout. For security, payout details cannot be silently changed; if you need to update them later, email finance so the change can be verified.</p>
        {paymentProfile ? (
          <div className="admin-info-grid">
            <div><span>Account holder</span><strong>{paymentProfile.accountHolder}</strong><small>{paymentProfile.payoutMethod}</small></div>
            <div><span>Bank</span><strong>{paymentProfile.bankName}</strong><small>{paymentProfile.country} · {paymentProfile.swift}</small></div>
            <div><span>IBAN</span><strong>{paymentProfile.iban}</strong><small>Status: {paymentProfile.status.replaceAll("_", " ")}</small></div>
            <div><span>Last updated</span><strong>{paymentProfile.lastUpdated}</strong><small>{paymentProfile.changePolicy}</small></div>
          </div>
        ) : <p className="workspace-action-note warning">No payout bank details are saved yet. Add bank account holder, bank name, IBAN/SWIFT and payout country after approval.</p>}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <a className="btn" href={payoutChangeEmail}>Email payout details change</a>
          <Link className="btn secondary" href="/affiliate#apply">Review partner terms</Link>
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <span className="badge">Weekly payout schedule</span>
        <h2>Commissions are collected weekly and paid every Monday</h2>
        <p style={{ color: "var(--muted)" }}>{partnerCommissionDefaults.payoutSchedule}</p>
        <div className="admin-info-grid">
          {partnerPayoutReportingWindows.map((window) => (
            <div key={window.value}>
              <span>{window.label} view</span>
              <strong>{window.label}</strong>
              <small>{window.note}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="grid" style={{ marginTop: 20 }}>
        <div className="card">
          <span className="badge">Your partner sharing links</span>
          <h2>Share these links from your own account</h2>
          <p style={{ color: "var(--muted)" }}>After approval, this is the link set the partner can place in bio links, YouTube descriptions, TikTok comments, newsletters, LinkedIn posts or agency proposals. The <strong>ref</strong> code connects signups and purchases back to this partner.</p>
          <div className="admin-info-grid" style={{ marginTop: 12 }}>
            <div><span>Main referral link</span><strong style={{ wordBreak: "break-all" }}>{primaryReferralUrl}</strong><small>General Crelavo homepage link</small></div>
            <div><span>Affiliate page link</span><strong style={{ wordBreak: "break-all" }}>{affiliateReferralUrl}</strong><small>For inviting other partners or explaining the program</small></div>
            <div><span>Growth Intelligence link</span><strong style={{ wordBreak: "break-all" }}>{growthReferralUrl}</strong><small>Best high-ticket recurring service offer</small></div>
            <div><span>Partner slug</span><strong>{referralLink?.slug ?? partnerCode.toLowerCase()}</strong><small>{referralLink?.status.replaceAll("_", " ") ?? "ready after tracking"}</small></div>
          </div>
          <p className="workspace-action-note warning" style={{ marginTop: 12 }}>Referral links and codes are prepared here. Paid attribution is reviewed against payment records before commissions are approved.</p>
        </div>
        <div className="card">
            <span className="badge">Creator asset pack</span>
            <h2>What you will promote</h2>
            <ul>{partnerAssets.map((asset) => <li key={asset.title}>{asset.title}: {asset.detail}</li>)}</ul>
            <div className="workspace-action-note" style={{ marginTop: 12 }}>
              <strong>Suggested share text:</strong> {referralLink?.shareText ?? "Try Crelavo with my partner link."}<br />
              <strong>Use case:</strong> {referralLink?.note ?? "Use this link in your content, bio, newsletter or agency proposal."}
            </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <span className="badge">Your referred members</span>
        <h2>See who signed up, who bought a package and what commission was earned</h2>
        <p style={{ color: "var(--muted)" }}>This partner ledger shows referral activity, paid package status and estimated commission before finance approval.</p>
        <div className="admin-category-grid">
          {ownReferrals.map((member) => (
            <div className="card admin-category-card" key={`${member.partnerCode}-${member.memberEmail}`}>
              <span className="badge">{member.status === "paid" ? "Paid package" : "No package yet"}</span>
              <h3>{member.memberName}</h3>
              <p><strong>Email:</strong> {member.memberEmail}</p>
              <p><strong>Signup date:</strong> {member.signupDate}</p>
              <p><strong>Source:</strong> {member.sourceChannel}</p>
              <p><strong>Package:</strong> {member.purchasedPlan}</p>
              <p><strong>Category:</strong> {member.packageCategory}</p>
              <p><strong>Sale amount:</strong> ${member.purchaseAmountUsd.toLocaleString()}</p>
              <p><strong>Commission rate:</strong> {member.commissionPercent}%</p>
              <p><strong>Your earning:</strong> ${member.commissionUsd.toLocaleString()}</p>
              <p><strong>Payout status:</strong> {member.payoutStatus.replaceAll("_", " ")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <span className="badge">Partner journey</span>
        <h2>What happens after approval</h2>
        <div className="admin-info-grid">
          {partnerWorkflowStages.map((stage, index) => (
            <div key={stage}><span>Step {index + 1}</span><strong>{stage}</strong><small>{index < 4 ? "Prepared now" : "Requires API tracking"}</small></div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <span className="badge">Readiness</span>
        <h2>What is already prepared</h2>
        <div className="admin-category-grid">
          {partnerReadinessChecks.map((check) => (
            <div className="card admin-category-card" key={check.label}>
              <span className="badge">{check.status}</span>
              <h3>{check.label}</h3>
              <p>{check.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <span className="badge">Final API checklist</span>
        <h2>Only these items should remain before launch</h2>
        <ul>{partnerLaunchChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </DashboardShell>
  );
}
