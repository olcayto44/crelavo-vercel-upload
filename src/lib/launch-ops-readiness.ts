export const mvpApiLaterTrack = {
  status: "separate_after_core_launch_e2e",
  phases: [
    { phase: "MVP API planning", items: ["Ad Performance Score Checker", "Virtual Model Studio", "Cultural Localization", "Campaign Calendar"], gate: "Keep as planning/draft APIs until core Whop/payment/provider E2E is stable." },
    { phase: "Community and education", items: ["Crelavo Academy", "Community Showcase", "Long Video Highlight Automation"], gate: "Require public copy safety, moderation and source ownership before scale." },
    { phase: "Advanced media products", items: ["24/7 AI live sales avatar", "human-image UGC/avatar sales module", "AI Drone-Style Video production"], gate: "Require external provider approval, cost ledger and low-cost live provider tests." }
  ],
  rule: "MVP APIs must stay visibly separate from core launch. They can be planned and guarded now, but should not be sold as active E2E deliverables until provider/account approvals exist."
};

export const adminDebugMonitoringPlan = {
  status: "live_test_result_driven",
  panels: [
    { panel: "/admin/providers", purpose: "Provider readiness, selected model, low-cost test and live verification status." },
    { panel: "/admin/monitoring", purpose: "Backup, logging, API/env post-key review and incident follow-up." },
    { panel: "/admin/final-api-checklist", purpose: "Final launch gates, commands, live E2E order and blocked items." },
    { panel: "/admin/production-qa", purpose: "Production QA, delivery/failure review and forced-failure checks." },
    { panel: "/admin/finance", purpose: "Revenue, reserved credit exposure, provider spend and margin visibility." }
  ],
  intakeRule: "Any live test failure must record provider/payment route, expected result, actual result, event/job id and whether the fix is code, provider account, Cloudflare or Whop-panel work."
};

export const providerQueueConcurrencyGuard = {
  status: "conservative_launch_limits",
  defaults: {
    maxConcurrentProviderJobs: 2,
    maxProviderRetries: 2,
    backoffSeconds: [30, 120, 300],
    maxSingleJobCredits: 50000,
    dailyUserProductionCount: 20
  },
  rules: [
    "Start with conservative concurrency and raise only after low-cost provider tests pass.",
    "Never retry provider failures silently as success; record retry count and final failure state.",
    "Back off on provider rate limits, quota errors and repeated status polling failures.",
    "Block jobs that exceed single-job or daily credit safety limits before provider spend.",
    "Queue pressure must be visible to admin before paid traffic scales."
  ]
};

export const productionReadinessScorePlan = {
  status: "scorecard_ready_for_live_inputs",
  scoreInputs: ["Whop payment/webhook", "credit reserve/spend", "provider low-cost test", "dashboard delivery", "email notification", "Cloudflare WAF", "public copy audit", "forced-failure path"],
  scoreBands: [
    { band: "0-49", meaning: "Do not scale traffic; missing core launch blockers." },
    { band: "50-79", meaning: "Internal testing only; live E2E still incomplete." },
    { band: "80-94", meaning: "Controlled launch candidate; continue monitoring and forced-failure checks." },
    { band: "95-100", meaning: "Ready to scale only if real E2E and provider failure path are verified." }
  ],
  creditBurnForecast: [
    "Estimate reserved credits as exposure until delivery/refund/release.",
    "Estimate provider cost from production metadata or fallback target cost ratio.",
    "Show daily user limits, single job credit limit and provider queue pressure together.",
    "Warn before marketing campaigns exceed safe provider spend capacity."
  ]
};
