export const mobileNavigationLinks = [
  { label: "Create", href: "/categories" }, { label: "Tools", href: "/tools" }, { label: "Pricing", href: "/pricing" },
  { label: "Assistant", href: "/dashboard/create" }, { label: "Dashboard", href: "/dashboard" },
  { label: "Profile / Settings", href: "/dashboard/settings" }, { label: "Credits", href: "/dashboard/credits" },
  { label: "My Productions", href: "/dashboard/productions" }, { label: "Live Sales", href: "/live-sales-credits" },
  { label: "Drone", href: "/drone-credits" }, { label: "Contact", href: "/contact" }, { label: "Blog", href: "/blog" }
];
// Embedded and full-screen production surfaces retain their own dedicated chrome.
export function showMobileSiteHeader(pathname: string | null) {
  if (!pathname) return false;
  return !["/admin", "/api", "/embed", "/dashboard/assistant-workspace", "/ai-mobile-app-builder", "/ai-ecommerce-builder", "/ai-video-agent", "/ai-video-generator"].some(prefix => pathname === prefix || pathname.startsWith(prefix + "/"));
}
