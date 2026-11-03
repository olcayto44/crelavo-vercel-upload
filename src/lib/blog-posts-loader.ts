import { supabaseAdmin } from "@/lib/supabase";
import { BLOG_CONFIG_KEY, readBlogPosts, publishedBlogPosts, blogStorageError } from "@/lib/blog-posts";
export async function getPublishedBlogPosts() {
  try {
  const { data, error } = await supabaseAdmin().from("platform_configs").select("value").eq("key", BLOG_CONFIG_KEY).maybeSingle();
  if (error) throw error;
  return publishedBlogPosts(readBlogPosts(data?.value));
  } catch (error) {
    // A storage outage must not crash existing blog guides or the entire sitemap.
    console.error("blog_public_read_failed", blogStorageError(error).code);
    return [];
  }
}
