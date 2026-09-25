import { isAdminRequest, adminRequiredResponse } from "@/lib/admin-guard";
import { uploadProviderAsset } from "@/lib/providers/storage";

const maxBytes = 80 * 1024 * 1024;
const videoTypes = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"]);
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function extension(name: string, type: string) {
  const fromName = name.toLowerCase().split(".").pop()?.replace(/[^a-z0-9]/g, "");
  if (fromName && fromName.length <= 6) return fromName;
  if (type.includes("webm")) return "webm";
  if (type.includes("quicktime")) return "mov";
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  return type.startsWith("image/") ? "jpg" : "mp4";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const adminEmail = String(form.get("adminEmail") ?? "").trim();
    const adminToken = String(form.get("adminToken") ?? "").trim();
    const body = { adminEmail, adminToken };
    if (!isAdminRequest(request, body)) return adminRequiredResponse();
    const file = form.get("file");
    const kind = String(form.get("kind") ?? "video");
    if (!(file instanceof File)) return Response.json({ error: "Bir dosya seçin." }, { status: 400 });
    if (file.size <= 0 || file.size > maxBytes) return Response.json({ error: "Dosya boş veya 80 MB sınırını aşıyor." }, { status: 400 });
    const contentType = String(file.type || "application/octet-stream").toLowerCase();
    const allowed = kind === "thumbnail" ? imageTypes : videoTypes;
    if (!allowed.has(contentType)) return Response.json({ error: kind === "thumbnail" ? "Thumbnail JPG, PNG veya WEBP olmalı." : "Video MP4, WEBM, MOV veya M4V olmalı." }, { status: 400 });
    const filePath = `showcase/${Date.now()}-${crypto.randomUUID()}.${extension(file.name, contentType)}`;
    const url = await uploadProviderAsset(filePath, await file.arrayBuffer(), contentType);
    return Response.json({ url, kind, fileName: file.name });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Showcase dosyası yüklenemedi." }, { status: 500 });
  }
}
