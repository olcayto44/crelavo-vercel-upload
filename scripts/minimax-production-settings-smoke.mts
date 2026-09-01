import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { miniMaxProductionSettings } from "../src/lib/providers/minimax-production-settings.ts";

const selected = { aspectRatio: "9:16", quality: "1080p", providerPrompt: "User's exact production prompt" };
const eightSeconds = miniMaxProductionSettings({ selected, durationSeconds: "8 sec" });
assert.equal(eightSeconds.model, "MiniMax-H3");
assert.equal(eightSeconds.duration, 8);
assert.equal(eightSeconds.ratio, "9:16");
assert.equal(eightSeconds.resolution, "2K");
assert.equal(eightSeconds.providerPrompt, selected.providerPrompt);

const fifteenSeconds = miniMaxProductionSettings({ selected: { aspect_ratio: "9:16", quality: "ordinary", provider_prompt: "15-second brief" }, durationSeconds: 15 });
assert.equal(fifteenSeconds.duration, 15);
assert.equal(fifteenSeconds.ratio, "9:16");
assert.equal(fifteenSeconds.resolution, "768P");
assert.equal(fifteenSeconds.providerPrompt, "15-second brief");

const testMode = miniMaxProductionSettings({ selected: { quality: "ordinary", aspectRatio: "9:16" }, durationSeconds: 15, testMode: true, prompt: "Test prompt" });
assert.equal(testMode.duration, 5);
assert.equal(testMode.ratio, "9:16");
assert.equal(testMode.resolution, "768P");
assert.equal(testMode.providerPrompt, "Test prompt");

const startSource = readFileSync(new URL("../src/app/api/automation/start/route.ts", import.meta.url), "utf8");
const visualsSource = readFileSync(new URL("../src/lib/providers/visuals.ts", import.meta.url), "utf8");
assert.match(startSource, /providerTaskId: visualJob\?\.task_id/);
assert.match(startSource, /task_id: visualJob\?\.task_id/);
assert.match(visualsSource, /content: \[\{ type: "text", text: settings\.providerPrompt \}\]/);
console.log("MiniMax production settings smoke passed");
