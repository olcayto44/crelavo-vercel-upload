import { createMiniMaxH3VideoTask, listMiniMaxH3VideoTasks, minimaxReadiness, MiniMaxStatusError, queryMiniMaxH3VideoTask, type MiniMaxH3CreateInput } from "@/lib/providers/minimax";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function clampMiniMaxDuration(value: unknown): 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 {
  const numeric = Math.round(Number(value || 4));
  const clamped = Math.min(15, Math.max(4, Number.isFinite(numeric) ? numeric : 4));
  return clamped as 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
}

function safeRatio(value: unknown) {
  const ratio = clean(value) || "9:16";
  return (["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"] as const).includes(ratio as never) ? ratio as "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16" : "9:16";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = clean(searchParams.get("action") || "readiness").toLowerCase();

    if (action === "readiness") {
      return Response.json({
        minimax: minimaxReadiness(),
        note: "Secrets are not returned. This endpoint only confirms whether MINIMAX_API_KEY and MINIMAX_GROUP_ID are visible to the backend."
      });
    }

    if (action === "query") {
      const taskId = clean(searchParams.get("task_id"));
      if (!taskId) return Response.json({ error: "task_id is required." }, { status: 400 });
      const result = await queryMiniMaxH3VideoTask(taskId);
      return Response.json({ provider: "minimax", action, result });
    }

    if (action === "list") {
      const pageNum = Math.max(1, Math.round(Number(searchParams.get("page_num") || 1)));
      const pageSize = Math.min(20, Math.max(1, Math.round(Number(searchParams.get("page_size") || 10))));
      const status = clean(searchParams.get("status"));
      const result = await listMiniMaxH3VideoTasks({ pageNum, pageSize, status: status || undefined });
      return Response.json({ provider: "minimax", action, result });
    }

    return Response.json({ error: `Unsupported MiniMax action: ${action}` }, { status: 400 });
  } catch (error) {
    const httpStatus = error instanceof MiniMaxStatusError ? error.httpStatus : 500;
    return Response.json({ provider: "minimax", error: errorMessage(error, "MiniMax request failed."), httpStatus, responseClassification: httpStatus === 404 ? "not_found" : httpStatus === 410 ? "expired" : "http_error" }, { status: httpStatus });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = clean(searchParams.get("action") || "create_h3_test").toLowerCase();
    if (action !== "create_h3_test" && action !== "create_video") return Response.json({ error: `Unsupported MiniMax action: ${action}` }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const prompt = clean(body.prompt || searchParams.get("prompt")) || "Create a polished 6-second vertical ecommerce product teaser for Crelavo: a modern product display rotates gently on a clean studio background, with premium lighting and smooth camera motion.";
    const duration = clampMiniMaxDuration(body.duration || searchParams.get("duration") || 6);
    const ratio = safeRatio(body.ratio || searchParams.get("ratio"));
    const resolution = clean(body.resolution || searchParams.get("resolution")) === "2K" ? "2K" : "768P";

    const requestPayload: MiniMaxH3CreateInput = {
      content: [{ type: "text", text: prompt }],
      resolution,
      duration,
      ratio
    };

    const result = await createMiniMaxH3VideoTask(requestPayload);

    return Response.json({
      provider: "minimax",
      action,
      model: "MiniMax-H3",
      submitted: true,
      submitted_parameters: {
        duration,
        ratio,
        resolution,
        prompt
      },
      task_id: result.task_id,
      request_id: result.request_id,
      next: result.task_id ? `/api/minimax?action=query&task_id=${encodeURIComponent(result.task_id)}` : null,
      raw: result
    });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not create MiniMax H3 task.") }, { status: 500 });
  }
}
