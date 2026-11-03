import { uploadProviderAsset } from "@/lib/providers/storage";
import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin-guard";
import { ADMIN_SESSION_COOKIE, getAdminSessionPayload, getCookieValue } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase";
import { BLOG_CONFIG_KEY, readBlogPosts, validateBlogPost, blogStorageError } from "@/lib/blog-posts";
import { productionSeoPages } from "@/lib/production-seo-pages";
import { ecommerceIntegrationGuides } from "@/lib/ecommerce-integration-guides";
export const dynamic = "force-dynamic";
async function authorize(request: Request) {
  // Never authorize content writes from an email header alone.
  const session = getAdminSessionPayload(getCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE));
  if (!session) return Response.json({ error: "Yönetici oturumu gerekli." }, { status: 403 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "İstek kaynağı geçersiz." }, { status: 403 });
  const access = await requireAdminPermission(request, "content");
  return access.ok ? null : access.response;
}
export async function GET(request: Request) {
  try {
  const denied = await authorize(request); if (denied) return denied;
  const { data, error } = await supabaseAdmin().from("platform_configs").select("value, updated_at").eq("key", BLOG_CONFIG_KEY).maybeSingle();
  if (error) throw error;
  return Response.json({ posts: readBlogPosts(data?.value), revision: data?.updated_at ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { const detail = blogStorageError(error); console.error("blog_admin_read_failed", detail.code); return Response.json({ error: detail.message, code: detail.code }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
  const denied = await authorize(request); if (denied) return denied;
  if (request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    if (Number(request.headers.get("content-length") || 0) > 3 * 1024 * 1024 + 65536) return Response.json({ error: "Kapak görseli en fazla 3 MB olabilir." }, { status: 413 });
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024) return Response.json({ error: "En fazla 3 MB boyutunda JPG, PNG veya WebP dosyası seçin." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer()), type = file.type.toLowerCase();
    const png = bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((value,index) => bytes[index] === value);
    const jpeg = bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP";
    const extension = type === "image/png" && png ? "png" : type === "image/jpeg" && jpeg ? "jpg" : type === "image/webp" && webp ? "webp" : null;
    if (!extension) return Response.json({ error: "Dosya içeriği JPG, PNG veya WebP ile eşleşmiyor. SVG ve HTML kabul edilmez." }, { status: 400 });
    try {
      const url = await uploadProviderAsset("blog/covers/" + crypto.randomUUID() + "." + extension, bytes, type);
      if (!url.startsWith("https://")) throw new Error("public_url_unavailable");
      return Response.json({ url }, { headers: { "Cache-Control": "no-store" } });
    } catch { return Response.json({ error: "Kapak yüklenemedi. Dosya depolama bağlantısı ve izinleri kontrol edilmeli; mevcut kapak değiştirilmedi." }, { status: 503 }); }
  }
  if (Number(request.headers.get("content-length") || 0) > 200000) return Response.json({ error: "İstek çok büyük." }, { status: 413 });
  const raw = await request.text(); if (raw.length > 200000) return Response.json({ error: "İstek çok büyük." }, { status: 413 });
  let body; try { body = JSON.parse(raw); } catch { return Response.json({ error: "JSON geçersiz." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !["save", "delete"].includes(body.action)) return Response.json({ error: "İşlem geçersiz." }, { status: 400 });
  const db = supabaseAdmin();
  const { data, error } = await db.from("platform_configs").select("value, updated_at").eq("key", BLOG_CONFIG_KEY).maybeSingle();
  if (error) throw error;
  if (body.revision !== (data?.updated_at ?? null)) return Response.json({ error: "Başka bir değişiklik var. Yazıları yeniden yükleyin; yerel metninizi önce kopyalayın." }, { status: 409 });
  let posts = readBlogPosts(data?.value);
  try {
    if (body.action === "delete") {
      if (!posts.some(post => post.id === body.id)) return Response.json({ error: "Yazı bulunamadı." }, { status: 404 });
      posts = posts.filter(post => post.id !== body.id);
    } else {
      const post = validateBlogPost(body.post);
      const reserved = [...ecommerceIntegrationGuides.map(guide => guide.slug), ...productionSeoPages.filter(page => page.section === "blog").map(page => page.slug)];
      if (reserved.includes(post.slug) || posts.some(item => item.slug === post.slug && item.id !== post.id)) return Response.json({ error: "Bu URL zaten kullanılıyor; farklı bir URL girin." }, { status: 409 });
      const old = posts.find(item => item.id === post.id);
      if (old?.publishedAt && old.slug !== post.slug) return Response.json({ error: "Yayınlanmış yazının URL'si SEO bağlantılarını korumak için değiştirilemez." }, { status: 400 });
      post.updatedAt = new Date().toISOString();
      post.createdAt = old?.createdAt || old?.publishedAt || old?.updatedAt || post.updatedAt;
      post.publishedAt = old?.publishedAt || (post.status === "published" ? post.updatedAt : null);
      posts = [...posts.filter(item => item.id !== post.id), post];
      if (posts.length > 500) return Response.json({ error: "En fazla 500 yazı saklanabilir." }, { status: 400 });
    }
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Yazı geçersiz." }, { status: 400 }); }
  const updatedAt = new Date(Math.max(Date.now(), Date.parse(data?.updated_at || "") + 1 || 0)).toISOString();
  const record = { key: BLOG_CONFIG_KEY, value: { posts }, description: "Admin-managed SEO blog articles", updated_at: updatedAt };
  const saved = data
    ? await db.from("platform_configs").update(record).eq("key", BLOG_CONFIG_KEY).eq("updated_at", data.updated_at).select("updated_at").maybeSingle()
    : await db.from("platform_configs").insert(record).select("updated_at").single();
  if (saved.error || !saved.data) return Response.json({ error: "Kaydedilemedi veya kayıt değişti. Yeniden yükleyip deneyin." }, { status: saved.error?.code === "23505" || !saved.error ? 409 : 503 });
  // Re-read persisted state before telling the editor that publication succeeded.
  const verified = await db.from("platform_configs").select("value, updated_at").eq("key", BLOG_CONFIG_KEY).maybeSingle();
  if (verified.error || !verified.data) return Response.json({ error: "Kayıt sonrası doğrulama yapılamadı. Yazıları yeniden yükleyip durumu kontrol edin." }, { status: 503 });
  const persistedPosts = readBlogPosts(verified.data.value);
  const targetId = body.action === "delete" ? body.id : body.post?.id;
  const intended = posts.find(post => post.id === targetId);
  const actual = persistedPosts.find(post => post.id === targetId);
  if ((body.action === "delete" && actual) || (body.action === "save" && (!actual || JSON.stringify(actual) !== JSON.stringify(intended)))) return Response.json({ error: "Kayıt doğrulanamadı veya başka bir işlemle değişti. Yazıları yeniden yükleyin." }, { status: 409 });
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  if (actual) revalidatePath("/blog/" + actual.slug);
  else if (body.action === "delete") { const previous = readBlogPosts(data?.value).find(post => post.id === body.id); if (previous) revalidatePath("/blog/" + previous.slug); }
  return Response.json({ posts: persistedPosts, revision: verified.data.updated_at, publication: actual?.status === "published" ? { status: "published", path: "/blog/" + actual.slug, verified: true } : { status: "not_public", verified: true } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { const detail = blogStorageError(error); console.error("blog_admin_write_failed", detail.code); return Response.json({ error: detail.message, code: detail.code }, { status: 503 }); }
}
