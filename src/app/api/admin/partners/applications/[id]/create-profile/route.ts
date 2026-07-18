import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

function makePartnerCode(name: string, email: string) {
  const base = (name || email.split("@")[0] || "partner")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18) || "PARTNER";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CRELAVO-${base}-${suffix}`;
}

function referralLinksForCode(partnerCode: string, siteUrl: string) {
  const cleanSiteUrl = siteUrl.replace(/\/$/, "");
  return [
    {
      partner_code: partnerCode,
      link_type: "main",
      path: `/?ref=${partnerCode}`,
      full_url: `${cleanSiteUrl}/?ref=${partnerCode}`,
      status: "active"
    },
    {
      partner_code: partnerCode,
      link_type: "affiliate",
      path: `/affiliate?ref=${partnerCode}`,
      full_url: `${cleanSiteUrl}/affiliate?ref=${partnerCode}`,
      status: "active"
    },
    {
      partner_code: partnerCode,
      link_type: "growth_intelligence",
      path: `/growth-intelligence?ref=${partnerCode}`,
      full_url: `${cleanSiteUrl}/growth-intelligence?ref=${partnerCode}`,
      status: "active"
    }
  ];
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required to create partner profile." }, { status: 503 });
  }

  try {
    const supabase = supabaseAdmin();
    const { data: application, error: applicationError } = await supabase
      .from("partner_applications")
      .select("id,full_name,email,channel_type,channel_url,status,application_ip,application_country,application_city,admin_notes")
      .eq("id", id)
      .single();

    if (applicationError) throw applicationError;
    if (!application) return Response.json({ error: "Partner application not found." }, { status: 404 });

    const { data: existingProfile, error: existingError } = await supabase
      .from("partner_profiles")
      .select("id,partner_name,email,partner_code,status")
      .eq("email", application.email)
      .maybeSingle();

    if (existingError) throw existingError;

    const siteUrl = String(process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com");
    let profile = existingProfile;

    if (!profile) {
      const partnerCode = makePartnerCode(application.full_name, application.email);
      const { data: createdProfile, error: createProfileError } = await supabase
        .from("partner_profiles")
        .insert({
          application_id: application.id,
          partner_name: application.full_name,
          email: application.email,
          partner_code: partnerCode,
          status: "approved_pending_code",
          commission_percent: 35,
          tier: "Growth Intelligence service plans",
          channel_type: application.channel_type,
          channel_url: application.channel_url,
          payout_status: "pending_bank_details",
          payout_method: "Bank transfer",
          payout_email: application.email,
          bank_account_holder: null,
          bank_iban: null,
          bank_swift: null,
          payout_notes: "Pending finance verification.",
          last_ip: application.application_ip,
          last_country: application.application_country,
          last_city: application.application_city,
          admin_notes: application.admin_notes,
          approved_at: new Date().toISOString()
        })
        .select("id,partner_name,email,partner_code,status")
        .single();

      if (createProfileError) throw createProfileError;
      profile = createdProfile;
    }

    const links = referralLinksForCode(profile.partner_code, siteUrl).map((link) => ({
      ...link,
      partner_profile_id: profile.id
    }));

    const { error: deleteOldLinksError } = await supabase
      .from("partner_referral_links")
      .delete()
      .eq("partner_code", profile.partner_code);

    if (deleteOldLinksError) throw deleteOldLinksError;

    const { data: createdLinks, error: linksError } = await supabase
      .from("partner_referral_links")
      .insert(links)
      .select("id,partner_code,link_type,path,full_url,status");

    if (linksError) throw linksError;

    await supabase
      .from("partner_applications")
      .update({ status: "approved_pending_code", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    return Response.json({ profile, links: createdLinks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create partner profile.";
    return Response.json({ error: message }, { status: 500 });
  }
}
