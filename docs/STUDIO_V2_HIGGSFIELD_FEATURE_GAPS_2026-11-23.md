# Crelavo Studio V2 — Higgsfield Capability Gap Matrix
Date: 2026-11-23 · Status: staged implementation; not all 15 areas are production-ready. Do not confuse UI presence with a functioning AI provider.

## 2026-11-23 22:15 screen-recording regression findings
Source: user's original 113-second Studio V2 MP4; verified frame samples, no authenticated browser E2E.
- Seen: intermittent gray broken-file Canvas when switching video tabs; can be aggravated by async saved-video hydration forcing the auxiliary panel closed. Code now only closes aux when the active view is Canvas. **Browser retest pending.**
- Seen: Elements controls crowded on one line; changed to labeled responsive grid with local image thumbnails. **Browser retest pending.**
- Seen: saved video Timeline uses navigation/seek points and cannot edit the source stream. Added explicit separation and local editor button; **cloud-origin imports still unavailable**.
- Seen: provider was listed for selected saved video while duration and ratio were absent. Ready-video player now publishes factual duration and dimensions to right sidebar on loadedmetadata; **model/quality are not invented if missing from production record**.
- Seen: many categories have only brief/workspace placeholders. This is not a completed AI feature.
- Production-safe rule: paid AI provider invocations remain gated until authorized cost, provider, render, billing and final delivery are verified with owner-scoped E2E.

## Non-negotiable design and delivery
- Retain approved Nov 22 Studio V2 shell: left categories/projects, center Canvas and timeline, right assistant and plan.
- English default with explicit EN/TR/DE/ES/FR/AR interface selector, distinct from content/dubbing language.
- Every capability must be exercised with a signed-in customer, actual source assets, provider response, persisted output, billing accounting, Canvas preview and downloadable artifact.
- Production charges stay OFF unless reconciled atomic billing and provider-specific verified pricing pass end-to-end checks.
- Original character, face and cloned voice require explicit rights and consent. Do not represent an image reference as a trained identity.

## A. Video Editor / Timeline / Clip Join — P0
Crelavo categories: video, video_clipping, video_tools, cinematic_video, studio, documentary, music_video.
Now: Studio has real ready-video playback/seek and *local* Add/Remove/Reorder/Trim/Split/Merge with browser MediaRecorder downloadable WebM. Signed-in users may save and reopen one local timeline per account in the same browser. User-supplied SRT captions, title overlays, background music mixing, gain/fade and optional fade-to-black between clips are implemented, with a real SRT parser smoke test. The editor is not cloud-rendered and is not claimed browser-E2E verified.
Missing: cloud-import saved productions without CORS leakage; multi-track audio, fades/transitions, overlays, keyframes, captions, templates, export MP4/H.264, server-side FFmpeg worker, background job cancellation and job persistence, clip-level edit histories, clip splitting into persistent source files, multi-person timeline collaboration.
Acceptance: merge three 10-second clips into one downloaded MP4 with audio, trim second clip, transition 1↔2, save/reopen project, compare expected total duration and audio continuity.

## B. Cinema Studio / Shot Planning / Camera Controls — P1
Categories: video, cinematic_video, drone_video, nature_video, planet_space_video.
Missing: camera bodies/lens simulation, aperture, color grading, lighting, shot types, camera moves, start/end frame, motion reference, director AI plans, shot-level multi-model routing with actual feature constraints and estimated costs.
Acceptance: two scenes share identity/location, model options are verified against provider schema; any unsupported setting is disabled.

## C. Character Creator / AI Influencer — P1
Categories: virtual_model_studio, visual_clone, avatar, talking_video.
Now: Elements locally stores authorized character references and descriptions, not trained characters.
Missing: visual attribute designer, face geometry options, full-body/turnaround shots, expressions, poses, outfits, character model generation, reuse and identity consistency across scenes, rights checks and deletion.
Acceptance: same created character appears across five distinct shots with persistent, named identity, reproducible settings, provenance and no unauthorized clone.

## D. Digital Twin / Soul-ID-equivalent — P1
Categories: visual_clone, virtual_model_studio, voice_clone, talking_video, lip_sync.
Missing: dedicated consent-based photo/voice enrollment, identity ownership verification, reference quality checks, training/adapters where supported, versioned identity, revocation, face/voice consistency eval.
Acceptance: a consenting creator's face and authorized voice remain recognizable across different settings and can be deleted and revoked.

## E. Elements / Object / Location / Environment — P1
Categories: image, video, studio, brand_kit, campaign, virtual_model_studio.
Now: local IndexedDB library supports image/video/audio reference files named character, product, location, wardrobe, voice, style; assistant can use textual reference notes.
Missing: encrypted owner-scoped cloud storage, multi-device sync, provider reference attachment, versioned asset IDs, editable masks, scene mapping, per-asset rights, tag/collection search, consistent product/logo/text in final outputs.
Acceptance: named @character, @product and @room all appear consistently in three final outputs.

## F. Advanced AI Video Editing / Editing Room — P1
Categories: video_tools, video, video_clipping.
Missing: moment/time-span selector, swap person/object, change angle/location, motion transfer, video relight, brush-based masked edits, extend, upscale, FPS interpolation, side-by-side before/after, verified AI model endpoints.
Acceptance: edit an indicated 2-second segment without changing other frames; provider output and credit charge are stored exactly once.

## G. Voice / Lip Sync / Dubbing / Localization — P1
Categories: talking_video, avatar, lip_sync, voice_clone, localization, cultural_localization.
Missing: multilingual STT and timed transcripts, translated script review, permissions for custom voices, TTS/voice conversion, phoneme/alignment lip sync, speaker separation, SRT/VTT, export and per-target-language subtitled videos.
Acceptance: source Turkish dialogue to reviewed English speech with synchronized subtitles and optional verified lip sync.

## H. Music / Sound Design / Audio Tracks — P2
Categories: music_video, voice_clone, video, studio.
Implemented partially: browser-local mixing of one user-provided licensed background soundtrack, adjustable level, audio fade and source-audio mute toggle into WebM video.
Missing: original song/instrumental composer with license rights, BPM/key, stems, multi-track audio workstation, noise reduction, effects library, ducking, waveform editing, beat-sync video cuts and independent WAV/MP3/stems export.
Acceptance: recorded voice + original rights-cleared music mixed into output with intelligible narration and exportable stem licenses.

## I. Product Ads / UGC / Marketing Studio / AI AD STUDIO — P1
Categories: campaign, brand_kit, ad_score_checker, campaign_calendar, talking_video.
Missing: product URL ingestion with rights checks, product media extraction, UGC avatar templates, hook/script/CTA variants, watermark/logo preservation, platform templates, bulk generation and traceable campaign output lineage.
Acceptance: one approved product produces 3 scripts × 3 ratios; outputs use consistent identity and brand assets and bill only for delivered assets.

## J. Storyboard / Short Drama / Series / Anime — P2
Categories: drama, studio, documentary, animation, anime_short_film, music_video.
Missing: screenplay parser, cast/place bible, shot list, continuity, episodes, panel/storyboard editing, per-shot approvals, scene-specific rendering, stitching with audio.
Acceptance: export a two-scene episode with maintained character/location and editable shot list.

## K. Images / Layers / Inpaint / Effects — P2
Categories: image, brand_kit, virtual_model_studio.
Partially implemented: a local Canvas image editor reachable inside original Studio V2 for image/character categories; supports user-uploaded source, centered aspect crop (original, 1:1, 16:9, 9:16, 4:5), rotate, horizontal flip, brightness, contrast, saturation, before/after hold and real PNG export. No AI charges or cloud upload.
Missing: selection/mask brush, inpainting/outpainting, object cleanup, layers, image references attached to model, provider-specific resolution, color-hex styles, product shots, background removal, batch AI variants and owner-scoped cloud asset persistence.
Acceptance: changing a selected object preserves unmasked image areas and produces downloadable outputs.

## L. Workflow Canvas / Automation / Model Router — P0/P2
Categories: all 37.
Missing: typed task nodes, human plan approval, provider capability registry, model fallback with cost/quality limits, connected asset lineage, background media jobs with resumption, idempotent retries and admin diagnostics.
Acceptance: brief → storyboard → assets → provider → montage → preview → revision → export with persisted statuses, no silent mock or unverified debit.

## M. Project Persistence / Collaboration / Version History — P0
Categories: all 37.
Partially implemented: browser-local account-keyed IndexedDB saved video timeline (including source video Files, optional soundtrack, captions and title), and a separate local Elements reference library. Website Builder has existing content revision/rollback.
Missing: server-persisted Studio timeline and media projects, cloud assets, cross-device sync, cross-user collaboration, full Studio version/rollback, asset lineage, audit logs and shared production-workflow permissions.
Acceptance: close browser, reopen on a new device and edit the same timeline with the same assets without duplicated costs.

## N. Production Credits / Provider QA / Delivery — P0
Categories: every paid workflow.
Missing: validated live provider prices and production entitlements, guarded Reserve/Settle/Release/Refund, migration verification, user balance display, delivery probes, retries and provider outage controls.
Acceptance: one successful render = one settlement; failure = released reservation; download works and final files are authenticated owner-scoped.

## O. Additional adjacent modules — P3
Property/3D environment walkthroughs, manga/webtoon publishing, game builder/playable prototype, creator-team workflows and marketing analytics. These are potential separate Crelavo categories, not yet proven existing functional features.

### Grounding
Higgsfield official references as of 2026-11-23:
- https://higgsfield.ai/creator-hub/help-center/tools/which-higgsfield-tool-should-i-use
- https://higgsfield.ai/creator-hub/changelog
- https://higgsfield.ai/ai-video-editor
- https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-create-and-use-a-soul-id-character
- https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-cinema-studio

Caution: official documentation describes Higgsfield's workflows; this file is a Crelavo requirement and gap report, not a claim that every listed feature or combined workflow is implemented by either platform.
