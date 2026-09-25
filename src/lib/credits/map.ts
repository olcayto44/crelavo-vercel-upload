export type CreditKind = "credits" | "pro_flag" | "service";

export type CreditRule = {
  planId: string;
  title: string;
  credits: number;
  kind: CreditKind;
  skipPreview: boolean;
};

export const CREDIT_MAP: CreditRule[] = [
  { planId: "plan_kmGVCrQu90NBV", title: "Starter Credit Pack", credits: 800, kind: "credits", skipPreview: false },
  { planId: "plan_Q0fJdHNnKGPd6", title: "Creator Credit Pack", credits: 2500, kind: "credits", skipPreview: false },
  { planId: "plan_kkn9PeDilHc1q", title: "Business Credit Pack", credits: 7000, kind: "credits", skipPreview: false },
  { planId: "plan_Sm0chNhnmVKBG", title: "Drone Location Video", credits: 2600, kind: "credits", skipPreview: false },
  { planId: "plan_ENiXR71BMaqB2", title: "Satellite + Drone Story", credits: 6800, kind: "credits", skipPreview: false },
  { planId: "plan_ECfkkMySZHtIZ", title: "Pro Credits monthly", credits: 2500, kind: "credits", skipPreview: true },
  { planId: "plan_A9zegHpbjxAfO", title: "Pro Credits yearly", credits: 2500, kind: "credits", skipPreview: true },
  { planId: "plan_DTxjYMeiRPBWz", title: "Business Credits monthly", credits: 9000, kind: "credits", skipPreview: true },
  { planId: "plan_R3OSfDLVHI9zi", title: "Business Credits yearly", credits: 9000, kind: "credits", skipPreview: true },
  { planId: "plan_rkeOQU3gjmujh", title: "Team Credits monthly", credits: 12000, kind: "credits", skipPreview: true },
  { planId: "plan_jSBaM1LgMuaNL", title: "Team Credits yearly", credits: 12000, kind: "credits", skipPreview: true },
  { planId: "plan_UtIprGEXNEooK", title: "Ultra Credits monthly", credits: 25000, kind: "credits", skipPreview: true },
  { planId: "plan_apVKry7XkvOky", title: "Ultra Credits yearly", credits: 25000, kind: "credits", skipPreview: true },
  { planId: "plan_ujLQgM3kEg0dg", title: "Crelavo Pro", credits: 0, kind: "pro_flag", skipPreview: true },
  { planId: "plan_fiabRYr6uWY43", title: "Crelavo Pro Annual", credits: 0, kind: "pro_flag", skipPreview: true },
];

export function ruleForPlan(planId: string) {
  return CREDIT_MAP.find((rule) => rule.planId === planId) ?? null;
}

export function isPreviewCharge(billingReason?: string | null) {
  return billingReason === "subscription_create";
}
