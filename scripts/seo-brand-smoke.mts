import { readFileSync } from "node:fs";
import { join } from "node:path";

const layout = readFileSync(join(process.cwd(), "src", "app", "layout.tsx"), "utf8");
const home = readFileSync(join(process.cwd(), "src", "app", "page.tsx"), "utf8");
const header = readFileSync(join(process.cwd(), "src", "components", "Header.tsx"), "utf8");
const footer = readFileSync(join(process.cwd(), "src", "components", "SiteFooter.tsx"), "utf8");
const robots = readFileSync(join(process.cwd(), "src", "app", "robots.ts"), "utf8");
const sitemap = readFileSync(join(process.cwd(), "src", "app", "sitemap.ts"), "utf8");
const structuredData = readFileSync(join(process.cwd(), "src", "components", "SiteStructuredData.tsx"), "utf8");
const pricing = readFileSync(join(process.cwd(), "src", "app", "pricing", "page.tsx"), "utf8");
const categories = readFileSync(join(process.cwd(), "src", "app", "categories", "page.tsx"), "utf8");
const siteContent = readFileSync(join(process.cwd(), "src", "lib", "site-content.ts"), "utf8");
const wpAdmin = readFileSync(join(process.cwd(), "src", "app", "wp-admin", "page.tsx"), "utf8");
const footerHelpDrawer = readFileSync(join(process.cwd(), "src", "components", "FooterHelpDrawer.tsx"), "utf8");
const blog = readFileSync(join(process.cwd(), "src", "app", "blog", "page.tsx"), "utf8");
const contact = readFileSync(join(process.cwd(), "src", "app", "contact", "page.tsx"), "utf8");
const contactForm = readFileSync(join(process.cwd(), "src", "components", "ContactForm.tsx"), "utf8");
const contactApi = readFileSync(join(process.cwd(), "src", "app", "api", "contact", "route.ts"), "utf8");
const nextConfig = readFileSync(join(process.cwd(), "next.config.mjs"), "utf8");
const securityHelpers = readFileSync(join(process.cwd(), "src", "lib", "security.ts"), "utf8");
const uploadApi = readFileSync(join(process.cwd(), "src", "app", "api", "materials", "upload", "route.ts"), "utf8");
const registerForm = readFileSync(join(process.cwd(), "src", "components", "RegisterForm.tsx"), "utf8");
const loginForm = readFileSync(join(process.cwd(), "src", "components", "LoginForm.tsx"), "utf8");
const userInfoPill = readFileSync(join(process.cwd(), "src", "components", "UserInfoPill.tsx"), "utf8");
const loginNotificationApi = readFileSync(join(process.cwd(), "src", "app", "api", "auth", "login-notification", "route.ts"), "utf8");
const forgotPasswordForm = readFileSync(join(process.cwd(), "src", "components", "ForgotPasswordForm.tsx"), "utf8");
const resendConfirmationForm = readFileSync(join(process.cwd(), "src", "components", "ResendConfirmationForm.tsx"), "utf8");
const siteContentConfig = readFileSync(join(process.cwd(), "src", "lib", "site-content-config.ts"), "utf8");
const headerNav = readFileSync(join(process.cwd(), "src", "components", "Header.tsx"), "utf8");
const adminMenu = readFileSync(join(process.cwd(), "src", "lib", "admin.ts"), "utf8");
const dashboardShell = readFileSync(join(process.cwd(), "src", "components", "DashboardShell.tsx"), "utf8");
const dashboardContact = readFileSync(join(process.cwd(), "src", "app", "dashboard", "contact", "page.tsx"), "utf8");
const assistantWorkspacePage = readFileSync(join(process.cwd(), "src", "app", "dashboard", "assistant-workspace", "page.tsx"), "utf8");
const siteContentLoader = readFileSync(join(process.cwd(), "src", "lib", "site-content-loader.ts"), "utf8");
const globalCss = readFileSync(join(process.cwd(), "src", "app", "globals.css"), "utf8");
const providerReadiness = readFileSync(join(process.cwd(), "src", "app", "api", "providers", "readiness", "route.ts"), "utf8");
const adConfig = readFileSync(join(process.cwd(), "src", "lib", "ad-config.ts"), "utf8");
const campaignPromoSlot = readFileSync(join(process.cwd(), "src", "components", "CampaignPromoSlot.tsx"), "utf8");
const campaignPromoClient = readFileSync(join(process.cwd(), "src", "components", "CampaignPromoClient.tsx"), "utf8");
const splashAdClient = readFileSync(join(process.cwd(), "src", "components", "SplashAdClient.tsx"), "utf8");
const adsRoasPanel = readFileSync(join(process.cwd(), "src", "components", "AdsRoasPanel.tsx"), "utf8");
const adminAdSlotManager = readFileSync(join(process.cwd(), "src", "components", "AdminAdSlotManager.tsx"), "utf8");
const adminSiteContentManager = readFileSync(join(process.cwd(), "src", "components", "AdminSiteContentManager.tsx"), "utf8");
const adminProductionsTable = readFileSync(join(process.cwd(), "src", "components", "AdminProductionsTable.tsx"), "utf8");
const launchReadiness = readFileSync(join(process.cwd(), "src", "app", "admin", "launch-readiness", "page.tsx"), "utf8");
const launchReadinessLib = readFileSync(join(process.cwd(), "src", "lib", "launch-readiness.ts"), "utf8");
const siteContentApi = readFileSync(join(process.cwd(), "src", "app", "api", "admin", "site-content", "route.ts"), "utf8");
const brandKitStorage = readFileSync(join(process.cwd(), "src", "app", "admin", "brand-kit-storage", "page.tsx"), "utf8");
const paymentCheckout = readFileSync(join(process.cwd(), "src", "app", "api", "payments", "checkout", "route.ts"), "utf8");
const paymentProvider = readFileSync(join(process.cwd(), "src", "lib", "payment-provider.ts"), "utf8");
const lemonWebhook = readFileSync(join(process.cwd(), "src", "app", "api", "lemon-squeezy", "webhook", "route.ts"), "utf8");
const paymentEmail = readFileSync(join(process.cwd(), "src", "lib", "payment-email.ts"), "utf8");
const productionEmail = readFileSync(join(process.cwd(), "src", "lib", "production-email.ts"), "utf8");
const automationStatus = readFileSync(join(process.cwd(), "src", "app", "api", "automation", "status", "route.ts"), "utf8");
const generationStatus = readFileSync(join(process.cwd(), "src", "app", "api", "generation", "[id]", "status", "route.ts"), "utf8");
const productionsApi = readFileSync(join(process.cwd(), "src", "app", "api", "productions", "route.ts"), "utf8");
const providerEnv = readFileSync(join(process.cwd(), "src", "lib", "providers", "env.ts"), "utf8");
const phase2Ads = readFileSync(join(process.cwd(), "src", "lib", "phase2", "ads.ts"), "utf8");
const envReadinessSmoke = readFileSync(join(process.cwd(), "scripts", "env-readiness-smoke.mts"), "utf8");
const assistantWorkspace = readFileSync(join(process.cwd(), "src", "components", "AssistantWorkspace.tsx"), "utf8");

const requiredLayoutTerms = [
  "https://crelavo.com",
  "Crelavo",
  "AI Production Studio for Websites, Apps & E-Commerce | Crelavo",
  "Turn Shopify, Amazon, and Trendyol links into AI videos, mobile apps, and websites.",
  "Crelavo - Global AI Production Studio",
  "Launch websites, mobile apps, and product video campaigns from one single AI production studio.",
  "Shopify",
  "Amazon",
  "Trendyol",
  "AI e-commerce campaign generator",
  "managed AI production",
  "summary_large_image",
  "en-US",
  "x-default",
  "SiteFooter"
];

const requiredVisibleTerms = [
  "Crelavo",
  "Launch websites, apps and product campaigns from one AI production studio.",
  "Shopify, Amazon or Trendyol product links",
  "Global AI production studio for websites, mobile apps, e-commerce product campaigns",
  "AI production studio",
  "Shopify product link ads",
  "Amazon product campaigns",
  "Trendyol product videos",
  "site-footer-grid",
  "site-footer-bottom",
  "href=\"/dashboard/assistant-workspace?idea=Shopify%20product%20link%20ad&category=campaign&mode=commerce\"",
  "href=\"/dashboard/assistant-workspace?idea=Amazon%20product%20campaign&category=campaign&mode=commerce\"",
  "href=\"/dashboard/assistant-workspace?idea=Trendyol%20product%20video&category=campaign&mode=commerce\"",
  "href=\"/dashboard/assistant-workspace?idea=Product%20link%20to%20ad%20video&category=campaign&mode=commerce\""
];

const requiredStructuredDataTerms = [
  "@graph",
  "Organization",
  "WebSite",
  "SoftwareApplication",
  "crelavo.com",
  "From idea to production. From product link to campaign.",
  "Shopify, Amazon and Trendyol campaigns"
];

for (const term of requiredLayoutTerms) {
  if (!layout.includes(term)) throw new Error(`SEO metadata missing term: ${term}`);
}

for (const term of requiredVisibleTerms) {
  if (![home, header, footer].some((source) => source.includes(term))) throw new Error(`Visible brand/SEO copy missing term: ${term}`);
}

for (const term of requiredStructuredDataTerms) {
  if (!structuredData.includes(term)) throw new Error(`Structured data missing term: ${term}`);
}

if (!robots.includes("https://crelavo.com")) throw new Error("robots fallback domain is not crelavo.com");
if (!robots.includes('disallow: ["/admin", "/api", "/dashboard", "/auth"]')) throw new Error("robots private route disallow list is incomplete");
if (!sitemap.includes("https://crelavo.com")) throw new Error("sitemap fallback domain is not crelavo.com");
for (const route of ["/categories", "/pricing", "/blog", "/contact", "/styles"]) {
  if (!sitemap.includes(`path: "${route}"`)) throw new Error(`Sitemap missing public route: ${route}`);
}
for (const privateRoute of ["/admin", "/api", "/auth", "/dashboard", "/wp-admin"]) {
  if (!sitemap.includes(privateRoute)) throw new Error(`Sitemap private route guard missing prefix: ${privateRoute}`);
}
if (!sitemap.includes("Sitemap can only include public marketing routes")) throw new Error("Sitemap private route runtime guard is missing");
if (sitemap.includes('path: "/dashboard"') || sitemap.includes('path: "/admin"') || sitemap.includes('path: "/auth"') || sitemap.includes('path: "/api"') || sitemap.includes('path: "/wp-admin"')) throw new Error("sitemap should not include private routes as public entries");
if (pricing.includes("SampleVideoGallery") || pricing.includes("getConfiguredSampleVideos") || pricing.includes("Sample videos producible with packages")) {
  throw new Error("Pricing page should not render sample videos; samples belong on the home page only");
}
if (siteContent.includes('{ label: "Admin Panel", href: "/admin" }')) {
  throw new Error("Public footer must not expose the admin panel link");
}
if (!wpAdmin.includes('redirect("/admin")')) {
  throw new Error("/wp-admin should redirect to the admin panel entry");
}
for (const term of ["FooterHelpDrawer", "footer-info-drawer", "Frequently Asked Questions", "Usage Rules", "Refund Policy", "Refunds are not available", "Crelavo support is available through the public contact page and support email", "API and Integrations", "managed integrations first"]) {
  if (!footerHelpDrawer.includes(term) && !footer.includes(term)) throw new Error(`Footer help drawer missing term: ${term}`);
}
for (const term of ["/blog", "Crelavo Blog / Content", "AI production insights", "Shopify product link ads", "Amazon product campaigns", "Trendyol product videos", "AI website production", "AI app production", "Open blog article"]) {
  if (![blog, home, sitemap, siteContent, siteContentConfig].some((source) => source.includes(term))) throw new Error(`Blog/content SEO route missing term: ${term}`);
}
for (const term of ["blog-seo-link", "renderLinkedText", "blog-linked-keywords", "blog-keyword-chip", "Related keywords", "AI%20website%20production", "AI%20app%20production", "Product%20link%20to%20ad%20video", "Text%20to%20video", "Image%20to%20video", "Script%20to%20video", "Brand%20kit%20production", "TikTok%20Shop%20AI%20live%20sales%20agent", "Route%20flyover%20video"]) {
  if (!blog.includes(term)) throw new Error(`Blog keyword internal linking missing term: ${term}`);
}
for (const term of [
  "linkedKeywords",
  "AI live sales agent",
  "TikTok Shop AI host",
  "live commerce service plans",
  "Drone / Satellite Video",
  "route flyover video",
  "map to video",
  "Live Agent Brief",
  "provider readiness",
  "human fallback policy",
  "mobile app screens",
  "SaaS dashboards",
  "marketplace listing assets",
  "AI videos",
  "music videos",
  "animations",
  "avatar videos",
  "lip-sync",
  "voice cloning",
  "visual cloning",
  "brand kits",
  "visual packages",
  "text to video",
  "image to video",
  "script to video",
  "long video clips",
  "cinematic scenes",
  "advertising video",
  "AI video advertising",
  "AI voice-over",
  "AI image generation",
  "brand kit production",
  "Crelavo as a full AI production studio"
]) {
  if (!siteContentConfig.includes(term)) throw new Error(`Expanded blog SEO coverage missing term: ${term}`);
}
for (const term of ["defaultPublicNavLinks", "navLinks?: PublicNavLink[]", "activeNavLinks", "tools-mega-wrap"]) {
  if (!headerNav.includes(term)) throw new Error(`Header admin-configurable nav missing term: ${term}`);
}
for (const term of ["Blog / Content", "href: \"/blog\"", "Contact", "href: \"/contact\"", "Productions", "Dashboard"]) {
  if (!siteContentConfig.includes(term)) throw new Error(`Default public nav config missing term: ${term}`);
}
for (const term of ["/contact", "Contact Crelavo", "support@crelavo.com", "Production support", "Project and package questions", "Send a contact request", "ContactForm"]) {
  if (![sitemap, contact].some((source) => source.includes(term))) throw new Error(`Public contact route missing term: ${term}`);
}
for (const term of ["/api/contact", "Security check: type CRELAVO", "To confirm you are a real person", "hidden-honeypot", "Send contact request"]) {
  if (!contactForm.includes(term)) throw new Error(`Contact form missing term: ${term}`);
}
for (const term of ["RESEND_API_KEY", "SUPPORT_EMAIL", "support@crelavo.com", "Security check failed", "https://api.resend.com/emails", "rateLimit", "rejectSuspiciousText"]) {
  if (!contactApi.includes(term)) throw new Error(`Contact API missing term: ${term}`);
}
for (const term of ["X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Robots-Tag", "noindex, nofollow, noarchive", "/admin/:path*", "/dashboard/:path*", "/api/:path*"]) {
  if (!nextConfig.includes(term)) throw new Error(`Security headers missing term: ${term}`);
}
for (const term of ["clientIpFromRequest", "rateLimit", "rateLimitResponse", "rejectSuspiciousText", "hacklink", "<script", "Too many requests"]) {
  if (!securityHelpers.includes(term)) throw new Error(`Security helper missing term: ${term}`);
}
for (const term of ["rateLimit", "rejectSuspiciousText", "allowedMimeTypes", "maxUploadBytes", "email confirmation"]) {
  if (!uploadApi.includes(term)) throw new Error(`Upload API security missing term: ${term}`);
}
for (const term of ["NEXT_PUBLIC_APP_URL", "Security check: type CRELAVO", "To confirm you are a real person", "verification !== \"CRELAVO\"", "emailRedirectTo", "Check spam and promotions folders", "resend confirmation email page"]) {
  if (!registerForm.includes(term)) throw new Error(`Register security/email confirmation guard missing term: ${term}`);
}
for (const term of ["Security check: type CRELAVO", "To confirm you are a real person", "verification !== \"CRELAVO\"", "Sign-in cannot be completed before email confirmation", "/api/auth/login-notification", "sign-in notice"]) {
  if (!loginForm.includes(term)) throw new Error(`Login security/email confirmation guard missing term: ${term}`);
}
for (const term of ["compactDisplayName", "displayName", "title={`${userInfo.name} • ${userInfo.email}`}"]) {
  if (!userInfoPill.includes(term)) throw new Error(`User info pill compact display missing term: ${term}`);
}
for (const term of ["RESEND_API_KEY", "Crelavo account sign-in notice", "Your Crelavo account was signed in successfully", "reset your password immediately"]) {
  if (!loginNotificationApi.includes(term)) throw new Error(`Login notification API missing term: ${term}`);
}
for (const term of ["NEXT_PUBLIC_APP_URL", "resetPasswordForEmail", "/auth/reset-password", "Password reset link sent"]) {
  if (!forgotPasswordForm.includes(term)) throw new Error(`Forgot password email flow missing term: ${term}`);
}
for (const term of ["NEXT_PUBLIC_APP_URL", "auth.resend", "type: \"signup\"", "emailRedirectTo", "Resend confirmation email", "Check your inbox, spam, and promotions folders"]) {
  if (!resendConfirmationForm.includes(term)) throw new Error(`Resend confirmation flow missing term: ${term}`);
}
for (const term of ["getConfiguredSiteContentConfig", "CONFIG_KEY = \"site_content\"", "normalizeSiteContentConfig", "defaultSiteContentConfig"]) {
  if (!siteContentLoader.includes(term)) throw new Error(`Site content loader missing term: ${term}`);
}
for (const term of ["getConfiguredSiteContentConfig", "siteContent.blogTopics", "Header navLinks={siteContent.navLinks}"]) {
  if (!blog.includes(term)) throw new Error(`Blog configured site content wiring missing term: ${term}`);
}
for (const term of ["getConfiguredSiteContentConfig", "Platform", "Core services", "Company", "Legal", "activeSocialLinks", "footer-social-links", "Crelavo social links", "target=\"_blank\"", "rel=\"noreferrer\""]) {
  if (!footer.includes(term)) throw new Error(`Footer configured help/social wiring missing term: ${term}`);
}
for (const term of ["SocialLink", "defaultSocialLinks", "socialLinks: SocialLink[]", "normalizeSocialLinks", "https://www.instagram.com/crelavohq", "https://www.youtube.com/channel/UCU6X_Sq5M2QWO_62gZml31g", "https://www.tiktok.com/@crelavo", "https://www.linkedin.com/company/crelavo", "https://x.com/crelavohq"]) {
  if (!siteContentConfig.includes(term)) throw new Error(`Site content social link config missing term: ${term}`);
}
for (const term of ["type TabId = \"nav\" | \"blog\" | \"help\" | \"social\"", "Add social link", "Platform label", "HTTPS URL", "Visible in the public footer social link row", "content.socialLinks", "Linked keywords, 3 max", "label | href", "item.linkedKeywords"]) {
  if (!adminSiteContentManager.includes(term)) throw new Error(`Admin social link manager missing term: ${term}`);
}
for (const term of ["Public navigation, blog, help content and social links", "normalizeSiteContentConfig(body.siteContent)"]) {
  if (!siteContentApi.includes(term)) throw new Error(`Site content API social wiring missing term: ${term}`);
}
for (const term of ["footer-social-links", ".footer-social-links a", ".footer-social-links a:hover"]) {
  if (!globalCss.includes(term)) throw new Error(`Footer social CSS missing term: ${term}`);
}
for (const term of [".nav-top-row", ".nav-user-cluster", "grid-template-columns: auto minmax(0, 1fr) auto", "align-items: center", ".nav-session-bar", "background: transparent", "height: 38px", "height: 34px", ".nav-session-bar .credit-pill", ".nav-session-bar .auth-action-pills", ".nav-session-bar .auth-mini-btn", ".nav-session-bar .signed-in-actions .user-info-pill", ".auth-action-pills", "height: 36px", "line-height: 1", "overflow: visible", ".signed-in-actions .user-info-pill", "max-width: 112px", "min-width: 74px", ".credit-pill", "min-width: 142px", "text-overflow: ellipsis", "@media (max-width: 1100px)", "flex-wrap: wrap", ".nav-links", "gap: 9px", "overflow-x: auto", ".assistant-top-nav", "flex-wrap: nowrap", ".dashboard-topbar nav", "min-width: max-content", ".dashboard-sidebar-card a", ".dashboard-sidebar-card::after { pointer-events: none; }"]) {
  if (!globalCss.includes(term)) throw new Error(`Mobile top navigation CSS missing term: ${term}`);
}
for (const term of ["nav-session-bar", "primary-nav-links", "canonicalNavLabels", "kategoriler", "Blog / Content", "normalizeNavLabel"]) {
  if (!header.includes(term)) throw new Error(`Header two-row layout missing term: ${term}`);
}
for (const term of ["dashboard-topbar", "href=\"/dashboard/productions\"", "href=\"/dashboard\"", "Blog / Content", "title: \"Tools\"", "href: \"/categories\"", "className=\"dashboard-nav-group-head\"", "Contact", "/dashboard/contact"]) {
  if (!dashboardShell.includes(term)) throw new Error(`Dashboard quick navigation missing term: ${term}`);
}
for (const term of ["Contact Crelavo", "support@crelavo.com", "Production support", "Account and credit help", "Managed delivery request"]) {
  if (!dashboardContact.includes(term)) throw new Error(`Dashboard contact page missing term: ${term}`);
}
for (const term of ["assistant-top-nav", "href=\"/dashboard/productions\"", "href=\"/dashboard\"", "Blog / Content"]) {
  if (!assistantWorkspacePage.includes(term)) throw new Error(`Assistant workspace navigation missing term: ${term}`);
}
for (const term of ["/admin/site-content", "Site Content"]) {
  if (!adminMenu.includes(term)) throw new Error(`Admin menu missing site content management: ${term}`);
}
for (const term of ["/admin/launch-readiness", "Launch Readiness"]) {
  if (!adminMenu.includes(term) && !home.includes(term)) throw new Error(`Admin menu missing launch readiness management: ${term}`);
}
for (const term of ["Production readiness summary", "Lemon Squeezy payments", "Email delivery", "Safe launch capacity policy", "Video provider active jobs", "1-5 active video jobs", "BULK_GENERATION_CONCURRENCY", "secret values"]) {
  if (![launchReadiness, launchReadinessLib].some((source) => source.includes(term))) throw new Error(`Launch readiness panel missing term: ${term}`);
}
for (const term of ["ai-production-studio.svg", "ecommerce-product-campaigns.svg", "website-app-production.svg", "ai-video-avatar-voice.svg", "brand-content-seo.svg", "managed-delivery-workflow.svg"]) {
  if (!siteContentConfig.includes(term) || !blog.includes("blog-topic-media")) throw new Error(`Blog image/content wiring missing: ${term}`);
}
for (const term of ["campaign-promo", "Flashing campaign promo", "endsAt", "View packages", "Header ad slot", "status: \"passive\"", "LEFT RAIL AD", "RIGHT RAIL AD"]) {
  if (!adConfig.includes(term)) throw new Error(`Independent English ad slot config missing term: ${term}`);
}
for (const id of ["campaign-promo"]) {
  const pattern = new RegExp(`id: "${id}"[\\s\\S]*?status: "active"`);
  if (!pattern.test(adConfig)) throw new Error(`Ad slot should default to active: ${id}`);
}
for (const id of ["header", "content", "sidebar", "footer", "splash", "left-rail", "right-rail"]) {
  const pattern = new RegExp(`id: "${id}"[\\s\\S]*?status: "passive"`);
  if (!pattern.test(adConfig)) throw new Error(`Ad slot should default to passive: ${id}`);
}
for (const term of ["CampaignPromoClient", "campaign-promo", "JSON.parse", "status === \"active\""]) {
  if (!campaignPromoSlot.includes(term)) throw new Error(`Campaign promo slot component missing term: ${term}`);
}
for (const term of ["splash-ad-backdrop", "splash-ad-modal", "splash-ad-close", "role=\"dialog\"", "slot.status !== \"active\"", "createPortal", "document.body", "document.body.style.overflow", "setVisible(true)", "localStorage", "todayKey", "Daily limit 3 views", "currentCount >= 3", "still show the active splash slot"]) {
  if (![splashAdClient, globalCss].some((source) => source.includes(term))) throw new Error(`Centered splash ad popup rendering missing term: ${term}`);
}
for (const term of [".nav { position: relative; z-index: 90; display: grid", "grid-template-columns: auto minmax(0, 1fr) auto", ".nav-session-bar", "min-width: max-content", "overflow: visible"]) {
  if (!globalCss.includes(term)) throw new Error(`Header two-row overflow fix missing term: ${term}`);
}
for (const term of ["promo-corner-slot", "position: absolute", "right: 22px", "top: 144px", "width: min(360px, calc(100% - 44px), 31vw)", "min-height: 270px", "animation: campaignFlash 1.05s", "filter: brightness(1.2)", "home-platform-hero { position: relative; min-height: 430px", "padding: 22px 22px 42px", "home-platform-hero > div:first-child", "max-width: min(820px, calc(100% - 400px))"]) {
  if (!globalCss.includes(term)) throw new Error(`Hero campaign promo placement missing term: ${term}`);
}
for (const term of ["Each ad slot is controlled independently", "Enable", "Disable", "Pause", "dimensionLabel", "Size:", "x${slot.height}px"]) {
  if (!adminAdSlotManager.includes(term)) throw new Error(`Independent ad slot admin controls missing term: ${term}`);
}
for (const term of ["campaign-promo-card", "campaignFlash", "Ends in", "formatRemaining"]) {
  if (![campaignPromoClient, globalCss].some((source) => source.includes(term))) throw new Error(`Campaign promo countdown UI missing term: ${term}`);
}
for (const term of ["Structured campaign promo editor", "CTA label", "CTA link", "Generated JSON payload", "campaign-promo-admin-preview", "stringifyCampaignPromoPayload"]) {
  if (![adminAdSlotManager, globalCss].some((source) => source.includes(term))) throw new Error(`Campaign promo admin editor missing term: ${term}`);
}
for (const term of ["Brand Kit Storage Operations", "Brand files stay ready for the production engine", "Prepare brand kit draft", "Refresh preview", "Apply to render template", "Operations note"]) {
  if (!brandKitStorage.includes(term)) throw new Error(`Brand kit storage English UI missing term: ${term}`);
}
for (const term of ["promo-top-layout", "promo-corner-slot", "CampaignPromoSlot", "pricing-promo-slot", "categories-promo-slot", "min-height: 230px"]) {
  if (![home, categories, pricing, globalCss].some((source) => source.includes(term))) throw new Error(`Campaign promo placement missing term: ${term}`);
}
for (const term of ["roas-alert-card", "roas-metric-grid", "Spend threshold", "Suggested action", "AI monitor ready", "roas-action-row"]) {
  if (![adsRoasPanel, globalCss].some((source) => source.includes(term))) throw new Error(`ROAS panel layout missing term: ${term}`);
}
for (const term of ["provider === \"fal\"", "FAL_KEY", "FAL_API_KEY", "FAL_VIDEO_MODEL", "fal_queue"]) {
  if (![providerReadiness, envReadinessSmoke].some((source) => source.includes(term))) throw new Error(`FAL provider readiness missing term: ${term}`);
}
for (const source of [paymentProvider, providerEnv, phase2Ads]) {
  if (!source.includes("https://crelavo.com")) throw new Error("Production URL fallback must use crelavo.com");
  if (source.includes("http://localhost:3000")) throw new Error("Production URL fallback should not use localhost");
}
for (const term of ["createLemonSqueezyCheckout", "provider: \"lemon_squeezy\"", "directCheckoutUrl", "manualActivation", "credit_subscription", "credit_topup"]) {
  if (!paymentCheckout.includes(term)) throw new Error(`Lemon Squeezy checkout wiring missing term: ${term}`);
}
for (const term of ["sendPaymentReceiptEmail", "order_created", "subscription_created", "subscription_payment_success", "customerEmail", "receiptEmailResult"]) {
  if (!lemonWebhook.includes(term)) throw new Error(`Lemon Squeezy webhook payment receipt wiring missing term: ${term}`);
}
for (const term of ["sendAdminPaymentNotificationEmail", "adminPaymentNotificationResult", "subscription_payment_failed", "subscription_cancelled", "subscription_expired"]) {
  if (!lemonWebhook.includes(term)) throw new Error(`Lemon Squeezy webhook admin payment notification wiring missing term: ${term}`);
}
for (const term of ["RESEND_API_KEY", "SUPPORT_FROM_EMAIL", "SUPPORT_EMAIL", "https://api.resend.com/emails", "Crelavo payment receipt", "Thank you for your Crelavo payment", "Amount:", "Checkout session:", "Payment receipt:", "Email provider rejected the payment receipt"]) {
  if (!paymentEmail.includes(term)) throw new Error(`Payment receipt email helper missing term: ${term}`);
}
for (const term of ["PAYMENT_NOTIFICATION_EMAIL", "ADMIN_EMAIL", "sendAdminPaymentNotificationEmail", "Crelavo payment received", "Crelavo subscription renewal paid", "Crelavo payment failed", "Admin dashboard:", "Finance dashboard:", "Email provider rejected the admin payment notification"]) {
  if (!paymentEmail.includes(term)) throw new Error(`Admin payment notification email helper missing term: ${term}`);
}
for (const term of ["sendProductionCompletionEmail", "customerEmailForProduction", "Your Crelavo production is ready", "RESEND_API_KEY", "SUPPORT_FROM_EMAIL", "SUPPORT_EMAIL", "dashboard/productions", "Email provider rejected the production completion email"]) {
  if (!productionEmail.includes(term)) throw new Error(`Production completion email helper missing term: ${term}`);
}
for (const term of ["sendProductionCompletionEmail", "customerEmailForProduction", "completionEmailResult", "finalVideoUrl", "output_json: { ...(data.output_json ?? {}), completionEmailResult }"]) {
  if (!automationStatus.includes(term)) throw new Error(`Automation status completion email wiring missing term: ${term}`);
}
for (const term of ["sendProductionCompletionEmail", "customerEmailForProduction", "completionEmailResult", "final_video_url", "Video request"]) {
  if (!generationStatus.includes(term)) throw new Error(`Legacy generation status completion email wiring missing term: ${term}`);
}
for (const term of ["sendProductionCompletionEmail", "customerEmailForProduction", "data?.status === \"ready\"", "completionEmailResult", "output_json: { ...(data.output_json ?? {}), completionEmailResult }"]) {
  if (!productionsApi.includes(term)) throw new Error(`Productions API completion email wiring missing term: ${term}`);
}
for (const term of ["completionEmailLabel", "Email delivery", "Completion email sent", "Completion email skipped"]) {
  if (!adminProductionsTable.includes(term)) throw new Error(`Admin production email visibility missing term: ${term}`);
}
for (const term of ["LEMON_SQUEEZY_API_KEY", "LEMON_SQUEEZY_STORE_ID", "LEMON_SQUEEZY_WEBHOOK_SECRET"]) {
  if (!envReadinessSmoke.includes(term)) throw new Error(`Env readiness smoke must require Lemon Squeezy payment env: ${term}`);
}
if (home.includes("One platform, five production lanes") || home.includes("Campaigns & ads")) {
  throw new Error("Old homepage production lane block should not return");
}
for (const term of ["AssistantCreditState", "assistant-credit-panel", "Last assistant charge", "Free assistant credits", "Production credits", "Your free AI Assistant credits are running low", "Open credits page", "requiredCredits", "assistantAvailable", "chargedCredits", "chargeSource"]) {
  if (![assistantWorkspace, globalCss].some((source) => source.includes(term))) throw new Error(`Assistant workspace credit UX missing term: ${term}`);
}

console.log("seo-brand-smoke ok");
