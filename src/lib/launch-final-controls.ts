export const securityAbuseFraudControls = [
  { area: "Authentication", status: "active", check: "Production, automation, delivery and admin APIs require verified user/admin access where needed." },
  { area: "Payment-first production", status: "active", check: "Provider work stays blocked until credits are reserved or payment eligibility is confirmed." },
  { area: "Preview/download guard", status: "active", check: "24-hour preview keeps downloads/source/zip closed while preview remains available." },
  { area: "Route budgets", status: "active", check: "Assistant, automation start/status and production APIs use API cost/rate guard limits." },
  { area: "Rewards", status: "manual_review", check: "Share-to-earn remains manual review; no automatic reward credits before abuse/fraud checks." },
  { area: "Partner commission", status: "manual_review", check: "Whop partner commission records are pending_review and duplicate payment references are blocked." },
  { area: "Sensitive outputs", status: "policy_ready", check: "Voice/face/style clone and competitor analysis require rights/compliance review." }
];

export const monitoringBackupLoggingControls = [
  { area: "Health endpoint", status: "active", check: "/api/health returns app health for uptime smoke checks." },
  { area: "Provider readiness", status: "blocked_until_keys", check: "/api/providers/readiness exposes missing provider keys and selected routing." },
  { area: "API Guard", status: "active", check: "/admin/api-guard shows live cost limits, usage, near-limit users and recent productions." },
  { area: "Live visitors", status: "active", check: "/admin/analytics and /api/admin/live-visitors provide internal heartbeat visibility for admins." },
  { area: "Finance monitoring", status: "active", check: "/admin/finance tracks revenue, reserved credits and provider spend estimates." },
  { area: "Backup manifest", status: "active", check: "/admin/backup provides safe backup/restore plan without exporting secrets." },
  { area: "Error logging", status: "needs_external_sink", check: "Route errors return safe JSON; external Sentry/Logtail-style sink waits for final account/API setup." }
];

export const legalSupportCancellationControls = [
  { area: "Terms", href: "/terms", status: "active", check: "Acceptable use, AI output, credits, payment, delivery, refunds and contact rules are public." },
  { area: "Refund policy", href: "/refund-policy", status: "active", check: "24-hour preview, non-refundable setup fee, one-time purchases and refund review window are public." },
  { area: "Privacy policy", href: "/privacy-policy", status: "active", check: "Privacy page is public and sitemap/indexing-visible." },
  { area: "Whop billing / cancel", href: "/whop-billing", status: "active", check: "Cancellation instructions, preview rules and support email are available from dashboard." },
  { area: "Support", href: "/contact", status: "active", check: "Support/contact path is public and dashboard-linked." }
];

export const manualDisputeEvidenceChecklist = [
  { step: "Payment proof", owner: "Finance", check: "Collect Whop payment ID, package name, amount, billing interval, customer email and purchase timestamp before responding to any dispute." },
  { step: "Terms acceptance", owner: "Admin", check: "Open the user record and confirm the latest accepted terms/responsibility text, policy version, IP address, user-agent and timestamp." },
  { step: "Production start proof", owner: "Production admin", check: "Confirm production ID, package ID, reserved credits, started_at time, user prompt/brief and the second production-start acceptance." },
  { step: "Provider cost proof", owner: "Finance", check: "Attach provider/API cost estimate or final provider job note when production work has already started." },
  { step: "Delivery proof", owner: "Support", check: "Attach final delivery URL, dashboard delivery timestamp, viewed/downloaded evidence if available and support conversation summary." },
  { step: "Refund decision", owner: "Owner", check: "Mark whether the case is eligible, partially eligible or not eligible based on unused credits, provider work, delivered files and policy wording." }
];

export const manualDisputeEvidenceBundle = [
  "Whop receipt/payment reference",
  "User ID, email, package and credit ledger rows",
  "Accepted terms/responsibility text version with IP, user-agent and timestamp",
  "Production ID, production type, prompt/brief and reserved/spent credit record",
  "Provider/API job notes, cost estimate or admin production log",
  "Delivery link, file/ZIP visibility, viewed/downloaded note and support messages",
  "Final admin decision note: approve refund, partial credit, reject refund or escalate"
];

export const productHuntGlobalLaunchControls = [
  { area: "Product Hunt", status: "wait", check: "Wait until real Whop payment + onboarding + provider readiness are verified." },
  { area: "AI directories", status: "ready_manual", check: "Use /admin/growth directory kit first; submit AI directories before high-profile launch." },
  { area: "Launch copy", status: "ready_draft", check: "One-line pitch, short description, categories and public links are prepared." },
  { area: "Screenshots / demo", status: "needs_final_assets", check: "Use dashboard, category pages, social export, finance/analytics and delivery screenshots after final polish." },
  { area: "Community launch", status: "wait", check: "Hacker News / Show HN waits until product is hardened and payment/provider E2E passes." }
];

export const lemonFinalControls = [
  { area: "Current payment provider", status: "whop_active", check: "Whop remains the active checkout, subscription and payment source." },
  { area: "Lemon integration", status: "postponed", check: "Do not switch to Lemon until all Whop, provider, legal, launch and monitoring tasks are stable." },
  { area: "Existing Lemon webhook", status: "parked", check: "Code can remain present but should not become the active payment path yet." },
  { area: "Future migration", status: "manual_later", check: "Later compare plans, webhook payloads, product IDs, credit activation and cancellation/refund wording." },
  { area: "No conflict rule", status: "active", check: "Lemon work must not break Whop live payments or existing credit/reconcile logic." }
];

export const apiAfterKeysReviewList = [
  "Provider API keys: OpenAI / Runway / ElevenLabs / Shotstack and any selected image/video/render providers.",
  "Full production provider E2E with authenticated user and real production ID.",
  "Delivery owner/admin access test with real production ID and owner token.",
  "External error logging sink such as Sentry/Logtail after account/env setup.",
  "Social OAuth/API publishing after Meta/TikTok/YouTube keys and approval rules.",
  "Lemon only after Whop/payment/provider launch is stable."
];
