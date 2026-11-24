# Crelavo master development tracker
Updated 2026-11-24. Development branch: feat/studio-cloud-elements-20261123.
## Release policy
No new modules until Video Editor stabilization. A successful Vercel build is not a media test. Mark complete only with evidence of UI, rendering, persistence (where applicable), functional tests and deployment. Do not promote preview to production until release gates pass.
## Phase 1 — worker infrastructure (blocking)
- [ ] Dedicated FFmpeg-capable host; persistent worker service, FFmpeg/ffprobe, private credentials configured on host.
- [ ] Licensed, pinned RNNoise-compatible model installed and validated; no silent fallback.
- [ ] Supabase queue ownership, leases, retry, cancellation, progress, resource limits tested.
- [ ] Actual MP4 job submitted, processed, downloaded; measure runtime and memory.
## Phase 2 — render parity
- [ ] Crossfade preview with overlapping clips, audio, timeline duration and layer timestamps synchronized.
- [ ] MP4 export UI, job status, download and failure handling.
- [ ] MP4 text/title/subtitle burn-in and all transition styles.
- [ ] MP4 image/logo overlays, keyframes, voiceover, music, ducking, compression, spectral/neural noise reduction: real outputs tested.
- [ ] Browser preview/audio parity, source waveforms, seek and downloaded file indexing.
## Phase 3 — editing gaps
- [ ] Layer edge trimming, snap, ripple delete, keyboard shortcuts, all-layer undo/redo.
- [ ] Per-boundary transition settings, rotation animation, easing, presets, direct canvas positioning.
- [ ] Audio detach, independent trim, normalization, equalizer, multiple voice tracks.
## Phase 4 — project and output gaps
- [ ] Local recovery and cloud roundtrip with all layers; isolation and file cleanup.
- [ ] Project history UI, multiple projects, duplicate/delete, large upload.
- [ ] Output resolution/FPS, 2K/4K, MOV/GIF after baseline MP4 passes.
## Phase 5 — acceptance tests
- [ ] Synthetic and real-user 1, 5, 20–30 clip cases; 16:9, 9:16, 1:1; 480/720/1080p.
- [ ] Animated alpha PNG, voice/music sync, source transforms, crossfade duration, audio streams, model denoise, playable seekable MP4.
- [ ] Long projects, resource use, desktop/mobile, cancellation, security, preview acceptance and production release.
## Platform roadmap (not started by this tracker)
1. Stabilize current system
2. Shared Omni assistant/model router/project/API/security/credits
3. Professional video editor
4. Universal asset library
5. Character and voice consistency
6. Smart highlights, shorts and original video creation
7. Hooks, thumbnails, localization, publishing
8. Competitor intelligence, SEO, ads and trends
9. Commercial ad/brand/ecommerce/document studios
10. Complete existing categories including website and app builders
11. ChatGPT/Claude MCP and developer API
12. Agents, automation, marketplace and academy
## Evidence
- 868a094 editor MP4-only Crossfade/AI denoise controls: Vercel READY verified. Browser crossfade not implemented. Dedicated host and model not verified.
- Earlier worker, image, audio and cloud commits compiled but runtime acceptance is open.

## Runtime evidence — 2026-11-24
- GitHub Actions run 45377595128, commit 492f5a7: SUCCESS; Vercel READY dpl_Huad3tCmwLQacN872BKX8sVEW7R5.
- Real synthetic 854x480 H.264/AAC render: baseline 4.021333s, 768ms; crossfade 3.61s, 1181ms; audio 3.987696s, 851ms; animation 4.005333s, 1137ms. All four passed stream/dimension/duration assertions.
- Neural denoise skipped: model not configured. Visual pixel-level and audio signal-level correctness, browser playback, Supabase roundtrip, dedicated worker deployment and full load tests remain open. No production release.
