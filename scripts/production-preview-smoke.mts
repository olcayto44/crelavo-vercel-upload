import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/ProductionWorkspace.tsx", import.meta.url), "utf8");
const workAssistantSource = readFileSync(new URL("../src/components/WorkAssistant.tsx", import.meta.url), "utf8");

assert.match(source, /outputJson\.playbackUrl/);
assert.match(source, /outputJson\.previewUrl/);
assert.match(source, /outputJson\.preview_url/);
assert.match(source, /outputJson\.finalVideoUrl/);
assert.match(source, /outputJson\.providerFinalUrl/);
assert.match(source, /outputJson\.rawVisualPreviewUrl/);
assert.match(source, /mediaVisualStatus\.outputUrl/);
assert.match(source, /liveVisualStatus\.outputUrl/);
assert.match(source, /const hasPlayableMediaUrl = Boolean\(rawPreviewUrl \|\| rawDeliveryUrl\);/);
assert.match(source, /const previewUrl = rawPreviewUrl;/);
assert.match(source, /const playbackUrl = \(isMediaProduction \|\| isImageProduction \? deliveryUrl : ""\) \|\| previewUrl;/);
assert.match(source, /<section className=\{`customer-preview-theater preview-mode-\$\{previewMode\}`\}>/);
assert.match(source, /const hasVerifiedPlayableUrl = Boolean\(playbackUrl && safePlayableMediaUrl\(playbackUrl\)\);/);
assert.match(source, /\{hasVerifiedPlayableUrl \? \(\s*<video src=\{playbackUrl\} controls preload="metadata"/);
assert.match(source, /providerStatusUnavailable \? nextLiveStep/);
assert.match(source, /providerStatusUnavailable \? <div className="provider-status-alert" role="alert">/);
assert.equal((source.match(/className="provider-status-alert"/g) ?? []).length, 1, "provider warning must be rendered once");
assert.equal((source.match(/className="provider-status-card"/g) ?? []).length, 1, "provider status card must be rendered once");
assert.match(source, /providerStatusUnavailable \? <article className="provider-status-card">/);
assert.match(workAssistantSource, /if \(providerUnavailable\) return "Provider status unavailable \/ Action required";/);
assert.match(source, /Blocked — awaiting provider resolution/);
assert.match(source, /providerProgress !== null/);
assert.match(source, /Progress unavailable/);
assert.doesNotMatch(source, /providerStatusUnavailable && isMediaProduction/);
assert.doesNotMatch(source, /<button[^>]*>\s*<PlayCircle[^>]*\/>\s*Play\s*<\/button>/);
assert.match(source, /const canShowRealtimeProgress = hasActiveProviderJob && !providerStatusUnavailable && !isFailed;/);
assert.doesNotMatch(source, /customer-preview-control \{\s*display:\s*none/);
assert.doesNotMatch(source, /minimaxVideoId[^\n]*https?:\/\//);

console.log("Production preview smoke tests passed.");
