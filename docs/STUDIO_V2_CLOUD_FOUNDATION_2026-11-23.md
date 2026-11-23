# Studio V2 P0 cloud foundation — 2026-11-23

## Applied to crelavo Supabase
Project ref: `yahegfagwxvixjnybkaw`. Applied migration: `studio_v2_cloud_project_assets_foundation`.

Additive schema:
- `public.studio_projects`: owner-scoped projects with category, title, settings, status, timestamps.
- `public.studio_assets`: project-linked media metadata and private object paths, with composite (project_id,user_id) ownership foreign key.
- `public.studio_timeline_versions`: immutable-numbered timeline JSON snapshots, scoped to the same owner and project.
- `storage.buckets`: `studio-private`, private, max single object 100 MiB, owner-first path convention `<auth-user-id>/<project-id>/<file>`.
- RLS enabled on all 3 tables. Policies: projects 4, assets 4, timeline 3. Storage objects: 4 owner-folder scoped policies. Authenticated grants only.
- Existing buckets `production-assets`, `provider-assets`, `user-materials` were not changed. No production render or credits were enabled.

## Validation
- Supabase migration returned success.
- Post-migration pg_tables query confirmed all 3 tables with RLS on and policy counts 4/4/3.
- Storage owner-scoped policy count returned 4.
- Supabase security advisors were queried; existing project-wide warnings must be separately triaged.
- This is a **database foundation only**, not a completed cross-device project feature or tested user E2E.

## Next integration steps (not yet completed)
1. Implement server-side authenticated upload/signed-download endpoints and enforce project ownership + file MIME/size restrictions.
2. Persist browser timeline and Elements references to these tables; provide conflict-aware cross-device sync and version restore.
3. Test with two different signed-in accounts: forbidden cross-owner read/write; allowed same-owner flows; actual playable video and download.
4. Only then implement queued server-side FFmpeg MP4 rendering with idempotent credits.
5. Preserve the Nov 22 Studio V2 shell and default UI behavior throughout.

Do not mark P0 as production-ready until the authenticated integration tests pass.
