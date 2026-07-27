export const whopCurrencyVerification = {
  sourceOfRecord: "Whop checkout is the billing source of record for launch.",
  publicCopyCurrencyRule: "Crelavo public pricing copy stays in USD unless Whop checkout itself displays a localized currency. Do not promise GBP, EUR, CAD, AUD or TRY pricing on the site.",
  countriesToCheck: [
    { segment: "US", expected: "USD checkout visibility", note: "Confirm the default US checkout path shows the expected Whop price and preview wording." },
    { segment: "UK", expected: "GBP or Whop-supported localized display if Whop enables it", note: "Do not claim GBP on Crelavo public pages; only verify what Whop checkout shows." },
    { segment: "EU", expected: "EUR or Whop-supported localized display if Whop enables it", note: "Keep Crelavo site copy USD and use Whop as the localized display authority." },
    { segment: "CA_AU", expected: "CAD/AUD or Whop-supported localized display if Whop enables it", note: "Verify Canada and Australia checkout screens separately before paid traffic." },
    { segment: "TR", expected: "Whop-supported checkout display", note: "Do not promise local currency or special regional discounts." },
    { segment: "GLOBAL", expected: "USD/default checkout visibility", note: "Fallback traffic should see stable USD site copy and normal Whop checkout." }
  ],
  manualChecklist: [
    "Open Whop checkout from a clean session for US, UK, EU, CA/AU, TR and Global/default traffic.",
    "Record visible checkout currency, preview fee, recurring plan price, cancellation wording and tax/VAT display if shown by Whop.",
    "Confirm Crelavo public copy still says USD where it mentions price and does not claim local currency conversion.",
    "Confirm checkout email and Crelavo account email matching remains clear for credit activation.",
    "Do not run paid traffic until a real Whop payment/webhook/idempotency test has passed."
  ],
  guardrails: [
    "No local currency claim on Crelavo pages unless Whop provides and verifies it.",
    "No fake regional scarcity, fake local social proof or fake localized discounts.",
    "Whop is the checkout authority; Crelavo only routes and explains billing safely."
  ]
};
