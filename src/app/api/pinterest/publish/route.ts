import { decryptConnectedToken } from "@/lib/connected-accounts";
import { requireVerifiedRequestUser, supabaseAdmin } from "@/lib/supabase";

function clean(value: unknown) { return String(value ?? "").trim(); }

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userId = clean(body.user_id ?? body.userId);
  const accountId = clean(body.connected_account_id ?? body.connectedAccountId);
  const boardId = clean(body.board_id ?? body.boardId);
  const videoUrl = clean(body.video_url ?? body.videoUrl);
  const title = clean(body.title);
  const description = clean(body.description ?? body.caption);
  const link = clean(body.link) || "https://crelavo.com/?utm_source=pinterest&utm_medium=organic&utm_campaign=crelavo_showcase";
  if (!userId || !accountId || !boardId || !videoUrl || !title) return Response.json({ error: "user_id, connected_account_id, board_id, video_url and title are required." }, { status: 400 });
  const auth = await requireVerifiedRequestUser(request, userId);
  if (!auth.ok) return auth.response;
  const admin = supabaseAdmin();
  const { data: account, error } = await admin.from("connected_accounts").select("id,provider,access_token_encrypted,status").eq("id", accountId).eq("user_id", userId).single();
  if (error || !account || account.provider !== "pinterest") return Response.json({ error: "Pinterest account not found." }, { status: 404 });
  if (account.status !== "connected") return Response.json({ error: "Pinterest account is not connected." }, { status: 409 });
  const token = decryptConnectedToken(account.access_token_encrypted);
  if (!token) return Response.json({ error: "Pinterest access token is missing." }, { status: 400 });
  const { data: duplicate } = await admin.from("connected_account_jobs").select("id,result,status").eq("user_id", userId).eq("connected_account_id", accountId).eq("provider", "pinterest").eq("job_type", "one_click_publish").eq("payload->>video_url", videoUrl).in("status", ["queued", "completed"]).limit(1).maybeSingle();
  if (duplicate) return Response.json({ error: "This video has already been queued or published to Pinterest.", job: duplicate }, { status: 409 });
  const videoResponse = await fetch(videoUrl, { cache: "no-store" });
  if (!videoResponse.ok || !videoResponse.body) return Response.json({ error: "The video URL could not be fetched by the server." }, { status: 400 });
  const mediaCreate = await fetch("https://api.pinterest.com/v5/media", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ media_type: "video" }) });
  const mediaData = await mediaCreate.json().catch(() => ({}));
  if (!mediaCreate.ok || !mediaData.media_id || !mediaData.upload_url) return Response.json({ error: String(mediaData.message || "Pinterest video upload could not be initialized."), details: mediaData }, { status: mediaCreate.status || 502 });
  const form = new FormData();
  const uploadParameters = mediaData.upload_parameters || {};
  for (const [key, value] of Object.entries(uploadParameters)) form.append(key, String(value));
  form.append("file", new Blob([await videoResponse.arrayBuffer()], { type: videoResponse.headers.get("content-type") || "video/mp4" }), "crelavo-video.mp4");
  const upload = await fetch(String(mediaData.upload_url), { method: "POST", body: form });
  if (!upload.ok) return Response.json({ error: "Pinterest video upload failed." }, { status: 502 });
  const pinResponse = await fetch("https://api.pinterest.com/v5/pins", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ board_id: boardId, title, description, link, media_source: { source_type: "video_id", media_id: String(mediaData.media_id) } }) });
  const pinData = await pinResponse.json().catch(() => ({}));
  if (!pinResponse.ok) return Response.json({ error: String(pinData.message || "Pinterest Pin creation failed."), details: pinData }, { status: pinResponse.status || 502 });
  const { data: job, error: jobError } = await admin.from("connected_account_jobs").insert({ user_id: userId, connected_account_id: accountId, provider: "pinterest", job_type: "one_click_publish", status: "completed", approval_required: true, payload: { video_url: videoUrl, board_id: boardId, title, description, link }, result: { pinterest_pin_id: pinData.id || null, media_id: mediaData.media_id } }).select("id,status,result,payload,created_at").single();
  if (jobError) return Response.json({ pin: pinData, warning: "Pin published but local publish history could not be saved." }, { status: 200 });
  return Response.json({ pin: pinData, job });
}