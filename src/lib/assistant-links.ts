export function assistantWorkspaceHref(idea?: string, mode?: string, category?: string) {
  const params = new URLSearchParams();
  if (idea) params.set("idea", idea);
  if (category) params.set("category", category);
  if (mode) params.set("mode", mode);
  const query = params.toString();
  return `/dashboard/assistant-workspace${query ? `?${query}` : ""}`;
}

export function productionPackageHref(packageId: string) {
  const ideaByPackage: Record<string, string> = {
    video_series_film_studio: "Series film studio",
    video_long_film_clipping: "Long film series clipping",
    website_landing: "Landing page website",
    website_business: "Business website",
    website_admin: "Website admin panel",
    website_ecommerce_admin: "E-commerce website Shopify WooCommerce admin",
    saas_dashboard: "SaaS dashboard",
    saas_mvp: "SaaS MVP auth customer dashboard",
    saas_admin_billing: "SaaS admin billing dashboard",
    shopify_app_integration: "Shopify app integration SaaS",
    mobile_ui: "Mobile app UI",
    mobile_expo: "Mobile app Expo source package",
    mobile_admin: "Mobile app admin panel"
  };
  return assistantWorkspaceHref(ideaByPackage[packageId]);
}

export function modeForProductionType(typeId: string) {
  if (typeId === "campaign") return "social";
  if (["website", "saas", "mobile_app", "admin_project"].includes(typeId)) return "project";
  if (["image", "video", "animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "drone_video", "live_sales_agent", "studio", "drama", "cinematic_video", "video_clipping", "avatar", "lip_sync", "voice_clone", "visual_clone", "video_tools", "music_video", "stickman_animation", "localization"].includes(typeId)) return "media";
  if (typeId === "brand_kit") return "brand";
  if (typeId === "document_pack") return "document";
  return "general";
}

export function productionTypeHref(typeId: string) {
  if (typeId === "video") return assistantWorkspaceHref("Series film studio", "media", typeId);
  return assistantWorkspaceHref(typeId, modeForProductionType(typeId), typeId);
}
