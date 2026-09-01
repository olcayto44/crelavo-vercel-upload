import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/ProductionWorkspace.tsx", import.meta.url), "utf8");

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
assert.match(source, /\{previewKind === "video" \? \(\s*<video src=\{playbackUrl\}/);
assert.match(source, /providerStatusUnavailable \? nextLiveStep/);
assert.match(source, /Video preview waiting/);
assert.match(source, /<PlayCircle size=\{44\} aria-hidden="true" \/>/);
assert.match(source, /providerStatusUnavailable \? <button className="btn" style=\{\{ fontWeight: 800 \}\}/);
assert.match(source, /providerStatusUnavailable \? <button className="btn" style=\{\{ fontWeight: 800 \}\}[\s\S]*refreshProviderStatus\(false\)[\s\S]*: <button/);
assert.doesNotMatch(source, /customer-preview-control \{\s*display:\s*none/);
assert.doesNotMatch(source, /minimaxVideoId[^\n]*https?:\/\//);

console.log("Production preview smoke tests passed.");
