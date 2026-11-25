# Studio V2 MP4 Render Engine — P0 implementation and safety gates
Date: 2026-11-24. Development branch only. This is **not** a live MP4 service until a dedicated worker is deployed and end-to-end checks pass.

## Implemented
1. **Database:** Applied additive migration `studio_render_jobs_owner_scoped_queue` to Supabase project `yahegfagwxvixjnybkaw`, mirrored in `supabase/migrations/20261124001500_studio_render_jobs.sql`. Persistent job state, attempts, leases, owner+project+timeline integrity foreign keys, unique user/request idempotency, and owner-only read RLS. No browser insert, update or delete.
2. **API:** `GET/POST /api/studio/render-jobs`. Authenticated bearer token; request owner checked server-side. GET lists the user's job statuses or signs a 300-second private MP4 link for a ready owner-scoped artifact. POST checks `STUDIO_MP4_RENDER_ENABLED=1` **and** worker URL/key, validates owning timeline, limits active requests, reuses idempotency ID, never bills. With missing worker flags it fails 503 without enqueuing or charging.
3. **Actual FFmpeg logic:** `scripts/studio-ffmpeg-compose.mjs` transcodes trimmed source clips into H.264 video + AAC audio, adds silence for clips without audio, scales/pads to output ratio, concatenates, and optionally mixes rights-cleared soundtrack. Unsupported text overlays are rejected rather than silently ignored.
4. **Dedicated queue worker:** `scripts/studio-mp4-worker.mjs` claims a job with conditional update, renews lease, validates owner-scoped reference assets, downloads private sources to temporary disk, invokes FFmpeg without shell evaluation, stores finished MP4 privately, updates status, and retries up to max attempts. No provider or billing credits are spent.

## Validated
- SQL table created successfully. RLS enabled, exactly one owner-read policy, role without JWT sees 0 rows.
- Vercel application build and studio wiring tests must pass for the final feature commit.
- Local FFmpeg 7.1.5 manual composition smoke with two 1-second source segments (one silent, one with tone) yielded a playable H.264/AAC MP4 of 2.021 seconds. This is an engine-argument smoke check, **not** an integrated worker/Supabase delivery E2E.
- Direct client-side MP4 button is **not** enabled. Existing WebM is still the only real local-browser export.

## Required setup before activation
Use a secure **separately operated, long-running Node.js host** with FFmpeg/FFprobe (H.264/AAC build), sufficient ephemeral storage and at least the signed in user's source media capacity. Do not host the long-running FFmpeg worker inside a short Vercel request function.

Required private environment for that host:
- `SUPABASE_URL` (project API base)
- `SUPABASE_SERVICE_ROLE_KEY` (private secret; never expose as NEXT_PUBLIC)
- `FFMPEG_PATH` (optional absolute ffmpeg binary)
- `FFPROBE_PATH` (optional absolute ffprobe binary)
- Worker start: `node scripts/studio-mp4-worker.mjs --once` (one poll) or `node scripts/studio-mp4-worker.mjs` (loop)

Application environment activation is a separate intentional release:
- `STUDIO_MP4_RENDER_ENABLED=1`
- `STUDIO_RENDER_WORKER_URL`
- `STUDIO_RENDER_WORKER_KEY`
These are currently NOT enabled. A configured URL/key is a launch flag; the worker script itself polls the database, not the URL. An orchestration/health contract for these flags should be validated before opening POST requests.

## Outstanding P0 release gates
- Authenticated cross-device upload/save/reopen using a real user and a second account's denied access.
- Actual output audio continuity, 3-clip trim, music, cancellation, subtitle/title support, MP4 signed download and storage clean-up.
- Lease reclaim under process crash, retry idempotency and no orphaned files.
- Persistent job UI/monitoring, signed user output, quotas, lifecycle cleanup and verified billing reserve/settle/release.
- Confirm worker hosting costs/availability before activation. Keep existing production credits and paid providers unchanged.
- Do not mark all 15 Higgsfield items complete. This addresses the P0 queue/render foundation only.
