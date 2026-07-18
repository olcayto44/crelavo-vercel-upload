import { validateProductionSafety } from "@/lib/content-safety";
import { clientIpFromRequest, rateLimit, rateLimitResponse, rejectSuspiciousText } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

const maxUploadBytes = 50 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/ogg",
  "audio/mp4",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

function extensionFromName(name: string) {
  const clean = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const ext = clean.split(".").pop();
  return ext && ext !== clean ? ext.slice(0, 12) : "bin";
}

function materialKind(contentType: string) {
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("image/")) return "image";
  return "file";
}

export async function POST(request: Request) {
  try {
    const ip = clientIpFromRequest(request);
    const limit = rateLimit({ key: `upload:${ip}`, limit: 12, windowMs: 15 * 60 * 1000 });
    if (!limit.allowed) return rateLimitResponse(limit.resetAt);

    const formData = await request.formData();
    const userId = String(formData.get("user_id") ?? "").trim();
    const file = formData.get("file");
    const purpose = String(formData.get("purpose") ?? "user_material").trim() || "user_material";

    if (!userId) return Response.json({ error: "User session is required." }, { status: 401 });
    if (!(file instanceof File)) return Response.json({ error: "A material file is required." }, { status: 400 });
    if (file.size <= 0) return Response.json({ error: "The uploaded file is empty." }, { status: 400 });
    if (file.size > maxUploadBytes) return Response.json({ error: "Material files can be up to 50 MB." }, { status: 400 });
    if (!allowedMimeTypes.has(file.type)) {
      return Response.json({ error: "Only audio, video, image, PDF, TXT, DOC/DOCX and ZIP material files are accepted." }, { status: 400 });
    }

    const suspicious = rejectSuspiciousText([file.name, purpose]);
    if (!suspicious.ok) return Response.json({ error: suspicious.message }, { status: 400 });
    const safety = validateProductionSafety([file.name, purpose]);
    if (!safety.ok) return Response.json({ error: safety.message }, { status: 400 });

    const supabase = supabaseAdmin();
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);
    if (authUserError || !authUser.user) {
      return Response.json({ error: "User could not be verified. Please sign in again." }, { status: 401 });
    }
    if (!authUser.user.email_confirmed_at && !authUser.user.confirmed_at) {
      return Response.json({ error: "Material upload requires email confirmation." }, { status: 403 });
    }

    const bucket = process.env.SUPABASE_USER_MATERIALS_BUCKET || "user-materials";
    const ext = extensionFromName(file.name);
    const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const fileUrl = data.publicUrl;

    return Response.json({
      material: {
        type: "user_upload",
        reference_type: purpose,
        title: file.name,
        file_url: fileUrl,
        storage_bucket: bucket,
        storage_path: path,
        content_type: file.type,
        size_bytes: file.size,
        kind: materialKind(file.type),
        rights_confirmed: true,
        usage_tags: ["user-upload", purpose]
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Material upload failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
