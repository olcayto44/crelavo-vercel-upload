import { buildGenericVideoShotPlan, genericVideoShotCount, multiShotFinalGate, orderedReadyShotUrls } from "../src/lib/providers/generic-video-shot-plan.ts";
import { createMiniMaxH3VideoShotTasks } from "../src/lib/providers/minimax.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
}

assertEqual(genericVideoShotCount(30), 6, "30 second shot count");
assertEqual(genericVideoShotCount(5), 1, "5 second shot count");
const shots = buildGenericVideoShotPlan(["Hook", "Proof", "CTA"], 30);
assertEqual(shots.length, 6, "30 second shot plan length");
assertEqual(new Set(shots.map((shot) => shot.prompt)).size, 6, "shot prompts are distinct");
const calls30: number[] = [];
await createMiniMaxH3VideoShotTasks({ targetDurationSeconds: 30, content: [{ type: "text", text: "test" }] }, async (shot) => {
  calls30.push(shot.duration ?? 0);
  return { task_id: `task-${calls30.length}` };
});
assertEqual(calls30.length, 6, "30 second MiniMax call count");
assertEqual(calls30.every((duration) => duration === 5), true, "30 second MiniMax call duration");
const calls5: number[] = [];
await createMiniMaxH3VideoShotTasks({ targetDurationSeconds: 5, content: [{ type: "text", text: "test" }] }, async (shot) => {
  calls5.push(shot.duration ?? 0);
  return { task_id: "task-5" };
});
assertEqual(calls5.length, 1, "5 second MiniMax call count");
assertEqual(calls5[0], 5, "5 second MiniMax call duration");
const premature = multiShotFinalGate({
  targetDurationSeconds: 30,
  visualStatuses: [{ status: "succeeded", outputUrl: "https://cdn.example/shot-1.mp4" }, ...Array.from({ length: 5 }, () => ({ status: "processing", outputUrl: null }))],
  renderStatus: null
});
assertEqual(premature.passed, false, "premature final gate");
assertEqual(premature.reason, "waiting_for_all_shots", "premature final reason");
const partial = multiShotFinalGate({ targetDurationSeconds: 30, expectedJobCount: 1, visualStatuses: [{ status: "running", outputUrl: null }], renderStatus: null });
assertEqual(partial.passed, false, "partial provider gate");
assertEqual(partial.reason, "provider_start_failed_partial", "partial provider reason");
const mergedInput = orderedReadyShotUrls(shots.map((_, index) => ({ status: "succeeded", outputUrl: `https://cdn.example/shot-${index + 1}.mp4` })));
assertEqual(mergedInput.length, 6, "merge receives every shot");
assertEqual(mergedInput[5], "https://cdn.example/shot-6.mp4", "merge preserves shot order");
console.log("generic-video-shots-smoke ok");
