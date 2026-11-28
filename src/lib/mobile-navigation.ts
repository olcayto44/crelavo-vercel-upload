export const mobileNavigationLinks = [
  { label: "Create", href: "/categories" }, { label: "Tools", href: "/tools" }, { label: "AI Models", href: "/models" }, { label: "Pricing", href: "/pricing" },
  { label: "Assistant", href: "/dashboard/studio" }, { label: "Dashboard", href: "/dashboard" }, { label: "Studio", href: "/studio" }, { label: "Video Editor", href: "/tools/video-editor" }, { label: "Image Editor", href: "/tools/image-editor" }, { label: "Media Library", href: "/tools/media-library" },
  { label: "Profile / Settings", href: "/dashboard/settings" }, { label: "Credits", href: "/dashboard/credits" },
  { label: "My Productions", href: "/dashboard/productions" }, { label: "Live Sales", href: "/live-sales-credits" },
  { label: "Drone", href: "/drone-credits" }, { label: "Contact", href: "/contact" }, { label: "Blog", href: "/blog" }
];
// Embedded and full-screen production surfaces retain their own dedicated chrome.
export function showMobileSiteHeader(pathname: string | null) {
  if (!pathname) return false;
  return !["/admin", "/api", "/embed", "/dashboard/assistant-workspace", "/dashboard/studio-v2", "/dashboard/studio", "/dashboard/website-builder", "/dashboard/studio-video-editor", "/dashboard/studio-elements", "/dashboard/studio-image-editor", "/ai-mobile-app-builder", "/ai-ecommerce-builder", "/ai-video-agent", "/ai-video-generator"].some(prefix => pathname === prefix || pathname.startsWith(prefix + "/"));
}
