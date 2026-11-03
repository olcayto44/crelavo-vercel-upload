import { supabaseAdmin } from "@/lib/supabase";
import { BLOG_CONFIG_KEY, readBlogPosts, publishedBlogPosts } from "@/lib/blog-posts";
export async function getPublishedBlogPosts() {
  const { data, error } = await supabaseAdmin().from("platform_configs").select("value").eq("key", BLOG_CONFIG_KEY).maybeSingle();
  if (error) throw new Error("Blog yazıları yüklenemedi.");
  return publishedBlogPosts(readBlogPosts(data?.value));
}
