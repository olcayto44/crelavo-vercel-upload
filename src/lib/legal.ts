export const LEGAL_ACCEPTANCE_VERSION = "v1.3-preview-setup-fee";

export const productionResponsibilityText = "The user confirms, represents, and warrants that they own or have obtained all rights, licenses, permissions, consents, and commercial-use authorizations required for every brand, logo, emblem, trade name, product image, face, likeness, person, voice, music, text, reference material, uploaded file, link, dataset, and any similar content submitted, referenced, requested, or used in a production order. This confirmation applies globally, including the user's country, target markets, publishing platforms, advertising channels, and all applicable local, regional, national, and international laws relating to copyright, trademarks, publicity rights, personality rights, privacy, data protection, advertising, consumer protection, unfair competition, and platform policies.";

export const rightsWarrantyText = "Crelavo is a technical automation and AI production tool. Crelavo does not verify, guarantee, or certify that user-submitted or user-requested content is lawful, policy-compliant, non-infringing, or suitable for publication in any country or platform. The user is solely and exclusively responsible for every production request, uploaded or linked material, selected brand/logo/face/voice/music/product reference, generated output, advertisement, publication, campaign, and downstream use. The user agrees to defend, indemnify, and hold harmless Crelavo, its owners, directors, employees, contractors, and service providers from and against any claim, notice, takedown, lawsuit, loss, damage, penalty, license fee, settlement, advertising-account sanction, platform restriction, legal cost, or regulatory action arising from the user's content, instructions, materials, publications, or use of the generated outputs.";

export const billingTermsText = "Monthly and yearly subscription packages may start with a paid 24-hour preview. The setup fee is charged immediately, is non-refundable, and covers preview access including one 10-second watermarked preview video while downloads are closed until the selected subscription starts. If the user cancels within 24 hours, the main subscription does not start and the setup fee remains non-refundable. If the user does not cancel within 24 hours, Whop automatically charges the selected monthly or yearly plan. After the main plan starts, monthly plans renew monthly until cancelled and yearly plans renew yearly until cancelled. Payment card data is stored and processed by the payment provider, not directly by Crelavo. If a recurring payment fails, Crelavo may notify the user, retry payment according to provider settings, restrict new production starts, suspend subscription benefits, or require payment method updates before service continues. One-time top-up credit packages are not subscriptions, do not renew automatically, and may be purchased repeatedly whenever the user chooses. Credits, subscription benefits, reserved production credits, failed-payment handling, cancellation timing, invoices, receipts, and refund eligibility are governed by the package terms shown at checkout, dashboard notices, and applicable payment provider records.";

export function legalAcceptanceSnapshot(input: { productionType: string; packageId: string; title: string; userEmail?: string }) {
  return {
    version: LEGAL_ACCEPTANCE_VERSION,
    accepted: true,
    acceptedAt: new Date().toISOString(),
    productionType: input.productionType,
    packageId: input.packageId,
    title: input.title,
    userEmail: input.userEmail ?? "",
    responsibilityText: productionResponsibilityText,
    rightsWarrantyText,
    billingTermsText
  };
}
