import { advanceShotQueue, buildGenericVideoShotPlan, genericVideoShotCount, multiShotFinalGate, orderedReadyShotUrls } from "../src/lib/providers/generic-video-shot-plan.ts";
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
let queue = { provider: "minimax" as const, durable: true as const, status: "queued" as const, expectedShotCount: 6, nextShotIndex: 1, claimedShotIndex: null };
let queuedJobs: Array<Record<string, unknown>> = [];
const queueCalls: Array<{ shot: number; duration: number; key: string }> = [];
for (let poll = 0; poll < 8; poll += 1) {
  const result = await advanceShotQueue({
    queue,
    jobs: queuedJobs,
    shotPlan: shots,
    submit: async (shot, idempotencyKey) => {
      queueCalls.push({ shot: shot.index, duration: shot.requestedDurationSeconds, key: `production:${idempotencyKey}` });
      return { id: `provider-${shot.index}`, provider: "minimax", status: "submitted" };
    }
  });
  queue = result.queue;
  queuedJobs = result.jobs;
}
assertEqual(queueCalls.length, 6, "sequential queue provider call count");
assertEqual(queueCalls.every((call) => call.duration === 5), true, "sequential queue duration");
assertEqual(queueCalls.map((call) => call.shot).join(","), "1,2,3,4,5,6", "sequential queue order");
assertEqual(new Set(queueCalls.map((call) => call.key)).size, 6, "shot idempotency keys");
const duplicatePoll = await advanceShotQueue({ queue, jobs: queuedJobs, shotPlan: shots, submit: async () => { throw new Error("duplicate provider call"); } });
assertEqual(duplicatePoll.jobs.length, 6, "repeated polling does not duplicate calls");
const premature = multiShotFinalGate({
  targetDurationSeconds: 30,
  visualStatuses: [{ status: "succeeded", outputUrl: "https://cdn.example/shot-1.mp4" }, ...Array.from({ length: 5 }, () => ({ status: "processing", outputUrl: null }))],
  renderStatus: null
});
assertEqual(premature.passed, false, "premature final gate");
assertEqual(premature.reason, "waiting_for_all_shots", "premature final reason");
const partial = multiShotFinalGate({ targetDurationSeconds: 30, expectedJobCount: 1, visualStatuses: [{ status: "succeeded", outputUrl: "https://cdn.example/shot-1.mp4" }], renderStatus: null });
assertEqual(partial.passed, false, "partial provider gate");
assertEqual(partial.reason, "provider_start_failed_partial", "partial provider reason");
const noJobs = multiShotFinalGate({ targetDurationSeconds: 30, expectedJobCount: 0, visualStatuses: [], renderStatus: null });
assertEqual(noJobs.passed, false, "no-job provider gate");
assertEqual(noJobs.reason, "provider_start_failed_partial", "no-job provider reason");
const mergedInput = orderedReadyShotUrls(shots.map((_, index) => ({ status: "succeeded", outputUrl: `https://cdn.example/shot-${index + 1}.mp4` })));
assertEqual(mergedInput.length, 6, "merge receives every shot");
assertEqual(mergedInput[5], "https://cdn.example/shot-6.mp4", "merge preserves shot order");
console.log("generic-video-shots-smoke ok");
