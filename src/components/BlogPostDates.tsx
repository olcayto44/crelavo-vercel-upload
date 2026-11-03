import type { BlogPost } from "@/lib/blog-posts";
export function formatBlogDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}
export function BlogPostDates({ post }: { post: Pick<BlogPost, "createdAt" | "publishedAt" | "updatedAt"> }) {
  const created = post.createdAt || post.publishedAt;
  return <footer className="blog-post-dates" style={{ marginTop: 18, fontSize: 13, opacity: 0.8 }}>
    {created && <span>Ekleme tarihi: <time dateTime={created}>{formatBlogDate(created)}</time></span>}
    {post.publishedAt && post.publishedAt.slice(0, 10) !== created?.slice(0, 10) && <span> · Yayın: <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time></span>}
    {post.updatedAt && post.updatedAt.slice(0, 10) !== (post.publishedAt || created)?.slice(0, 10) && <span> · Güncelleme: <time dateTime={post.updatedAt}>{formatBlogDate(post.updatedAt)}</time></span>}
  </footer>;
}
