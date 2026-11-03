export type BlogPost = {
  id: string; slug: string; title: string; excerpt: string; content: string;
  status: "draft" | "published"; seoTitle: string; seoDescription: string;
  keywords: string[]; coverImage: string; coverAlt: string; author: string;
  publishedAt: string | null; updatedAt: string;
};
export const BLOG_CONFIG_KEY = "blog_posts_v1";
export function safeBlogUrl(value: string): boolean {
  if (!value || value.includes("\\") || /[\u0000-\u0020]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
export function validateBlogPost(input: unknown): BlogPost {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Yazı bilgileri geçersiz.");
  const raw = input as Record<string, unknown>;
  const text = (key: string, max: number) => {
    if (typeof raw[key] !== "string") throw new Error(key + " metin olmalı.");
    const value = (raw[key] as string).trim();
    if (value.length > max) throw new Error(key + " en fazla " + max + " karakter olabilir.");
    return value;
  };
  const post: BlogPost = { id: text("id", 80), slug: text("slug", 120), title: text("title", 180), excerpt: text("excerpt", 400), content: text("content", 60000), status: raw.status === "published" ? "published" : "draft", seoTitle: text("seoTitle", 70), seoDescription: text("seoDescription", 170), coverImage: text("coverImage", 2048), coverAlt: text("coverAlt", 250), author: text("author", 120), keywords: [], publishedAt: null, updatedAt: "" };
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(post.id)) throw new Error("Yazı kimliği geçersiz.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) throw new Error("URL yalnız küçük harf, rakam ve tire içerebilir.");
  if (!["draft", "published"].includes(String(raw.status))) throw new Error("Yayın durumu geçersiz.");
  if (!post.title || !post.author) throw new Error("Başlık ve yazar zorunlu.");
  if (post.coverImage && !safeBlogUrl(post.coverImage)) throw new Error("Kapak URL'si site içi yol veya HTTPS olmalı.");
  if (post.coverImage && !post.coverAlt) throw new Error("Kapak görseli için alternatif metin girin.");
  if (!Array.isArray(raw.keywords) || raw.keywords.length > 20 || raw.keywords.some(item => typeof item !== "string" || item.length > 80)) throw new Error("En fazla 20 anahtar kelime girilebilir.");
  post.keywords = [...new Set((raw.keywords as string[]).map(item => item.trim()).filter(Boolean))];
  if (post.status === "published" && (!post.excerpt || post.content.length < 100 || !post.seoTitle || post.seoDescription.length < 50)) throw new Error("Yayın için özet, en az 100 karakter içerik, SEO başlığı ve 50–170 karakter meta açıklaması gerekli.");
  return post;
}
export function readBlogPosts(value: unknown): BlogPost[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as { posts?: unknown }).posts)) return [];
  return (value as { posts: unknown[] }).posts.flatMap(item => {
    try {
      const post = validateBlogPost(item); const raw = item as Record<string, unknown>;
      post.publishedAt = typeof raw.publishedAt === "string" && Number.isFinite(Date.parse(raw.publishedAt)) ? raw.publishedAt : null;
      post.updatedAt = typeof raw.updatedAt === "string" && Number.isFinite(Date.parse(raw.updatedAt)) ? raw.updatedAt : "";
      return [post];
    } catch { return []; }
  });
}
export function publishedBlogPosts(posts: BlogPost[], now = Date.now()) {
  return posts.filter(post => post.status === "published" && post.publishedAt && Date.parse(post.publishedAt) <= now).sort((a, b) => Date.parse(b.publishedAt!) - Date.parse(a.publishedAt!));
}
export function blogPostMetadata(post: BlogPost) {
  const path = "/blog/" + post.slug;
  return { title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, keywords: post.keywords, alternates: { canonical: path }, robots: { index: true, follow: true }, openGraph: { title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, type: "article" as const, url: path, publishedTime: post.publishedAt || undefined, modifiedTime: post.updatedAt, authors: [post.author], ...(post.coverImage ? { images: [{ url: post.coverImage, alt: post.coverAlt }] } : {}) }, twitter: { card: post.coverImage ? "summary_large_image" as const : "summary" as const, title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, ...(post.coverImage ? { images: [post.coverImage] } : {}) } };
}
export function blogArticleJsonLd(post: BlogPost) {
  return JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.seoDescription || post.excerpt, datePublished: post.publishedAt, dateModified: post.updatedAt, author: { "@type": "Person", name: post.author }, publisher: { "@type": "Organization", name: "Crelavo" }, mainEntityOfPage: "https://www.crelavo.com/blog/" + post.slug, ...(post.coverImage ? { image: new URL(post.coverImage, "https://www.crelavo.com").href } : {}) }).replace(/</g, "\\u003c");
}
