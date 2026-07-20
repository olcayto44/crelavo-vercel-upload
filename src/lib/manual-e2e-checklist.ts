type ManualE2EStatus = "not_tested" | "pass" | "fail" | "blocked" | "not_applicable";

type ManualE2EItem = {
  label: string;
  defaultStatus: ManualE2EStatus;
  route?: string;
  expected: string;
  failNote: string;
  phase: "pre_api" | "final_api" | "both";
};

type ManualE2EGroup = {
  title: string;
  description: string;
  items: ManualE2EItem[];
};

function groupSummary(items: ManualE2EItem[]) {
  return {
    total: items.length,
    notTested: items.filter((item) => item.defaultStatus === "not_tested").length,
    pass: items.filter((item) => item.defaultStatus === "pass").length,
    fail: items.filter((item) => item.defaultStatus === "fail").length,
    blocked: items.filter((item) => item.defaultStatus === "blocked").length,
    notApplicable: items.filter((item) => item.defaultStatus === "not_applicable").length
  };
}

export const adminSupportedDeliveryTemplates = [
  {
    title: "AI Ad Performance Score Checker delivery",
    adminAction: "Prepare one short score report, one hook rewrite note and one clear next-step recommendation.",
    deliverable: "Score summary, weak points, suggested hook improvements and a route into the paid production flow.",
    apiNeeded: 0
  },
  {
    title: "AI Virtual Model Studio delivery",
    adminAction: "Choose one product angle, one model style and one catalog-ready output set.",
    deliverable: "Model image pack, product visual direction and campaign-ready handoff notes.",
    apiNeeded: 1
  },
  {
    title: "AI Cultural Localization delivery",
    adminAction: "Write one country brief, one localized hook set and one CTA adaptation note.",
    deliverable: "Localized brief, rewritten copy, visual adaptation notes and market-specific campaign outline.",
    apiNeeded: 1
  },
  {
    title: "AI Campaign Calendar delivery",
    adminAction: "Select one seasonal event, one product launch path and one hook calendar week.",
    deliverable: "Campaign timeline, hook calendar, seasonal asset checklist and production plan.",
    apiNeeded: 0
  },
  {
    title: "Crelavo Academy delivery",
    adminAction: "Assign one lesson path, one template pack and one next-step production request.",
    deliverable: "Lesson path, template pack and optional paid production brief.",
    apiNeeded: 0
  },
  {
    title: "Community Showcase delivery",
    adminAction: "Approve one public example, extract one reusable template angle, confirm the credit range and route the similar-style request into Assistant Workspace.",
    deliverable: "Approved showcase item, template reuse guidance, credit estimate and reuse-ready request prompt.",
    apiNeeded: 0
  }
];

export const longVideoHighlightManualFlow = [
  { step: "Upload long source", owner: "User", action: "Add the full video and describe whether the goal is scary, funny, high-retention or highlight-only clips." },
  { step: "Admin pre-review", owner: "Admin", action: "Check source length, language, target clips and whether the request is one-off or recurring." },
  { step: "Highlight selection", owner: "Admin", action: "Mark the best scenes, hooks or emotional beats manually before any provider automation is used." },
  { step: "Subtitle and delivery notes", owner: "Admin", action: "Prepare short clip notes, subtitle expectations and social cut instructions for the final handoff." },
  { step: "Final delivery", owner: "Admin", action: "Deliver the clip plan, source timestamps and export notes while provider/API automation is still pending." }
];

export const whopLiveTestPrepNotes = [
  "Use one real test product or subscription path only after the final env checklist is clear.",
  "Keep one test inbox and one test user account ready before payment testing.",
  "Record the Whop payment reference, package name, amount, billing interval and user email for every test.",
  "Check admin finance, user ledger and production ledger after every successful payment.",
  "Verify refund, cancellation and subscription events before marking the test pass.",
  "Do not start live testing until direct checkout or API checkout settings are confirmed in the final API checklist."
];

export function buildManualE2EChecklist() {
  const groups: ManualE2EGroup[] = [
    {
      title: "Preflight",
      description: "Run these checks before browser/manual testing starts.",
      items: [
        { label: "Run npm run smoke", defaultStatus: "not_tested", expected: "All pre-API smoke checks pass.", failNote: "Stop and fix failing smoke before manual launch pass.", phase: "pre_api" },
        { label: "Run npm run build", defaultStatus: "not_tested", expected: "Production build completes successfully.", failNote: "Stop and fix build/TypeScript/static generation issues.", phase: "pre_api" },
        { label: "Run security/privacy smoke", defaultStatus: "not_tested", expected: "Private/admin/API routes remain noindex and sitemap stays public-only.", failNote: "Fix privacy/indexing issue before launch.", phase: "pre_api" },
        { label: "Confirm final API/env blockers are intentional", defaultStatus: "not_tested", route: "/admin/final-api-checklist", expected: "Missing Lemon Squeezy/Resend/first-phase provider keys are documented as final-stage blockers for OpenAI, Runway/video, image generation, Voice/TTS and video editing/render.", failNote: "Update final checklist or env docs before continuing.", phase: "pre_api" },
        { label: "Confirm first-phase API priority list", defaultStatus: "not_tested", route: "/admin/final-api-checklist", expected: "The admin checklist shows the 9-service first phase: OpenAI, Runway/video, image generation, Voice/TTS, video editing/render, Lemon Squeezy, Supabase, Resend and Storage/CDN.", failNote: "Record missing service and wrong launch phase wording.", phase: "pre_api" }
      ]
    },
    {
      title: "Assistant routing",
      description: "Confirm the assistant chooses the correct production flow from user intent.",
      items: [
        { label: "Website/e-commerce idea routes to project flow", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace?idea=E-commerce%20website%20Shopify%20WooCommerce%20admin", expected: "Assistant selects website/e-commerce project flow, not campaign video.", failNote: "Record idea URL, selected category and wrong flow.", phase: "pre_api" },
        { label: "Mobile app idea routes to app/source package", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace?idea=Mobile%20app%20Expo%20source%20package", expected: "Assistant selects mobile app/project delivery with source ZIP expectations.", failNote: "Record idea URL and wrong package/category behavior.", phase: "pre_api" },
        { label: "Product link ad routes to campaign flow", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace?idea=Product%20link%20TikTok%20ad", expected: "Assistant selects campaign/social or commerce ad flow, not website project.", failNote: "Record selected flow and missing product-link behavior.", phase: "pre_api" },
        { label: "Advanced talking video options appear", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace?idea=Advanced%20talking%20video%207-8%20person%20regional%20clothing%20own%20voice&category=talking_video&mode=media", expected: "Self-in-video, 7-8 person, own voice, separate voices, regional clothing/environment and dialect/accent options are visible.", failNote: "Record which option panel is missing.", phase: "pre_api" },
        { label: "Drama short series options appear", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace?idea=Viral%20short%20drama%20series&category=drama&mode=media", expected: "Drama / Short Series opens with drama format, genre/tone, scene/episode structure, character setup, hook type and dialogue/voice direction options.", failNote: "Record missing drama option group or wrong selected production type.", phase: "pre_api" },
        { label: "Drone satellite options appear", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace?idea=Drone%20satellite%20route%20video&category=drone_video&mode=media", expected: "Drone / Satellite Video opens with location/address/coordinates, route/path, marked map/satellite area, shot type, map/satellite style, camera movement, visual style, narration language, subtitle option, music style and drone map/route/location/style reference upload purposes.", failNote: "Record missing drone option/upload group or wrong selected production type.", phase: "pre_api" },
        { label: "AI Live Sales Agent options appear", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace?idea=AI%20live%20sales%20agent%20TikTok%20Shop%2040h%20fair-use&category=live_sales_agent&mode=media", expected: "AI Live Sales Agent opens with product link/details, brand name, product category, target market/language, target live platform, avatar/host persona, avatar source, avatar style, self avatar upload, own voice upload, voice source, voice/language, voice tone, background/set, visual style, subtitle/caption option, interaction mode, stream goal, human fallback, provider readiness, CTA/discount, fair-use hours, pay-as-you-go API cost estimate and AI disclosure/compliance notes. The estimate shows no included credits/service-plan behavior.", failNote: "Record missing live sales option/upload group, wrong selected production type or wrong credit display.", phase: "pre_api" },
        { label: "Music video upload purposes appear", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace?idea=Music%20video%20with%20own%20voice%20own%20image%20and%20another%20person&category=music_video&mode=media", expected: "Music Video / MV upload dropdown includes MV song/audio master, own voice, own image/avatar, artist image, reference character, another person reference and performance video reference.", failNote: "Record missing MV upload purpose option.", phase: "pre_api" }
      ]
    },
    {
      title: "Public entry points",
      description: "Confirm public marketing pages lead users into the assistant funnel.",
      items: [
        { label: "Category CTAs route into Assistant Workspace", defaultStatus: "not_tested", route: "/categories", expected: "Website, Mobile App, SaaS, Campaign, Video and Advanced Talking Video CTAs include correct assistant query params.", failNote: "Record broken CTA label and target URL.", phase: "pre_api" },
        { label: "Pricing production package CTAs route correctly", defaultStatus: "not_tested", route: "/pricing", expected: "Website/e-commerce/admin, mobile Expo and Shopify package links land on Assistant Workspace.", failNote: "Record package ID and wrong route.", phase: "pre_api" },
        { label: "Free tools preserve generated result into production flow", defaultStatus: "not_tested", route: "/free-tools", expected: "Selected free-tool result can move into Assistant Workspace with source=free-tool.", failNote: "Record tool slug, selected result and missing query params.", phase: "pre_api" }
      ]
    },
    {
      title: "Production creation and credit guard",
      description: "Confirm productions can be created only when the live credit estimate fits the user's available production credits.",
      items: [
        { label: "Live credit estimate updates from options", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace", expected: "Changing duration, quality, materials, output count or delivery options updates the estimated reserve before production starts.", failNote: "Record option changed, expected estimate movement and actual estimate.", phase: "pre_api" },
        { label: "Insufficient credit blocks Start production", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace", expected: "When estimate exceeds available production credits, a red insufficient-credit warning appears and Start production is disabled.", failNote: "Record balance, estimate, warning text and whether Start stayed enabled.", phase: "pre_api" },
        { label: "Reducing options re-enables production", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace", expected: "Reducing quality, duration, materials or output count below available credits removes the red warning and enables Start production.", failNote: "Record changed options and whether Start remained blocked.", phase: "pre_api" },
        { label: "E-commerce website production metadata", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace", expected: "Production metadata includes projectWorkflow, commerceWorkflow and deliveryTargets.", failNote: "Record production id and missing metadata fields.", phase: "pre_api" },
        { label: "Mobile app production uses mobile delivery", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace", expected: "Package selection and metadata use mobile app/project delivery, not campaign video.", failNote: "Record production id and wrong package/category.", phase: "pre_api" },
        { label: "Advanced talking video keeps selected features", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace", expected: "Production type, selected materials, regional/voice/person-count features and higher credit estimate are preserved.", failNote: "Record production id and lost feature fields.", phase: "pre_api" },
        { label: "Drama production preserves story metadata", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace?idea=Viral%20short%20drama%20series&category=drama&mode=media", expected: "Production metadata includes productionType=drama and dramaDetails with format, genreTone, structure, characters, hookType and dialogueVoice.", failNote: "Record production id and missing dramaDetails field.", phase: "pre_api" },
        { label: "Drone production preserves location metadata", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace?idea=Drone%20satellite%20route%20video&category=drone_video&mode=media", expected: "Production metadata includes droneDetails with locationAddress, routePath, markedArea, shotType, mapStyle, cameraMovement, visualStyle, narrationLanguage, subtitleOption, musicStyle and uploaded map/route/location/style reference material groups.", failNote: "Record production id and missing droneDetails location/route/marked area/options/upload values.", phase: "pre_api" },
        { label: "AI Live Sales Agent production preserves service metadata", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace?idea=AI%20live%20sales%20agent%20pro%2040h%20fair-use%20multi-platform&category=live_sales_agent&mode=media", expected: "Production metadata includes productionType=live_sales_agent and liveSalesAgentDetails with productLinkDetails, brandName, productCategory, targetMarketLanguage, targetPlatform, persona, avatarSource, avatarStyle, voiceSource, voiceLanguage, voiceTone, background, visualStyle, subtitleOption, interactionMode, streamGoal, humanFallback, providerReadiness, ctaOffer, complianceNotes, creditPolicy and uploaded own voice/self avatar/avatar reference/background/product visual material groups. Reserved credits stay 0 for no included credits service plans, while fair-use hours and pay-as-you-go API cost policy are preserved.", failNote: "Record production id, missing liveSalesAgentDetails avatar/voice/background/subtitle field or non-zero reserved credits.", phase: "pre_api" },
        { label: "MV production preserves upload purpose metadata", defaultStatus: "not_tested", route: "/dashboard/assistant-workspace?idea=Music%20video%20with%20own%20voice%20own%20image%20and%20another%20person&category=music_video&mode=media", expected: "Production metadata includes musicVideoMaterialGroups for song_audio, own_voice, own_image_avatar, another_person_reference and performance_video_reference when those uploads are used.", failNote: "Record production id and missing MV material group.", phase: "pre_api" }
      ]
    },
    {
      title: "Workspace and admin visibility",
      description: "Confirm users and admins can see the right information after creation.",
      items: [
        { label: "Project production workspace language", defaultStatus: "not_tested", route: "/dashboard/productions/[id]", expected: "Workspace uses project delivery language, modules, source delivery, store platform and publish targets.", failNote: "Record production id and wrong video-only wording.", phase: "pre_api" },
        { label: "Admin production metadata visibility", defaultStatus: "not_tested", route: "/admin/productions", expected: "Provider/preflight/project metadata is visible for the production.", failNote: "Record production id and missing admin fields.", phase: "pre_api" },
        { label: "Admin package editor controls live sales plans", defaultStatus: "not_tested", route: "/admin/packages", expected: "Admin can add an AI Live Sales Agent package, edit package name/price text, set 0 credits, edit fair-use hours/features one per line, remove selected production packages and save the config.", failNote: "Record missing add/remove button, missing live_sales_agent type, or package config save failure.", phase: "pre_api" },
        { label: "Admin revision queue visibility", defaultStatus: "not_tested", route: "/admin/productions", expected: "Customer revision requests and pending output actions are visible with target part, action, status and message.", failNote: "Record production id and missing revision fields.", phase: "pre_api" },
        { label: "Admin delivery readiness cards", defaultStatus: "not_tested", route: "/admin/productions", expected: "Final delivery, source files and README/setup cards show waiting/requested/ready state before manual update is saved.", failNote: "Record production id and wrong delivery readiness state.", phase: "pre_api" },
        { label: "Admin production type pages filter correctly", defaultStatus: "not_tested", route: "/admin/website", expected: "Website, mobile, SaaS, talking-video, drama, drone-video and music-video admin pages show correct production type and package/checklist cards.", failNote: "Record route and wrong filter/card behavior.", phase: "pre_api" },
        { label: "Launch readiness shows final-stage API blockers", defaultStatus: "not_tested", route: "/admin/launch-readiness", expected: "API/env setup appears as final-stage blocker, not a blocker for pre-API cleanup.", failNote: "Record wrong blocker wording or missing launch mode.", phase: "pre_api" }
      ]
    },
    {
      title: "Payment, email and provider final pass",
      description: "Only run after final API/env setup. Keep blocked during pre-API cleanup.",
      items: [
        { label: "Lemon direct checkout opens", defaultStatus: "not_tested", route: "/dashboard/payment", expected: "If a package has a direct Lemon Squeezy checkout URL configured, Continue to payment opens Lemon checkout without requiring API checkout keys.", failNote: "Record package id, billing mode and failed redirect URL.", phase: "pre_api" },
        { label: "Manual payment activation after Lemon checkout", defaultStatus: "not_tested", route: "/admin/credits", expected: "Admin can verify Lemon Squeezy payment externally and add credits to the matching Crelavo account email.", failNote: "Record customer email, Lemon receipt/order id and credit adjustment error.", phase: "pre_api" },
        { label: "Lemon Squeezy API checkout fallback", defaultStatus: "blocked", route: "/pricing", expected: "If no direct checkout URL is configured, Lemon Squeezy API checkout works after final keys and returns to the correct app URL.", failNote: "Record Lemon checkout/order id, expected redirect and actual redirect.", phase: "final_api" },
        { label: "Lemon Squeezy webhook events", defaultStatus: "blocked", route: "/api/lemon-squeezy/webhook", expected: "Webhook email/admin notification path works after LEMON_SQUEEZY_WEBHOOK_SECRET is added. Automatic credit activation stays disabled until idempotency and double-payment tests pass.", failNote: "Record event id, user id and credit mismatch.", phase: "final_api" },
        { label: "Customer and owner payment emails", defaultStatus: "blocked", expected: "Customer receipt and owner/admin payment notification are delivered.", failNote: "Record email address, event id and missing email type.", phase: "final_api" },
        { label: "First-phase provider readiness", defaultStatus: "blocked", route: "/admin/providers", expected: "OpenAI, selected Runway/video provider, image generation, Voice/TTS and video editing/render readiness states are visible before live jobs run.", failNote: "Record missing provider readiness row or wrong required env.", phase: "final_api" },
        { label: "Provider-success production path", defaultStatus: "blocked", route: "/dashboard/productions/[id]", expected: "One real provider job completes and production-ready email/delivery links are visible.", failNote: "Record provider, job id, production id and failure stage.", phase: "final_api" },
        { label: "Credit cancellation/failure/admin review", defaultStatus: "blocked", route: "/admin/productions", expected: "Cancellation fee, provider failure review and admin refund/manual delivery paths work.", failNote: "Record production id, credit before/after and wrong status.", phase: "final_api" }
      ]
    },
    {
      title: "Legacy guard",
      description: "Confirm old production entry points cannot bypass the assistant workflow.",
      items: [
        { label: "Legacy dashboard create redirects", defaultStatus: "not_tested", expected: "Old create entry redirects to Assistant Workspace and does not show the old long form.", failNote: "Record whether old form appeared or redirect failed.", phase: "pre_api" },
        { label: "ProductionRequestForm does not submit directly", defaultStatus: "not_tested", expected: "Old form cannot submit directly to /api/productions.", failNote: "Record where direct submission is still reachable.", phase: "pre_api" }
      ]
    }
  ];

  const allItems = groups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.title })));
  const summary = groupSummary(allItems);

  return {
    generatedAt: new Date().toISOString(),
    statusLegend: [
      { status: "[ ]", meaning: "Not tested yet" },
      { status: "[PASS]", meaning: "Verified and working" },
      { status: "[FAIL]", meaning: "Failed; record route/user/production/browser/log and stop launch pass" },
      { status: "[BLOCKED]", meaning: "Blocked by missing API/env/domain setup" },
      { status: "[N/A]", meaning: "Not applicable for this pass" }
    ],
    summary,
    preApiItems: allItems.filter((item) => item.phase === "pre_api" || item.phase === "both").length,
    finalApiItems: allItems.filter((item) => item.phase === "final_api" || item.phase === "both").length,
    failureCaptureFields: ["route", "user account", "production id", "browser", "environment", "expected result", "actual result", "screenshot/log reference"],
    acceptance: {
      preApi: ["npm run smoke passes", "npm run build passes", "npm run smoke:security-privacy passes", "Non-payment manual E2E has no [FAIL] entries", "API/env blockers are documented"],
      finalApi: ["npm run smoke:env-readiness passes", "First-phase API readiness is visible for OpenAI, Runway/video, image, Voice/TTS and video editing/render", "Lemon Squeezy checkout/webhook/manual credit reconciliation pass", "Payment and production-ready emails pass", "Provider-success path passes", "Cancellation/failure/admin review pass"]
    },
    groups: groups.map((group) => ({ ...group, summary: groupSummary(group.items) }))
  };
}
