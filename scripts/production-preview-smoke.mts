import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/ProductionWorkspace.tsx", import.meta.url), "utf8");
const workAssistantSource = readFileSync(new URL("../src/components/WorkAssistant.tsx", import.meta.url), "utf8");

assert.match(source, /outputJson\.previewUrl/);
assert.match(source, /outputJson\.finalVideoUrl/);
assert.match(source, /outputJson\.providerFinalUrl/);
assert.match(source, /const mediaOutputReleased = !isDroneRawPreviewOnly && \(hasPlayableMediaUrl/);
assert.match(source, /const playbackUrl = \(isMediaProduction \|\| isImageProduction \? deliveryUrl : ""\) \|\| previewUrl;/);
assert.match(source, /<section className=\{`customer-preview-theater preview-mode-\$\{previewMode\}`\}>/);
assert.match(source, /<video src=\{playbackUrl\} controls playsInline/);
assert.match(source, /production-waiting-room/);
assert.equal((source.match(/customer-preview-theater/g) ?? []).length, 1, "preview theater must be rendered once");
assert.equal((source.match(/<RefreshCcw/g) ?? []).length, 1, "revision action must be rendered once");
assert.match(source, /production-job-overview-card/);
assert.match(source, /Final delivery/);
assert.doesNotMatch(source, /actionableWaitingState/);
assert.doesNotMatch(source, /Provider status unavailable \/ Action required/);
assert.match(workAssistantSource, /productionCardStatus/);

console.log("Production preview smoke tests passed.");
