import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/ProductionWorkspace.tsx", import.meta.url), "utf8");
const workAssistantSource = readFileSync(new URL("../src/components/WorkAssistant.tsx", import.meta.url), "utf8");

assert.match(source, /outputJson\.playbackUrl/);
assert.match(source, /outputJson\.previewUrl/);
assert.match(source, /outputJson\.finalVideoUrl/);
assert.match(source, /outputJson\.providerFinalUrl/);
assert.match(source, /const confirmedMediaUrl = isDroneRawPreviewOnly \? "" : firstPlayableMediaUrl\(/);
assert.match(source, /const mediaOutputReleased = Boolean\(confirmedMediaUrl\);/);
assert.match(source, /const hasVerifiedPlayableUrl = Boolean\(playbackUrl && safePlayableMediaUrl\(playbackUrl\)\);/);
assert.match(source, /<section className=\{`customer-preview-theater preview-mode-\$\{previewMode\}`\}>/);
assert.match(source, /Preview waiting for a validated MP4 URL/);
assert.match(source, /Provider status alone does not count as a finished delivery/);
assert.match(source, /\{hasVerifiedPlayableUrl \? \(\s*<video src=\{playbackUrl\} controls preload="metadata"/);
assert.equal((source.match(/className="provider-status-alert"/g) ?? []).length, 1, "provider warning must be rendered once");
assert.equal((source.match(/customer-preview-theater/g) ?? []).length, 1, "preview theater must be rendered once");
assert.equal((source.match(/<RefreshCcw size=\{14\} aria-hidden="true" \/>/g) ?? []).length, 0, "refresh icon should remain available only through the single shared action");
assert.equal((source.match(/<RefreshCcw size=\{14\} \/>/g) ?? []).length, 1, "provider refresh action must be rendered once");
assert.doesNotMatch(source, /<pre>\{automationScript\}<\/pre>/);
assert.doesNotMatch(source, /Creative director live board/);
assert.doesNotMatch(source, /Minimax proof:/);
assert.doesNotMatch(source, /Provider job: \{String\(visualJob\.provider\)/);
assert.doesNotMatch(source, /Final MP4.*jobdone/i);
assert.match(source, /hasProviderJobEvidence/);
assert.match(source, /isFailed \|\| providerStatusUnavailable \|\| hasProviderJobEvidence \? "Action required"/);
assert.match(source, /const canShowRealtimeProgress = hasActiveProviderJob && !providerStatusUnavailable && !isFailed;/);
assert.doesNotMatch(source, /providerProgress/);
assert.match(source, /production milestones/i);
assert.match(source, /revisionEnabled = isReady \|\| hasPreview/);
assert.match(source, /revisionEnabled \? <button className="btn secondary"/);
assert.match(workAssistantSource, /if \(providerUnavailable\) return "Provider status unavailable \/ Action required";/);

console.log("Production preview smoke tests passed.");
