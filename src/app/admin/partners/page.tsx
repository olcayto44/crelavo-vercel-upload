import { AdminEmailComposer } from "@/components/AdminEmailComposer";
import { AdminShell } from "@/components/AdminShell";
import { ManualPartnerCommissionForm } from "@/components/ManualPartnerCommissionForm";
import { PartnerApplicationStatusActions } from "@/components/PartnerApplicationStatusActions";
import { PartnerCommissionSimulator } from "@/components/PartnerCommissionSimulator";
import { PartnerCommissionStatusActions } from "@/components/PartnerCommissionStatusActions";
import { PartnerPayoutDetailsForm } from "@/components/PartnerPayoutDetailsForm";
import { calculatePartnerCommission, partnerApiVisibilityRoadmap, partnerApplicationFields, partnerAssets, partnerChannelPriority, partnerCommissionDefaults, partnerCommissionTiers, partnerCreatorAssetPack, partnerEmailCampaignTemplates, partnerInboxRoutingRules, partnerLaunchChecklist, partnerLaunchSequence, partnerPackageCommissionRules, partnerPaymentProfiles, partnerPayoutReportingWindows, partnerPerformanceSummary, partnerProgramPolicy, partnerPurchaseAttribution, partnerReadinessChecks, partnerReferralLinks, partnerReferredMembers, partnerStatusCommissionAdjustments, partnerWhopOptimizationPlan, samplePartnerApplications } from "@/lib/partner-program";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  if (status === "ready") return "Ready";
  if (status === "pending_api") return "Pending API";
  if (status === "pending_final_decision") return "Needs decision";
  return status.replace(/_/g, " ");
}

function statusClass(status: string) {
  if (status === "ready") return "ready";
  if (status === "pending_api") return "active";
  return "failed";
}

function mailtoLink(to: string, subject: string, body: string) {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

type AdminPartnerApplication = typeof samplePartnerApplications[number] & { id?: string };

type PartnerApplicationRow = {
  id: string;
  full_name: string;
  email: string;
  channel_type: string;
  channel_url: string;
  audience_size: string | null;
  main_audience: string;
  status: string;
  inbox: string;
  application_ip: string | null;
  application_country: string | null;
  application_city: string | null;
  created_at: string;
};

type AdminReferralLink = typeof partnerReferralLinks[number];

type PartnerReferralLinkRow = {
  partner_code: string;
  link_type: string;
  path: string;
  full_url: string | null;
  status: string;
  partner_profiles: {
    partner_name: string | null;
    email: string | null;
  }[] | null;
};

type PartnerCommissionRow = {
  id: string;
  partner_code: string;
  customer_email: string;
  purchase_category: string;
  package_name: string;
  purchase_amount: number;
  commission_percent: number;
  commission_amount: number;
  currency: string;
  source: string;
  payment_reference: string | null;
  payout_status: string;
  payout_window: string | null;
  admin_notes: string | null;
  created_at: string;
};

type AdminPartnerPaymentProfile = {
  partnerCode: string;
  partner: string;
  email: string;
  payoutMethod: string;
  payoutEmail: string;
  accountHolder: string;
  bankName: string;
  iban: string;
  swift: string;
  status: string;
  lastUpdated: string;
  verifiedAt: string;
  payoutNotes: string;
  changePolicy: string;
};

type PartnerProfileRow = {
  partner_name: string | null;
  email: string | null;
  partner_code: string;
  payout_method: string | null;
  payout_email: string | null;
  bank_name: string | null;
  bank_account_holder: string | null;
  bank_iban: string | null;
  bank_swift: string | null;
  payout_status: string | null;
  payout_verified_at: string | null;
  payout_notes: string | null;
  updated_at: string | null;
};

async function loadPartnerApplications(): Promise<{ applications: AdminPartnerApplication[]; source: "supabase" | "sample" }> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("partner_applications")
      .select("id,full_name,email,channel_type,channel_url,audience_size,main_audience,status,inbox,application_ip,application_country,application_city,created_at")
      .order("created_at", { ascending: false })
      .limit(24);

    if (error || !data?.length) return { applications: samplePartnerApplications, source: "sample" };

    const applications = (data as PartnerApplicationRow[]).map((row) => ({
      id: row.id,
      name: row.full_name,
      email: row.email,
      channel: row.channel_type,
      channelUrl: row.channel_url,
      audience: row.main_audience,
      audienceSize: row.audience_size ?? "Not provided",
      status: row.status,
      submittedAt: new Date(row.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
      ip: row.application_ip ?? "Unknown IP",
      country: row.application_country ?? "Unknown",
      city: row.application_city ?? "Unknown",
      inbox: row.inbox,
      nextAction: row.status === "pending" ? "Review channel fit, then approve or reject with one-click email." : "Continue partner review workflow."
    }));

    return { applications, source: "supabase" };
  } catch {
    return { applications: samplePartnerApplications, source: "sample" };
  }
}

async function loadPartnerReferralLinks(siteUrl: string): Promise<{ referralLinks: AdminReferralLink[]; source: "supabase" | "sample" }> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("partner_referral_links")
      .select("partner_code,link_type,path,full_url,status,partner_profiles(partner_name,email)")
      .order("created_at", { ascending: false })
      .limit(72);

    if (error || !data?.length) return { referralLinks: partnerReferralLinks, source: "sample" };

    const grouped = new Map<string, AdminReferralLink>();

    for (const row of data as PartnerReferralLinkRow[]) {
      const profile = row.partner_profiles?.[0];
      const current = grouped.get(row.partner_code) ?? {
        partnerCode: row.partner_code,
        slug: row.partner_code.toLowerCase(),
        primaryPath: `/?ref=${row.partner_code}`,
        affiliatePath: `/affiliate?ref=${row.partner_code}`,
        growthIntelligencePath: `/growth-intelligence?ref=${row.partner_code}`,
        dashboardPath: `/dashboard/partners?code=${row.partner_code}`,
        status: row.status,
        shareText: `Use my Crelavo partner link to try AI production workflows: ${siteUrl}/?ref=${row.partner_code}`,
        note: profile?.partner_name ? `${profile.partner_name} · ${profile.email ?? "no email"}` : "Live Supabase referral link"
      };

      if (row.link_type === "main") current.primaryPath = row.path;
      if (row.link_type === "affiliate") current.affiliatePath = row.path;
      if (row.link_type === "growth_intelligence") current.growthIntelligencePath = row.path;
      current.status = row.status;
      grouped.set(row.partner_code, current);
    }

    return { referralLinks: Array.from(grouped.values()), source: "supabase" };
  } catch {
    return { referralLinks: partnerReferralLinks, source: "sample" };
  }
}

async function loadCommissionLedger(): Promise<{ commissions: PartnerCommissionRow[]; source: "supabase" | "sample" }> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("partner_commission_ledger")
      .select("id,partner_code,customer_email,purchase_category,package_name,purchase_amount,commission_percent,commission_amount,currency,source,payment_reference,payout_status,payout_window,admin_notes,created_at")
      .order("created_at", { ascending: false })
      .limit(36);

    if (error || !data?.length) return { commissions: [], source: "sample" };
    return { commissions: data as PartnerCommissionRow[], source: "supabase" };
  } catch {
    return { commissions: [], source: "sample" };
  }
}

async function loadPartnerPaymentProfiles(): Promise<{ paymentProfiles: AdminPartnerPaymentProfile[]; source: "supabase" | "sample" }> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("partner_profiles")
      .select("partner_name,email,partner_code,payout_method,payout_email,bank_name,bank_account_holder,bank_iban,bank_swift,payout_status,payout_verified_at,payout_notes,updated_at")
      .order("updated_at", { ascending: false })
      .limit(36);

    if (error || !data?.length) {
      return {
        paymentProfiles: partnerPaymentProfiles.map((profile) => ({
          partnerCode: profile.partnerCode,
          partner: profile.partner,
          email: profile.email,
          payoutMethod: profile.payoutMethod,
          payoutEmail: profile.email,
          accountHolder: profile.accountHolder,
          bankName: profile.bankName,
          iban: profile.iban,
          swift: profile.swift,
          status: profile.status,
          lastUpdated: profile.lastUpdated,
          verifiedAt: "Not verified yet",
          payoutNotes: "Sample payout profile",
          changePolicy: profile.changePolicy
        })),
        source: "sample"
      };
    }

    const paymentProfiles = (data as PartnerProfileRow[]).map((profile) => ({
      partnerCode: profile.partner_code,
      partner: profile.partner_name ?? "Approved partner",
      email: profile.email ?? "",
      payoutMethod: profile.payout_method ?? "Bank transfer",
      payoutEmail: profile.payout_email ?? profile.email ?? "",
      accountHolder: profile.bank_account_holder ?? "Pending account holder",
      bankName: profile.bank_name ?? "Pending bank name",
      iban: profile.bank_iban ?? "Pending IBAN",
      swift: profile.bank_swift ?? "Pending SWIFT",
      status: profile.payout_status ?? "pending_bank_details",
      lastUpdated: profile.updated_at ? new Date(profile.updated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Not updated yet",
      verifiedAt: profile.payout_verified_at ? new Date(profile.payout_verified_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Not verified yet",
      payoutNotes: profile.payout_notes ?? "No finance note yet",
      changePolicy: "Partner payout details changes should be verified by finance before the next 30-day payout review."
    }));

    return { paymentProfiles, source: "supabase" };
  } catch {
    return {
      paymentProfiles: partnerPaymentProfiles.map((profile) => ({
        partnerCode: profile.partnerCode,
        partner: profile.partner,
        email: profile.email,
        payoutMethod: profile.payoutMethod,
        payoutEmail: profile.email,
        accountHolder: profile.accountHolder,
        bankName: profile.bankName,
        iban: profile.iban,
        swift: profile.swift,
        status: profile.status,
        lastUpdated: profile.lastUpdated,
        verifiedAt: "Not verified yet",
        payoutNotes: "Sample payout profile",
        changePolicy: profile.changePolicy
      })),
      source: "sample"
    };
  }
}

export default async function AdminPartnersPage() {
  const { applications: partnerApplications, source: partnerApplicationSource } = await loadPartnerApplications();
  const totalReferredUsers = partnerPerformanceSummary.reduce((sum, item) => sum + item.referredUsers, 0);
  const totalPayingUsers = partnerPerformanceSummary.reduce((sum, item) => sum + item.payingUsers, 0);
  const totalRevenue = partnerPerformanceSummary.reduce((sum, item) => sum + item.totalRevenueUsd, 0);
  const totalEstimatedCommission = partnerPerformanceSummary.reduce((sum, item) => sum + item.estimatedCommissionUsd, 0);
  const registeredPartners = partnerPerformanceSummary.length;
  const trackedReferredMembers = partnerReferredMembers.length;
  const noPurchaseMembers = partnerReferredMembers.filter((member) => member.status !== "paid").length;
  const dailyCommission = partnerReferredMembers.filter((member) => member.period === "daily").reduce((sum, member) => sum + member.commissionUsd, 0);
  const weeklyCommission = partnerReferredMembers.filter((member) => member.period === "weekly").reduce((sum, member) => sum + member.commissionUsd, 0);
  const monthlyCommission = partnerReferredMembers.filter((member) => member.period === "monthly").reduce((sum, member) => sum + member.commissionUsd, 0);
  const approvalTemplate = partnerEmailCampaignTemplates.find((template) => template.label === "Approval email") ?? partnerEmailCampaignTemplates[0];
  const rejectionTemplate = partnerEmailCampaignTemplates.find((template) => template.label === "Rejection email") ?? partnerEmailCampaignTemplates[0];
  const bankInfoTemplate = partnerEmailCampaignTemplates.find((template) => template.label === "Bank info reminder") ?? partnerEmailCampaignTemplates[0];
  const bulkPartnerEmail = mailtoLink(partnerPaymentProfiles.map((profile) => profile.email).join(","), bankInfoTemplate.subject, bankInfoTemplate.body);
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com";
  const { referralLinks: adminReferralLinks, source: referralLinkSource } = await loadPartnerReferralLinks(siteUrl);
  const { commissions: adminCommissions, source: commissionLedgerSource } = await loadCommissionLedger();
  const { paymentProfiles: adminPaymentProfiles, source: paymentProfileSource } = await loadPartnerPaymentProfiles();
  const commissionExamples = [
    { label: "Credit / top-up", amount: 25, category: "credit", packageName: "Creator Top-up", status: "paid" },
    { label: "Standard production", amount: 199, category: "production", packageName: "Ultra monthly", status: "paid" },
    { label: "Growth Intelligence", amount: 499, category: "growth intelligence", packageName: "Growth Intelligence Agent monthly", status: "paid" },
    { label: "Refunded production", amount: 199, category: "production", packageName: "Ultra monthly", status: "refunded" }
  ].map((item) => ({ ...item, result: calculatePartnerCommission(item.amount, item.category, item.packageName, item.status) }));

  return (
    <AdminShell title="Partner Program" description="Prepare affiliate/referral applications, creator assets, commission placeholders and launch blockers before payout/API connection.">
      <section className="card admin-wide-card">
        <span className="badge">API-ready partner system</span>
        <h2>Partner program control center</h2>
        <p style={{ color: "var(--muted)" }}>This page keeps the affiliate system aligned with the active Whop launch path. Partner tracking starts with referral links, Whop payment references and a manual commission ledger; Lemon remains postponed until all core work is complete.</p>
        <div className="admin-info-grid">
          <div><span>Registered partners</span><strong>{registeredPartners}</strong><small>Approved/tracked partner accounts</small></div>
          <div><span>Tracked referred members</span><strong>{trackedReferredMembers}</strong><small>{noPurchaseMembers} signed up without purchase yet</small></div>
          <div><span>Commission model</span><strong>{partnerCommissionDefaults.plannedRange}</strong><small>Rates vary by package cost/margin</small></div>
          <div><span>Payout day</span><strong>{partnerCommissionDefaults.payoutDay}</strong><small>{partnerCommissionDefaults.payoutCutoff}</small></div>
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Whop affiliate optimization</span>
        <h2>Scale partners through Whop references before payout automation</h2>
        <p style={{ color: "var(--muted)" }}>This is the active 2. Grup partner plan: keep Whop as the payment source, use manual ledger controls, and only automate after one complete manual E2E path is proven.</p>
        <div className="admin-category-grid">
          {partnerWhopOptimizationPlan.map((item) => (
            <div className="card admin-category-card" key={item.title}>
              <span className="badge">{item.status.replaceAll("_", " ")}</span>
              <h3>{item.title}</h3>
              <p>{item.action}</p>
              <p className="workspace-action-note warning">{item.guardrail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Creator asset pack + API visibility</span>
        <h2>Approved partners get ready-to-use content angles, while API work stays visible</h2>
        <div className="admin-category-grid">
          {partnerCreatorAssetPack.map((asset) => (
            <div className="card admin-category-card" key={asset.asset}>
              <span className="badge">{asset.target}</span>
              <h3>{asset.asset}</h3>
              <p>{asset.copy}</p>
            </div>
          ))}
        </div>
        <ul>{partnerApiVisibilityRoadmap.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Launch commission policy</span>
        <h2>30-day attribution, 30-day payout hold and refund/cancel protection</h2>
        <p style={{ color: "var(--muted)" }}>{partnerProgramPolicy.partnerFacingSummary}</p>
        <div className="admin-info-grid">
          <div><span>Attribution</span><strong>{partnerProgramPolicy.attributionWindowDays} days</strong><small>Referral click/code must be inside window</small></div>
          <div><span>Payout hold</span><strong>{partnerProgramPolicy.payoutHoldDays} days</strong><small>Pending until refund/cancel risk clears</small></div>
          <div><span>Minimum payout</span><strong>${partnerProgramPolicy.minimumPayoutUsd}</strong><small>Finance only pays balances above minimum</small></div>
          <div><span>Recurring</span><strong>{partnerProgramPolicy.recurring}</strong><small>{partnerCommissionDefaults.recurringMode}</small></div>
        </div>
        <div className="admin-category-grid" style={{ marginTop: 14 }}>
          {commissionExamples.map((example) => (
            <div className="card admin-category-card" key={example.label}>
              <span className="badge">{example.status}</span>
              <h3>{example.label}</h3>
              <p><strong>Purchase:</strong> ${example.amount.toLocaleString()} · {example.packageName}</p>
              <p><strong>Commission:</strong> {example.result.percent}% · ${example.result.commissionUsd.toLocaleString()}</p>
              <p><strong>Status:</strong> {example.result.eligibility.replaceAll("_", " ")}</p>
            </div>
          ))}
        </div>
        <ul>{partnerProgramPolicy.payoutEligibility.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Affiliate application inbox</span>
        <h2>Review partner applications and send approve/reject emails with one click</h2>
        <p style={{ color: "var(--muted)" }}>Partner application emails should land in this affiliate inbox area, separate from normal user support replies. When you decide “approved” or “rejected”, use the one-click email actions below.</p>
        <p className="workspace-action-note">Application source: {partnerApplicationSource === "supabase" ? "Supabase partner_applications table" : "Sample fallback data"}</p>
        <div className="admin-category-grid">
          {partnerApplications.map((application) => (
            <div className="card admin-category-card" key={`${application.email}-${application.submittedAt}`}>
              <span className="badge">{application.inbox} · {application.status}</span>
              <h3>{application.name}</h3>
              <p><strong>Email:</strong> {application.email}</p>
              <p><strong>Submitted:</strong> {application.submittedAt}</p>
              <p><strong>IP / location:</strong> {application.ip} · {application.city}, {application.country}</p>
              <p><strong>Channel:</strong> {application.channel}</p>
              <p><strong>Channel URL:</strong> {application.channelUrl}</p>
              <p><strong>Audience:</strong> {application.audience}</p>
              <p><strong>Audience size:</strong> {application.audienceSize}</p>
              <p><strong>Next action:</strong> {application.nextAction}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <a className="btn" href={mailtoLink(application.email, approvalTemplate.subject, `${application.name},\n\n${approvalTemplate.body}\n\nNext steps:\n1. Log in to your Crelavo dashboard.\n2. Open Partner Program.\n3. Confirm your payout bank details.\n4. Wait for your referral code/link assignment.\n\nWelcome to Crelavo Partner Program.`)}>Approve + email</a>
                <a className="btn secondary" href={mailtoLink(application.email, rejectionTemplate.subject, `${application.name},\n\n${rejectionTemplate.body}\n\nThank you again for your interest in Crelavo.`)}>Reject + email</a>
              </div>
              <PartnerApplicationStatusActions applicationId={application.id} currentStatus={application.status} />
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Affiliate inbox routing</span>
        <h2>Keep partner emails separate from normal user support</h2>
        <div className="admin-info-grid">
          {partnerInboxRoutingRules.map((rule) => (
            <div key={rule.source}>
              <span>{rule.source}</span>
              <strong>{rule.destination}</strong>
              <small>{rule.note}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Affiliate email actions</span>
        <h2>Send individual or bulk emails to registered partners</h2>
        <p style={{ color: "var(--muted)" }}>Before a full email provider dashboard is connected, these actions prepare one-to-one or bulk messages with the correct subject/body. Later this can become a saved email campaign sender inside admin.</p>
        <AdminEmailComposer
          title="Email affiliate / partner people"
          description="Send a real email through the admin email endpoint to all registered partners or to one selected partner email."
          defaultTargetType="all_partners"
          defaultSubject={bankInfoTemplate.subject}
          defaultBody={bankInfoTemplate.body}
          allowBulkPartners
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <a className="btn" href={bulkPartnerEmail}>Email all registered partners</a>
          <a className="btn secondary" href={mailtoLink("finance@crelavo.com", "Affiliate payout details change log", "Review payout detail change requests before the next 30-day payout review.")}>Email finance team</a>
        </div>
        <div className="admin-category-grid">
          {partnerEmailCampaignTemplates.map((template) => (
            <div className="card admin-category-card" key={template.label}>
              <span className="badge">Template</span>
              <h3>{template.label}</h3>
              <p><strong>Subject:</strong> {template.subject}</p>
              <p>{template.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Payout and reporting windows</span>
        <h2>Daily, weekly, monthly and 30-day hold affiliate reporting</h2>
        <p style={{ color: "var(--muted)" }}>{partnerCommissionDefaults.payoutSchedule}</p>
        <div className="admin-info-grid">
          <div><span>Daily commission</span><strong>${dailyCommission.toLocaleString()}</strong><small>Today’s tracked commission preview</small></div>
          <div><span>Weekly commission</span><strong>${weeklyCommission.toLocaleString()}</strong><small>Weekly activity preview; payout waits 30-day hold</small></div>
          <div><span>Monthly commission</span><strong>${monthlyCommission.toLocaleString()}</strong><small>Monthly finance review preview</small></div>
          <div><span>Provider path</span><strong>Whop + manual ledger</strong><small>{partnerCommissionDefaults.payoutProvider}</small></div>
        </div>
        <div className="admin-info-grid" style={{ marginTop: 14 }}>
          {partnerPayoutReportingWindows.map((window) => (
            <div key={window.value}>
              <span>{window.label}</span>
              <strong>{window.label} report</strong>
              <small>{window.note}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Variable commission by package margin</span>
        <h2>High-cost and low-cost packages should not use the same commission rate</h2>
        <p style={{ color: "var(--muted)" }}>Affiliate commission can be selected by package group, provider/API cost, labor cost and recurring value. High-margin recurring services can receive higher commission, while custom or heavy-cost packages should require lower commission or manual approval.</p>
        <div className="admin-category-grid">
          {partnerPackageCommissionRules.map((rule) => (
            <div className="card admin-category-card" key={rule.packageGroup}>
              <span className="badge">{rule.defaultPercent}% default</span>
              <h3>{rule.packageGroup}</h3>
              <p><strong>Margin profile:</strong> {rule.marginProfile}</p>
              <p><strong>Examples:</strong> {rule.examplePackages.join(", ")}</p>
              <p>{rule.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Partner referral links</span>
        <h2>Assign and review each partner&apos;s public sharing links</h2>
        <p style={{ color: "var(--muted)" }}>Approved partners get a unique <strong>ref</strong> code. They share these links from their own social account, bio link, newsletter, video description or agency proposal. Whop source metadata and referral tracking can later convert these prepared URLs into automatic paid attribution.</p>
        <p className="workspace-action-note">Referral link source: {referralLinkSource === "supabase" ? "Supabase partner_referral_links table" : "Sample fallback data"}</p>
        <div className="admin-category-grid">
          {adminReferralLinks.map((link) => (
            <div className="card admin-category-card" key={link.partnerCode}>
              <span className="badge">{link.status.replaceAll("_", " ")}</span>
              <h3>{link.partnerCode}</h3>
              <p><strong>Slug:</strong> {link.slug}</p>
              <p><strong>Main link:</strong> <span style={{ wordBreak: "break-all" }}>{siteUrl}{link.primaryPath}</span></p>
              <p><strong>Affiliate link:</strong> <span style={{ wordBreak: "break-all" }}>{siteUrl}{link.affiliatePath}</span></p>
              <p><strong>Growth Intelligence link:</strong> <span style={{ wordBreak: "break-all" }}>{siteUrl}{link.growthIntelligencePath}</span></p>
              <p><strong>Suggested text:</strong> {link.shareText}</p>
              <p>{link.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Partner payout bank details</span>
        <h2>View and update every partner&apos;s payout account, IBAN and verification status</h2>
        <p style={{ color: "var(--muted)" }}>Use this section before any 30-day payout review. If a partner changes IBAN or bank details, they should email finance and admin should verify the update before payout.</p>
        <p className="workspace-action-note">Payout profile source: {paymentProfileSource === "supabase" ? "Supabase partner_profiles table" : "Sample fallback payout profiles"}</p>
        <div className="admin-category-grid">
          {adminPaymentProfiles.map((profile) => (
            <div className="card admin-category-card" key={profile.partnerCode}>
              <span className="badge">{profile.status.replaceAll("_", " ")}</span>
              <h3>{profile.partner}</h3>
              <p><strong>Partner code:</strong> {profile.partnerCode}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Payout email:</strong> {profile.payoutEmail || "Pending"}</p>
              <p><strong>Payout method:</strong> {profile.payoutMethod}</p>
              <p><strong>Account holder:</strong> {profile.accountHolder}</p>
              <p><strong>Bank:</strong> {profile.bankName}</p>
              <p><strong>IBAN:</strong> {profile.iban}</p>
              <p><strong>SWIFT:</strong> {profile.swift}</p>
              <p><strong>Verified at:</strong> {profile.verifiedAt}</p>
              <p><strong>Last updated:</strong> {profile.lastUpdated}</p>
              <p><strong>Finance notes:</strong> {profile.payoutNotes}</p>
              <p>{profile.changePolicy}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <a className="btn secondary" href={mailtoLink(profile.email, bankInfoTemplate.subject, bankInfoTemplate.body)}>Email partner</a>
                <a className="btn secondary" href={mailtoLink("finance@crelavo.com", `Verify payout details - ${profile.partnerCode}`, `Partner: ${profile.partner}\nEmail: ${profile.email}\nIBAN: ${profile.iban}\nStatus: ${profile.status}\nPlease verify before the next 30-day payout review.`)}>Ask finance to verify</a>
              </div>
              {paymentProfileSource === "supabase" ? (
                <PartnerPayoutDetailsForm
                  partnerCode={profile.partnerCode}
                  initialPayoutMethod={profile.payoutMethod}
                  initialPayoutEmail={profile.payoutEmail}
                  initialBankName={profile.bankName === "Pending bank name" ? "" : profile.bankName}
                  initialBankAccountHolder={profile.accountHolder === "Pending account holder" ? "" : profile.accountHolder}
                  initialBankIban={profile.iban === "Pending IBAN" ? "" : profile.iban}
                  initialBankSwift={profile.swift === "Pending SWIFT" ? "" : profile.swift}
                  initialPayoutStatus={profile.status}
                  initialPayoutNotes={profile.payoutNotes === "No finance note yet" ? "" : profile.payoutNotes}
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Partner launch sequence</span>
        <h2>Collect applications now, automate payouts later</h2>
        <div className="admin-info-grid">
          {partnerLaunchSequence.map((item, index) => (
            <div key={item.phase}>
              <span>Step {index + 1}</span>
              <strong>{item.phase}</strong>
              <small>{item.action}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Creator channel priority</span>
        <h2>Start with TikTok, YouTube Shorts and no-code creators</h2>
        <div className="admin-category-grid">
          {partnerChannelPriority.map((item) => (
            <div className="card admin-category-card" key={item.channel}>
              <span className="badge">{item.priority}</span>
              <h3>{item.channel}</h3>
              <p>{item.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Performance snapshot</span>
        <h2>Partner-driven members, purchases and estimated commission</h2>
        <div className="admin-info-grid">
          <div><span>Referred members</span><strong>{totalReferredUsers}</strong><small>Users attributed to partner codes</small></div>
          <div><span>Paying members</span><strong>{totalPayingUsers}</strong><small>Users with paid package/top-up</small></div>
          <div><span>Attributed revenue</span><strong>${totalRevenue.toLocaleString()}</strong><small>Gross revenue before refunds/taxes</small></div>
          <div><span>Estimated commission</span><strong>${totalEstimatedCommission.toLocaleString()}</strong><small>Pending payout provider/API</small></div>
        </div>
      </section>

      <section className="launch-readiness-grid" style={{ marginTop: 20 }}>
        {partnerReadinessChecks.map((check) => (
          <article className="card admin-category-card launch-readiness-group" key={check.label}>
            <span className={`provider-job-chip ${statusClass(check.status)}`}>{statusLabel(check.status)}</span>
            <h2>{check.label}</h2>
            <p>{check.note}</p>
          </article>
        ))}
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Commission tiers</span>
        <h2>Change commission by channel, follower level and partner status</h2>
        <p style={{ color: "var(--muted)" }}>These are admin-ready tier rules. When the database/API layer is connected, each partner can store an override percent, tier, status and payout eligibility.</p>
        <div className="admin-category-grid">
          {partnerCommissionTiers.map((tier) => (
            <div className="card admin-category-card" key={tier.id}>
              <span className="badge">{tier.defaultPercent}% default</span>
              <h3>{tier.label}</h3>
              <p><strong>Follower range:</strong> {tier.followerRange}</p>
              <p><strong>Channels:</strong> {tier.channels.join(", ")}</p>
              <p>{tier.approvalRule}</p>
            </div>
          ))}
        </div>
      </section>

      <PartnerCommissionSimulator />

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Manual commission ledger</span>
        <h2>Create and review manual partner purchase attribution</h2>
        <p style={{ color: "var(--muted)" }}>Use this while Whop attribution automation is not fully connected. It lets admin record a paid purchase, calculate commission and keep 30-day payout review visible.</p>
        <p className="workspace-action-note">Commission ledger source: {commissionLedgerSource === "supabase" ? "Supabase partner_commission_ledger table" : "No live commission records yet"}</p>
        <ManualPartnerCommissionForm />
        {adminCommissions.length > 0 ? (
          <div className="admin-category-grid" style={{ marginTop: 16 }}>
            {adminCommissions.map((commission) => (
              <div className="card admin-category-card" key={commission.id}>
                <span className="badge">{commission.payout_status.replaceAll("_", " ")} · {commission.source.replaceAll("_", " ")}</span>
                <h3>{commission.partner_code}</h3>
                <p><strong>Customer:</strong> {commission.customer_email}</p>
                <p><strong>Category:</strong> {commission.purchase_category}</p>
                <p><strong>Package:</strong> {commission.package_name}</p>
                <p><strong>Purchase:</strong> {commission.currency} {commission.purchase_amount.toLocaleString()}</p>
                <p><strong>Commission:</strong> {commission.commission_percent}% · {commission.currency} {commission.commission_amount.toLocaleString()}</p>
                <p><strong>Payment ref:</strong> {commission.payment_reference ?? "Manual/no reference"}</p>
                <p><strong>Payout window:</strong> {commission.payout_window ?? "Not assigned"}</p>
                <p><strong>Created:</strong> {new Date(commission.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
                {commission.admin_notes ? <p><strong>Notes:</strong> {commission.admin_notes}</p> : null}
                <PartnerCommissionStatusActions commissionId={commission.id} currentStatus={commission.payout_status} />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Status adjustments</span>
        <h2>Optional commission changes by partner status</h2>
        <div className="admin-info-grid">
          {partnerStatusCommissionAdjustments.map((item) => (
            <div key={item.status}>
              <span>{item.label}</span>
              <strong>{item.adjustment > 0 ? `+${item.adjustment}%` : item.adjustment === 0 ? "No change" : "Paused"}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Application model</span>
        <h2>Fields already planned for partner intake</h2>
        <div className="admin-info-grid">
          {partnerApplicationFields.map((field) => <div key={field}><span>Field</span><strong>{field}</strong><small>Ready for table/provider mapping</small></div>)}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Review queue summary</span>
        <h2>Partner applications are routed to the affiliate inbox</h2>
        <p style={{ color: "var(--muted)" }}>Use the Affiliate application inbox at the top of this page for approval/rejection decisions. This summary confirms the same application records stay separate from normal customer contact messages.</p>
        <div className="admin-info-grid">
          {partnerApplications.map((application) => (
            <div key={application.name}>
              <span>{application.status}</span>
              <strong>{application.name}</strong>
              <small>{application.email} · {application.channel} · {application.submittedAt} · {application.ip} · {application.city}, {application.country}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Partner performance</span>
        <h2>Who brought members, what they bought and estimated commission</h2>
        <div className="admin-category-grid">
          {partnerPerformanceSummary.map((partner) => (
            <div className="card admin-category-card" key={partner.code}>
              <span className="badge">{partner.status} · {partner.commissionPercent}%</span>
              <h3>{partner.partner}</h3>
              <p><strong>Code:</strong> {partner.code}</p>
              <p><strong>Channel:</strong> {partner.channel}</p>
              <p><strong>Tier:</strong> {partner.tier}</p>
              <p><strong>Members:</strong> {partner.referredUsers} referred / {partner.payingUsers} paying</p>
              <p><strong>Revenue:</strong> ${partner.totalRevenueUsd.toLocaleString()}</p>
              <p><strong>Estimated commission:</strong> ${partner.estimatedCommissionUsd.toLocaleString()}</p>
              <p><strong>Last conversion:</strong> {partner.lastConversion}</p>
              <p><strong>Next action:</strong> {partner.nextAction}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Referred member ledger</span>
        <h2>Daily view of who signed up, which category/package sold and what commission is owed</h2>
        <div className="admin-category-grid">
          {partnerReferredMembers.map((member) => (
            <div className="card admin-category-card" key={`${member.partnerCode}-${member.memberEmail}`}>
              <span className="badge">{member.period} · {member.status === "paid" ? "paid" : "no purchase"}</span>
              <h3>{member.memberName}</h3>
              <p><strong>Email:</strong> {member.memberEmail}</p>
              <p><strong>Partner code:</strong> {member.partnerCode}</p>
              <p><strong>Signup date:</strong> {member.signupDate}</p>
              <p><strong>Category:</strong> {member.packageCategory}</p>
              <p><strong>Package:</strong> {member.purchasedPlan}</p>
              <p><strong>Sale amount:</strong> ${member.purchaseAmountUsd.toLocaleString()}</p>
              <p><strong>Commission rate:</strong> {member.commissionPercent}%</p>
              <p><strong>Commission:</strong> ${member.commissionUsd.toLocaleString()}</p>
              <p><strong>Payout status:</strong> {member.payoutStatus.replaceAll("_", " ")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Purchase attribution</span>
        <h2>Which referred member signed up for which plan</h2>
        <div className="admin-category-grid">
          {partnerPurchaseAttribution.map((purchase) => (
            <div className="card admin-category-card" key={`${purchase.partnerCode}-${purchase.memberEmail}-${purchase.purchasedPlan}`}>
              <span className="badge">{purchase.status}</span>
              <h3>{purchase.memberEmail}</h3>
              <p><strong>Partner code:</strong> {purchase.partnerCode}</p>
              <p><strong>Signup plan:</strong> {purchase.signupPlan}</p>
              <p><strong>Purchased:</strong> {purchase.purchasedPlan}</p>
              <p><strong>Purchase amount:</strong> ${purchase.purchaseAmountUsd.toLocaleString()}</p>
              <p><strong>Commission rate:</strong> {purchase.commissionPercent}%</p>
              <p><strong>Commission:</strong> ${purchase.commissionUsd.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Creator assets</span>
        <h2>Partner asset pack status</h2>
        <div className="admin-category-grid">
          {partnerAssets.map((asset) => (
            <div className="card admin-category-card" key={asset.title}>
              <span className="badge">{asset.status}</span>
              <h3>{asset.title}</h3>
              <p>{asset.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card" style={{ marginTop: 20 }}>
        <span className="badge">Final start checklist</span>
        <h2>When API is connected, finish only these steps</h2>
        <ul>{partnerLaunchChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
    </AdminShell>
  );
}
