# Lemon Squeezy Application Checklist

Use this checklist before submitting or updating the Lemon Squeezy application for Crelavo.

## Public website requirements

- The site must be live on the final domain: `https://crelavo.com`.
- Homepage must clearly explain Crelavo in English as an AI production studio for websites, apps, e-commerce campaigns, AI video, visuals, voice and managed digital delivery.
- Pricing must clearly show packages, prices, currency, credits/service scope, whether the product is recurring or one-time, the 24-hour preview setup fee, and the 10-second watermarked preview/download restriction where applicable.
- Public footer must include one clear legal link group, not duplicate or conflicting footer legal areas:
  - Terms of Service: `/terms`
  - Privacy Policy: `/privacy`
  - Refund / Cancellation Policy: `/refund-policy`
  - Short refund alias: `/refund`
- Public contact path must be available at `/contact` and support email should use `support@crelavo.com` after the domain is connected.
- Navigation should have no broken public links.
- Site should not show placeholder filler text, "coming soon" surfaces, fake template content or unfinished payment promises.

## Payment readiness

- Lemon Squeezy is the primary payment provider.
- Use `PAYMENT_PROVIDER=lemon_squeezy`.
- Required final env values:
  - `LEMON_SQUEEZY_API_KEY`
  - `LEMON_SQUEEZY_STORE_ID`
  - `LEMON_SQUEEZY_WEBHOOK_SECRET`
  - package-level `LEMON_VARIANT_*` values or direct checkout URLs in `/admin/packages`
- During early launch, admin may use direct Lemon checkout URLs plus manual credit/service activation.
- Lemon product setup details live in `docs/lemon-squeezy-product-setup.md`; subscription variants must use the 24-hour preview + setup fee model and yearly variants must be priced as 10 months for 12 months of access.
- Do not enable automatic credit activation until webhook idempotency, duplicate-payment handling and manual reconciliation are tested.

## Application identity

- If applying as an individual or sole proprietor, identity and address must match official ID/passport records exactly.
- Use professional domain emails after the domain exists:
  - `support@crelavo.com`
  - `finance@crelavo.com`
  - `partners@crelavo.com`

## Policy positioning

- Crelavo sells digital services, AI-assisted production workflows, subscriptions, credit packages and managed digital deliverables.
- Avoid prohibited or risky positioning:
  - physical-product dropshipping
  - copyright infringement
  - crypto/forex/financial advice
  - gambling
  - adult content
  - tobacco/alcohol sales
- Refund policy must clearly explain subscription cancellation, one-time top-ups, review window and no-refund conditions after credits/work/provider resources are used.
- Terms of Service must clearly state that voice cloning, visual cloning, avatar, lip-sync, presenter, live sales agent and style-reference workflows may only use the customer's own, licensed or authorized materials. Unauthorized impersonation, copyright/trademark misuse and fraudulent identity use must be prohibited.

## Reviewer test account

Create one dedicated test account before submitting the application:

- Suggested email: `reviewer@crelavo.com` or `lemon-test@crelavo.com`
- Password: create a strong temporary password and store it outside the repository.
- Add enough free test balance, for example 500-1000 credits, so the review team can test the dashboard and credit workflow.
- Do not commit or publish the password in code, docs, screenshots or public pages.

Suggested Notes to Reviewer text:

```text
To help you review our SaaS platform, we have created a fully functional test account for the Lemon Squeezy team. You can log in via https://crelavo.com using the credentials below to test our AI production workflows and credit system:

Email: [reviewer account email]
Password: [temporary password]

Note: We have pre-loaded this account with free test credits so you can experience our video, web asset and managed production workflow first-hand. Crelavo uses a credit-based production workflow, public USD pricing, working legal pages, and clear restrictions against unauthorized voice/visual cloning or impersonation.
```

## Final validation commands

```bash
npm run smoke:lemon-application
npm run smoke:navigation-links
npm run smoke:security-privacy
npm run build
```
