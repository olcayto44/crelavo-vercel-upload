import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/ProductionWorkspace.tsx", import.meta.url), "utf8");

assert.match(source, /outputJson\.previewUrl/);
assert.match(source, /outputJson\.preview_url/);
assert.match(source, /production\.preview_url/);
assert.match(source, /const hasPlayableMediaUrl = Boolean\(rawPreviewUrl \|\| rawDeliveryUrl\);/);
assert.match(source, /const previewUrl = isDroneRawPreviewOnly \? rawPreviewUrl : isMediaProduction && !mediaOutputReleased \? "" : rawPreviewUrl;/);
assert.match(source, /const playbackUrl = \(isMediaProduction \|\| isImageProduction \? deliveryUrl : ""\) \|\| previewUrl;/);
assert.match(source, /\{previewKind === "video" \? \(\s*<video src=\{playbackUrl\}/);
assert.match(source, /providerStatusUnavailable \? nextLiveStep/);
assert.match(source, /\{playbackUrl \? <a className="btn" href=\{playbackUrl\}/);
assert.match(source, /<button className="btn" type="button" disabled><PlayCircle size=\{14\} \/> Preview<\/button>/);
assert.match(source, /production-waiting-room/);
assert.doesNotMatch(source, /minimaxVideoId[^\n]*https?:\/\//);

console.log("Production preview smoke tests passed.");
