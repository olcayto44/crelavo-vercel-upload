# Clipora Studio

Admin-assisted AI production studio for websites, apps, e-commerce campaigns, video, voice, visuals and managed creative delivery.

## What this first version includes

- Premium AI SaaS landing page
- Broad video request modules:
  - Product Ad Video
  - TikTok / Reels / Shorts
  - UGC Style Ad
  - Image-to-Video
  - Script-to-Video
  - Product URL-to-Video
  - Voice-over Video
  - Subtitle / Translation Video
  - Social Media Content Pack
- User dashboard
- Create video request form with `/api/requests` submit flow
- Admin panel mock
- Admin request update API skeleton
- Auth screen placeholders for login/register
- Credits, videos, billing, settings dashboard pages
- Stripe checkout API skeleton
- Stripe webhook skeleton
- Supabase schema for users, credits, packages, and video requests
- Environment variable template

## Important MVP mode

This is the first admin-assisted system:

1. User buys credits.
2. User submits a video request.
3. Credits are estimated/reserved.
4. Admin sees the request.
5. Admin produces or uploads the final video.
6. User downloads the final video.

Full automatic AI generation can be added later module by module.

## Required accounts

Minimum:

- GitHub
- Vercel
- Supabase
- Stripe

Optional / next phase:

- OpenAI
- Resend
- Replicate
- Cloudflare R2
- Inngest

## Setup steps

### 1. Install dependencies

This machine currently has Node.js, but `npm`, `pnpm`, and `corepack` were not available in PATH during setup.
After fixing npm/pnpm, run:

```bash
npm install
npm run dev
```

or with pnpm:

```bash
pnpm install
pnpm dev
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill values:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

### 3. Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy project URL and keys into `.env.local`.

### 4. Stripe

1. Create Stripe products/prices for credit packages.
2. Add the Stripe price IDs to the database `packages` table.
3. Configure webhook endpoint:

```text
/api/stripe/webhook
```

Listen for:

```text
checkout.session.completed
```

### 5. Vercel deployment

1. Push project to GitHub.
2. Import repo in Vercel.
3. Add environment variables.
4. Deploy.
5. Connect domain.

## Project structure

```text
src/app/page.tsx                         Landing page
src/app/auth/login/page.tsx              Login placeholder
src/app/auth/register/page.tsx           Register placeholder
src/app/dashboard/page.tsx               User dashboard
src/app/dashboard/create/page.tsx        Create request page
src/app/dashboard/credits/page.tsx       Credit packages page
src/app/dashboard/videos/page.tsx        My videos page
src/app/dashboard/billing/page.tsx       Billing page
src/app/dashboard/settings/page.tsx      Settings page
src/app/admin/page.tsx                   Admin panel
src/app/api/health/route.ts              Health check
src/app/api/requests/route.ts            Request list/create API
src/app/api/admin/requests/[id]/route.ts Admin request update API
src/app/api/stripe/checkout/route.ts     Stripe checkout skeleton
src/app/api/stripe/webhook/route.ts      Stripe webhook skeleton
src/components/RequestForm.tsx           Client request form
src/lib/credits.ts                       Credit estimation rules
src/lib/data.ts                          Demo product data
src/lib/supabase.ts                      Supabase clients
src/lib/stripe.ts                        Stripe client
supabase/schema.sql                      Database schema
```

## Current behavior without real keys

- The UI can submit a request to `/api/requests`.
- If Supabase env keys are missing, the API returns a mock success response.
- After Supabase is connected, requests will be inserted into `video_requests`.
- Stripe checkout route exists but needs real Stripe price IDs.
- Auth screens are visual placeholders until Supabase Auth is wired.

## Next development tasks

- Fix local package manager PATH so the app can run locally
- Add real Supabase Auth actions
- Replace demo dashboard/admin data with real Supabase queries
- Add authenticated user id to request creation
- Add credit reserve/spend/refund logic
- Finish Stripe webhook credit loading and idempotency
- Add file upload/final delivery flow
- Add email notifications
- Add real package management
- Add OpenAI brief generation later
- Add video API automation later
