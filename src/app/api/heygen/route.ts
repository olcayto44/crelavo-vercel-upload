import { createHeyGenTalkingVideo, getHeyGenAvatars, getHeyGenVideoStatus, getHeyGenVoices } from "@/lib/providers/heygen";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "avatars";

  try {
    if (action === "voices") return Response.json({ action, result: await getHeyGenVoices() });
    if (action === "status") {
      const videoId = url.searchParams.get("video_id") || "";
      if (!videoId) return Response.json({ error: "video_id is required." }, { status: 400 });
      return Response.json({ action, result: await getHeyGenVideoStatus(videoId) });
    }
    return Response.json({ action: "avatars", result: await getHeyGenAvatars() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "HeyGen request failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createHeyGenTalkingVideo(body);
    return Response.json({ action: "generate", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "HeyGen video generation failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
