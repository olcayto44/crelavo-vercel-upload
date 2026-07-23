"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const siteUrl = "https://www.crelavo.com";
const hiddenPrefixes = ["/admin", "/api", "/auth", "/checkout"];

type Lang = "tr" | "en" | "de" | "fr" | "es" | "pt";

type SupportAnswer = {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
  primaryUrl: string;
  primaryLabel: string;
  links: { label: string; href: string; external?: boolean }[];
};

const siteDirectory = [
  { label: "Home", href: "/", keywords: ["home", "homepage", "main", "ana sayfa", "anasayfa"] },
  { label: "Pricing", href: "/pricing", keywords: ["pricing", "price", "fiyat", "paket", "plan", "plans", "subscription", "kampanya", "campaign", "discount", "indirim"] },
  { label: "Dashboard", href: "/dashboard", keywords: ["dashboard", "panel", "account", "hesap"] },
  { label: "Billing", href: "/dashboard/billing", keywords: ["billing", "ödeme", "odeme", "fatura", "invoice", "card", "kart"] },
  { label: "Whop billing and cancellation", href: "/whop-billing", keywords: ["whop", "cancel", "iptal", "subscription", "abonelik", "renewal"] },
  { label: "Credits", href: "/dashboard/credits", keywords: ["credit", "credits", "kredi", "bakiye", "rollover", "topup", "top-up"] },
  { label: "Start production", href: "/dashboard/create", keywords: ["start", "create", "production", "üretim", "uretim", "başla", "basla"] },
  { label: "My productions", href: "/dashboard/productions", keywords: ["status", "delivery", "teslim", "durum", "production", "request", "nerede"] },
  { label: "Contact support", href: "/dashboard/contact", keywords: ["support", "help", "destek", "yardım", "yardim", "contact", "iletişim", "iletisim"] },
  { label: "Free tools", href: "/free-tools", keywords: ["free", "tool", "ücretsiz", "ucretsiz", "araç", "arac"] },
  { label: "AI Ad Performance Score Checker", href: "/free-tools/ad-performance-score-checker", keywords: ["ad score", "score", "reklam skoru", "hook", "cta", "ad scorer"] },
  { label: "AI Ad Reference Analyzer", href: "/free-tools/ad-reference-analyzer", keywords: ["ad reference", "reference ad", "competitor ad", "rakip reklam", "ad recreator", "ad re-creator", "clone ad", "reklam klon", "tiktok ad structure", "reference video transformer"] },
  { label: "Categories", href: "/categories", keywords: ["category", "categories", "kategori", "hizmet", "services"] },
  { label: "Campaign category", href: "/categories/campaign", keywords: ["campaign", "kampanya", "shopify", "amazon", "trendyol", "product link"] },
  { label: "AI video generator", href: "/ai-video-generator", keywords: ["video", "ai video", "video generator", "product video"] },
  { label: "AI website builder", href: "/ai-website-builder", keywords: ["website", "site", "landing page", "web"] },
  { label: "AI app builder", href: "/ai-app-builder", keywords: ["app", "application", "mobil", "mobile app", "uygulama"] },
  { label: "Brand kit builder", href: "/ai-brand-kit-builder", keywords: ["brand", "logo", "brand kit", "marka"] },
  { label: "Bulk content builder", href: "/ai-bulk-content-builder", keywords: ["bulk", "toplu", "batch", "çoklu", "coklu"] },
  { label: "Dubbing voice", href: "/ai-dubbing-voice", keywords: ["dubbing", "voice", "ses", "dublaj", "voiceover"] },
  { label: "Virtual model studio", href: "/ai-virtual-model-studio", keywords: ["model", "virtual model", "avatar", "manken"] },
  { label: "Live sales credits", href: "/live-sales-credits", keywords: ["live sales", "canlı satış", "canli satis", "avatar live", "live agent"] },
  { label: "Growth Intelligence", href: "/growth-intelligence", keywords: ["growth intelligence", "competitor", "rakip", "market intelligence", "monitoring"] },
  { label: "Drone credits", href: "/drone-credits", keywords: ["drone", "satellite", "harita", "map", "location"] },
  { label: "Affiliate", href: "/affiliate", keywords: ["affiliate", "partner", "commission", "komisyon", "referans", "creator"] },
  { label: "VIP Agency Hub invite", href: "/dashboard/contact", keywords: ["vip agency hub", "agency hub", "discord", "telegram", "community", "topluluk", "invite", "davet", "promo code", "switch20", "discount", "indirim"] },
  { label: "Showcase", href: "/showcase/explore-samples", keywords: ["showcase", "sample", "örnek", "ornek", "demo", "case"] },
  { label: "Alternatives", href: "/alternatives", keywords: ["alternative", "alternatif", "compare", "vs", "rakip"] },
  { label: "Shopify app page", href: "/shopify-ai-product-video-app", keywords: ["shopify app", "shopify", "app store"] },
  { label: "WooCommerce plugin page", href: "/woocommerce-ai-product-video-plugin", keywords: ["woocommerce", "wordpress", "plugin"] },
  { label: "Refund policy", href: "/refund-policy", keywords: ["refund", "iade", "cancellation policy", "chargeback"] },
  { label: "Terms", href: "/terms", keywords: ["terms", "tos", "şartlar", "sartlar"] },
  { label: "Privacy", href: "/privacy", keywords: ["privacy", "gizlilik", "data", "veri"] },
  { label: "Tools", href: "/tools", keywords: ["tools", "tool list", "araçlar", "araclar", "all tools", "tüm araçlar", "tum araclar"] },
  { label: "AI ads planner", href: "/ai-ads-planner", keywords: ["ads planner", "ad planner", "reklam plan", "meta ad", "ads"] },
  { label: "AI campaign calendar", href: "/ai-campaign-calendar", keywords: ["campaign calendar", "content calendar", "takvim", "kampanya takvimi"] },
  { label: "AI ecommerce builder", href: "/ai-ecommerce-builder", keywords: ["ecommerce builder", "e-ticaret", "eticaret", "store builder", "shop"] },
  { label: "AI social media", href: "/ai-social-media-ai", keywords: ["social media", "sosyal medya", "instagram", "tiktok", "reels", "shorts"] },
  { label: "Cultural localization", href: "/ai-cultural-localization", keywords: ["localization", "localisation", "yerelleştirme", "yerellestirme", "language", "dil"] },
  { label: "UGC creator program", href: "/ai-ugc-creator-program", keywords: ["ugc", "creator program", "influencer", "creator", "içerik üretici", "icerik uretici"] },
  { label: "Chrome extension", href: "/chrome-extension", keywords: ["chrome", "extension", "eklenti", "browser"] },
  { label: "Community showcase", href: "/community-showcase", keywords: ["community", "topluluk", "showcase", "gallery"] },
  { label: "Blog", href: "/blog", keywords: ["blog", "guide", "rehber", "article", "makale"] },
  { label: "API documentation", href: "/api-documentation", keywords: ["api", "documentation", "dokümantasyon", "dokumantasyon", "integration", "entegrasyon"] },
  { label: "Dashboard settings", href: "/dashboard/settings", keywords: ["settings", "ayarlar", "profile", "profil"] },
  { label: "Dashboard assistant workspace", href: "/dashboard/assistant-workspace", keywords: ["assistant", "workspace", "asistan", "çalışma alanı", "calisma alani"] },
  { label: "Dashboard brand kit", href: "/dashboard/brand-kit", keywords: ["brand kit dashboard", "marka panel", "brand memory"] },
  { label: "Dashboard bulk production", href: "/dashboard/bulk", keywords: ["bulk dashboard", "toplu üretim", "toplu uretim", "bulk production"] },
  { label: "Dashboard connections", href: "/dashboard/connections", keywords: ["connections", "bağlantı", "baglanti", "store connect", "social connect"] },
  { label: "Dashboard dubbing", href: "/dashboard/dubbing", keywords: ["dubbing dashboard", "dublaj panel", "voice dashboard"] },
  { label: "Dashboard partners", href: "/dashboard/partners", keywords: ["partner dashboard", "affiliate dashboard", "partner panel"] },
  { label: "Dashboard videos", href: "/dashboard/videos", keywords: ["videos dashboard", "video panel", "my videos"] },
  { label: "Dashboard share to earn", href: "/dashboard/share-to-earn", keywords: ["share to earn", "paylaş kazan", "paylas kazan", "reward"] },
  { label: "Dashboard shorts growth", href: "/dashboard/shorts-growth", keywords: ["shorts growth", "shorts", "tiktok growth", "reels growth"] },
  { label: "Dashboard social export", href: "/dashboard/social-export", keywords: ["social export", "export", "sosyal export", "publish"] },
  { label: "Dashboard premium expansion", href: "/dashboard/premium-expansion", keywords: ["premium expansion", "premium", "extra features", "ek özellik"] },
  { label: "Dashboard ads", href: "/dashboard/ads", keywords: ["ads dashboard", "roas", "ad management", "reklam yönetimi"] }
];

const supportAnswers: SupportAnswer[] = [
  {
    id: "cancel",
    title: "Cancel preview / subscription",
    keywords: ["cancel", "cancellation", "unsubscribe", "subscription", "iptal", "abonelik", "preview", "trial", "renewal", "yenileme", "chargeback"],
    answer: "24-hour preview içindeyseniz ve ana aboneliğin başlamasını istemiyorsanız iptal işlemi Whop üzerinden yapılır. Crelavo iptal yolunu gösterir; ödeme kaynağı Whop olduğu için resmi iptal Whop hesabında tamamlanmalıdır.",
    primaryUrl: "/whop-billing",
    primaryLabel: "Whop cancellation guide",
    links: [
      { label: "Cancel in Whop", href: "https://whop.com/hub", external: true },
      { label: "Cancellation steps", href: "/whop-billing" },
      { label: "Billing dashboard", href: "/dashboard/billing" }
    ]
  },
  {
    id: "billing",
    title: "Payment, invoice or billing help",
    keywords: ["payment", "pay", "paid", "billing", "invoice", "receipt", "card", "charge", "ödeme", "odeme", "fatura", "kart", "ücret", "ucret", "çekildi", "cekildi"],
    answer: "Ödemeler Whop veya aktif ödeme sağlayıcısı üzerinden işlenir. Crelavo kart numarası saklamaz. Ödeme, kredi ve destek eşleşmesi için checkout email adresi ile Crelavo hesap email adresinin aynı olması önerilir.",
    primaryUrl: "/dashboard/billing",
    primaryLabel: "Billing dashboard",
    links: [
      { label: "Billing dashboard", href: "/dashboard/billing" },
      { label: "Whop billing help", href: "/whop-billing" },
      { label: "Contact support", href: "/dashboard/contact" }
    ]
  },
  {
    id: "pricing",
    title: "Plans, packages and credit amounts",
    keywords: ["plan", "package", "pricing", "price", "business", "team", "ultra", "pro", "agency", "which", "choose", "paket", "fiyat", "hangi", "seç", "sec", "ajans"],
    answer: "Ana paketler: Pro $29/mo + 2,500 kredi, Business $79/mo + 12,000 kredi, Ultra $199/mo + 25,000 kredi, Team $130/seat/mo veya Team Annual 174,000 yıllık kredi. Hızlı karar için en mantıklı giriş 24-hour preview: Business preview ile düşük riskli test yapılır; Team Annual ise 174,000 krediyle ajans/bulk ecommerce üretim için yüksek değerli fırsattır. Eğer kampanya/preview teklifi checkout’ta aktif görünüyorsa, kredi avantajını kaçırmadan denemek daha iyi olabilir.",
    primaryUrl: "/pricing",
    primaryLabel: "Pricing page",
    links: [
      { label: "Compare plans", href: "/pricing" },
      { label: "Start Business preview", href: "/dashboard/payment?package=business&billing=monthly&campaign=business-12000" },
      { label: "Start Team Annual preview", href: "/dashboard/payment?package=team&billing=yearly&campaign=team-annual-174000" }
    ]
  },
  {
    id: "campaign-offer",
    title: "Current preview campaign and special offers",
    keywords: ["kampanya", "campaign", "offer", "teklif", "flash", "deal", "indirim", "discount", "bonus", "174000", "174,000", "12000", "12,000", "ön ödeme", "on odeme", "preview offer"],
    answer: "Şu an en güçlü fırsat 24-hour preview + yüksek kredi avantajı: Business tarafında 12,000 kredi ile e-commerce video testlerine düşük riskli başlama, Team Annual tarafında ise 174,000 yıllık krediyle ajans/bulk üretime geçme fırsatı öne çıkıyor. Preview süresi bitmeden denerseniz sistemi, kredi değerini ve üretim akışını riski düşük şekilde görürsünüz; teklif aktifken başlamak, daha sonra aynı kredi avantajını kaçırmamak için daha mantıklı olabilir.",
    primaryUrl: "/pricing",
    primaryLabel: "Pricing and preview offers",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Business preview", href: "/dashboard/payment?package=business&billing=monthly&campaign=business-12000" },
      { label: "Team Annual preview", href: "/dashboard/payment?package=team&billing=yearly&campaign=team-annual-174000" },
      { label: "Whop cancellation help", href: "/whop-billing" }
    ]
  },
  {
    id: "credits",
    title: "Credits, rollover and top-ups",
    keywords: ["credit", "credits", "balance", "rollover", "top-up", "topup", "kredi", "bakiye", "görünmüyor", "gorunmuyor", "yüklenmedi", "yuklenmedi", "ek kredi"],
    answer: "Krediler ödeme onayı ve erken launch admin review sonrası yüklenir. Aylık kullanılmayan subscription kredileri aktif abonelik devam ettiği sürece devreder; top-up krediler ayrı takip edilir. Top-up paketleri: $10/800 kredi, $25/2,500 kredi, $60/7,000 kredi.",
    primaryUrl: "/dashboard/credits",
    primaryLabel: "Credits dashboard",
    links: [
      { label: "View credits", href: "/dashboard/credits" },
      { label: "Buy top-up", href: "/dashboard/payment?package=topup_creator&billing=one_time" },
      { label: "Billing dashboard", href: "/dashboard/billing" }
    ]
  },
  {
    id: "extra-credits",
    title: "Extra features, materials and premium credit use",
    keywords: ["extra", "premium", "material", "materials", "materyal", "özellik", "ozellik", "cost extra", "1080p", "4k", "cinematic", "voice clone", "character", "stunt", "luxury", "prop", "costume"],
    answer: "Ekstra kalite ve materyaller daha fazla kredi kullanabilir. Örnek oranlar: 480p draft 10 kredi/sn, 720p standard 20 kredi/sn, 1080p premium 55 kredi/sn, 1080p cinematic/luxury 160 kredi/sn, gelecekte 4K ultra 250 kredi/sn. Lüks mekan, özel kıyafet, araç, ürün hero prop, voice clone, karakter sürekliliği, aksiyon/stunt ve fantasy/sci-fi dünya gibi premium materyaller ekstra kredi gerektirebilir.",
    primaryUrl: "/dashboard/credits",
    primaryLabel: "Credit guide",
    links: [
      { label: "Credit guide", href: "/dashboard/credits" },
      { label: "Create production", href: "/dashboard/create" },
      { label: "Pricing", href: "/pricing" }
    ]
  },
  {
    id: "preview",
    title: "24-hour preview and downloads",
    keywords: ["24", "hour", "preview", "download", "watermark", "video", "önizleme", "onizleme", "indir", "filigran", "watermarked"],
    answer: "24-hour preview düşük riskli erişim kontrolüdür: kullanıcı önce küçük ön ödeme/preview ile sistemi dener, beğenirse ana plan devam eder. Preview sırasında download kontrollüdür ve çıktı filigranlı olabilir. Final download, seçilen plan başladıktan ve ödeme onaylandıktan sonra açılır. Beğenmezse ana plan başlamadan Whop üzerinden iptal etmelidir.",
    primaryUrl: "/dashboard/payment",
    primaryLabel: "Preview checkout details",
    links: [
      { label: "Preview checkout details", href: "/dashboard/payment" },
      { label: "Whop billing help", href: "/whop-billing" },
      { label: "My productions", href: "/dashboard/productions" }
    ]
  },
  {
    id: "affiliate",
    title: "Affiliate / partner program",
    keywords: ["affiliate", "partner", "creator", "commission", "komisyon", "referans", "payout", "earn", "kazan", "ortak"],
    answer: "Crelavo Partner Program erken erişim modundadır. Launch-safe komisyon örnekleri: credit/top-up satışlarında %15, standard production paketlerinde %25, Growth Intelligence planlarında %30. Komisyonlar 30 gün pending kalır; refund, cancellation, chargeback, unpaid veya fraud durumunda komisyon iptal edilir.",
    primaryUrl: "/affiliate",
    primaryLabel: "Affiliate program",
    links: [
      { label: "Affiliate program", href: "/affiliate" },
      { label: "Apply for early access", href: "/auth/register?next=%2Faffiliate" },
      { label: "View pricing", href: "/pricing" }
    ]
  },
  {
    id: "production",
    title: "Production, delivery or project status",
    keywords: ["production", "delivery", "project", "request", "render", "status", "üretim", "uretim", "teslim", "proje", "durum", "video nerede", "nerede"],
    answer: "Üretim işleri dashboard içinde takip edilir. Sistem planning, preview, production ve delivery durumlarını ayırır; böylece kredi harcanmadan önce ne aşamada olduğunu görebilirsiniz.",
    primaryUrl: "/dashboard/productions",
    primaryLabel: "My productions",
    links: [
      { label: "My productions", href: "/dashboard/productions" },
      { label: "Start production", href: "/dashboard/create" },
      { label: "Contact support", href: "/dashboard/contact" }
    ]
  },
  {
    id: "ecommerce-video",
    title: "Ecommerce product video and campaign workflow",
    keywords: ["shopify", "amazon", "trendyol", "ecommerce", "product video", "product link", "campaign", "kampanya", "ürün", "urun", "marketplace", "tiktok ad"],
    answer: "Crelavo Shopify, Amazon ve marketplace ürün linklerini video reklam, campaign brief, hook/CTA, sosyal medya varyasyonları ve dashboard teslim akışına dönüştürmek için tasarlanmıştır. Ücretsiz reklam skoru ile başlayıp sonra Business veya Team preview’a geçebilirsiniz.",
    primaryUrl: "/categories/campaign",
    primaryLabel: "Campaign category",
    links: [
      { label: "Campaign category", href: "/categories/campaign" },
      { label: "AI video generator", href: "/ai-video-generator" },
      { label: "Free ad score", href: "/free-tools/ad-performance-score-checker" }
    ]
  },
  {
    id: "live-sales",
    title: "AI live sales agent plans",
    keywords: ["live sales", "canlı satış", "canli satis", "avatar", "live agent", "chat replies", "faq", "obs", "stream"],
    answer: "AI Live Sales Agent planları normal kredi paketi değildir; servis aboneliğidir ve kredi bakiyesi eklemez. Starter $249/mo + 10 fair-use live hours, Pro $799/mo + 40 hours, Agency $2,499/mo + 120 hours. Ekstra API/provider saatleri ayrı analiz edilir.",
    primaryUrl: "/live-sales-credits",
    primaryLabel: "Live sales plans",
    links: [
      { label: "Live sales plans", href: "/live-sales-credits" },
      { label: "Live sales dashboard", href: "/dashboard/live-sales-agent" },
      { label: "Contact support", href: "/dashboard/contact" }
    ]
  },
  {
    id: "growth-intelligence",
    title: "Growth Intelligence plans",
    keywords: ["growth intelligence", "competitor", "rakip", "market", "monitoring", "report", "rapor", "seo", "weekly", "daily"],
    answer: "Growth Intelligence rakip ve pazar izleme servisidir; normal production kredisi eklemez. Starter $179/mo ile 1 competitor weekly monitoring, Growth $499/mo ile 3 competitor daily monitoring, Enterprise $1,999/mo ile 5-10 competitor ve critical checks sunar.",
    primaryUrl: "/growth-intelligence",
    primaryLabel: "Growth Intelligence",
    links: [
      { label: "Growth Intelligence", href: "/growth-intelligence" },
      { label: "Dashboard", href: "/dashboard/growth-intelligence" },
      { label: "Contact support", href: "/dashboard/contact" }
    ]
  },
  {
    id: "drone",
    title: "Drone / satellite video packages",
    keywords: ["drone", "satellite", "harita", "map", "location", "route", "property", "emlak", "aerial"],
    answer: "Drone/Satellite paketleri tek seferlik kredi satın alımıdır. Drone Location Video Pack $299 ile 2,600 kredi; Satellite + Drone Story Pack $699 ile 6,800 kredi ekler. Lokasyon, rota, harita/satellite intro ve drone-style video planları için kullanılır.",
    primaryUrl: "/drone-credits",
    primaryLabel: "Drone credits",
    links: [
      { label: "Drone credits", href: "/drone-credits" },
      { label: "Drone dashboard", href: "/dashboard/drone-shoot" },
      { label: "Pricing", href: "/pricing" }
    ]
  },
  {
    id: "website-app-brand",
    title: "Website, app and brand kit production",
    keywords: ["website", "site", "landing", "app", "mobile", "uygulama", "brand", "logo", "brand kit", "marka", "web"],
    answer: "Crelavo sadece video değil; website, mobile app, landing page, brand kit, görsel paket, campaign calendar ve source handoff planları için de AI production studio olarak çalışır. Website starter işleri 500 kredi civarından, campaign starter işleri 2,500 kredi civarından başlayabilir.",
    primaryUrl: "/categories",
    primaryLabel: "Production categories",
    links: [
      { label: "Production categories", href: "/categories" },
      { label: "AI website builder", href: "/ai-website-builder" },
      { label: "AI app builder", href: "/ai-app-builder" },
      { label: "Brand kit builder", href: "/ai-brand-kit-builder" }
    ]
  },
  {
    id: "samples",
    title: "Samples, showcase and examples",
    keywords: ["sample", "samples", "showcase", "demo", "example", "örnek", "ornek", "case", "portfolio"],
    answer: "Örnek işler ve showcase sayfaları Crelavo’nun video, tool, sample ve category-specific üretim yönlerini görmek için kullanılır. Kullanıcı karar vermeden önce sample/showcase sayfalarını inceleyebilir.",
    primaryUrl: "/showcase/explore-samples",
    primaryLabel: "Showcase samples",
    links: [
      { label: "Showcase", href: "/showcase/explore-samples" },
      { label: "Samples", href: "/samples/product-ad-skincare" },
      { label: "All tools", href: "/showcase/all-tools" }
    ]
  },
  {
    id: "tools-categories",
    title: "Tools, categories and production types",
    keywords: ["tools", "tool", "araç", "arac", "kategori", "category", "categories", "types", "çeşit", "cesit", "metinden video", "görselden video", "avatar", "image", "audio", "music", "anime", "drama", "interior", "real estate", "edit", "replace"],
    answer: "Crelavo kategori ve tools tarafında AI Video, AI Avatar, AI Image, Product & E-commerce, Audio & Music, Cleanup & Enhancement, Highlights & Clips, Anime & Influencer, Short Drama, Drama, Stickman Animation, Interior & Real Estate ve Video Edit & Replace akışlarını destekler. Metinden video, görselden video, URL’den video, ürün fotoğrafçılığı, seslendirme, müzik, logo temizleme, kısa klip çıkarma, anime/UGC, mini dizi, storyboard, emlak tanıtımı ve video materyal/ortam değişimi gibi işler kategori/tools sayfalarından başlatılır.",
    primaryUrl: "/tools",
    primaryLabel: "Tools page",
    links: [
      { label: "Tools", href: "/tools" },
      { label: "Categories", href: "/categories" },
      { label: "Start production", href: "/dashboard/create" },
      { label: "Campaign category", href: "/categories/campaign" }
    ]
  },
  {
    id: "membership-account",
    title: "Membership, login and account area",
    keywords: ["membership", "member", "üyelik", "uyelik", "login", "register", "sign up", "signin", "signup", "account", "hesap", "profile", "settings", "password"],
    answer: "Crelavo’da kullanıcı hesap alanı dashboard üzerinden çalışır. Login/register sonrası kullanıcı production, credits, billing, settings, contact, partners ve delivery sayfalarını panelden yönetir. Ödeme email’i ile Crelavo hesap email’inin aynı olması kredi ve support eşleşmesini hızlandırır.",
    primaryUrl: "/dashboard",
    primaryLabel: "Dashboard",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Register", href: "/auth/register" },
      { label: "Login", href: "/auth/login" },
      { label: "Settings", href: "/dashboard/settings" }
    ]
  },
  {
    id: "production-stages",
    title: "Production stages and delivery flow",
    keywords: ["stage", "stages", "aşama", "asama", "workflow", "flow", "nasıl üretilir", "nasil uretilir", "brief", "planning", "qa", "approval", "revision", "delivery", "teslimat", "download"],
    answer: "Crelavo üretim akışı genelde brief/toplama, materyal ve marka bilgisi, kredi tahmini, üretim isteği, preview/QA, gerekirse revision, final delivery ve dashboard download/handoff aşamalarından oluşur. Bazı premium işler; özel materyal, karakter sürekliliği, voice clone, altyazı, çoklu dil, kaynak dosya veya full managed handoff gibi ekstra kredi gerektiren özellikler içerebilir.",
    primaryUrl: "/dashboard/create",
    primaryLabel: "Start production",
    links: [
      { label: "Start production", href: "/dashboard/create" },
      { label: "My productions", href: "/dashboard/productions" },
      { label: "Credits", href: "/dashboard/credits" },
      { label: "Contact support", href: "/dashboard/contact" }
    ]
  },
  {
    id: "roas-marketing",
    title: "ROAS, ad score and marketing performance",
    keywords: ["roas", "conversion", "conversion score", "hook rate", "hook", "cta", "ad cost", "reklam maliyeti", "reklam skoru", "performance", "pazarlama", "satış", "satis"],
    answer: "Crelavo video üretimini sadece dosya çıktısı olarak değil, pazarlama performansı açısından da desteklemeyi hedefler. Ücretsiz AI Ad Performance Score Checker hook, CTA ve creative zayıflıklarını analiz eder. İleride video çıktılarının yanında Video Conversion Score, estimated ROAS boost ve hook rate gibi göstergeler dashboard’da daha görünür hale getirilebilir.",
    primaryUrl: "/free-tools/ad-performance-score-checker",
    primaryLabel: "AI Ad Performance Score Checker",
    links: [
      { label: "Free ad score", href: "/free-tools/ad-performance-score-checker" },
      { label: "AI ads planner", href: "/ai-ads-planner" },
      { label: "Campaign category", href: "/categories/campaign" },
      { label: "Dashboard ads", href: "/dashboard/ads" }
    ]
  },
  {
    id: "ad-recreator",
    title: "AI Ad Re-Creator and reference ad analysis",
    keywords: ["ad reference", "reference ad", "competitor ad", "rakip reklam", "ad recreator", "ad re-creator", "clone ad", "reklam klon", "ad sniper", "reference video transformer", "tiktok ad structure", "winning ad"],
    answer: "Crelavo rakip/referans reklamı birebir kopyalama aracı olarak konumlanmaz. Güvenli akış: referans videodan sadece hook, pacing, sahne sırası, kanıt noktası ve CTA mantığı çıkarılır; rakibin görüntüsü, logosu, müziği, yüzü, sesi ve birebir metni kullanılmadan kullanıcının kendi ürünü için özgün reklam brief’i hazırlanır. Ücretsiz başlangıç için Ad Reference Analyzer sayfasını kullanabilirsiniz.",
    primaryUrl: "/free-tools/ad-reference-analyzer",
    primaryLabel: "AI Ad Reference Analyzer",
    links: [
      { label: "Analyze ad reference", href: "/free-tools/ad-reference-analyzer" },
      { label: "Free ad score", href: "/free-tools/ad-performance-score-checker" },
      { label: "Campaign category", href: "/categories/campaign" },
      { label: "Start production", href: "/dashboard/create" }
    ]
  },
  {
    id: "community-promos",
    title: "VIP community and competitor switch offers",
    keywords: ["discord", "telegram", "community", "topluluk", "vip", "agency hub", "vip agency hub", "invite", "davet", "promo", "promo code", "discount", "indirim", "switch20", "heygen", "creatify", "competitor", "rakipten", "switch"],
    answer: "Preview alıcıları için VIP Agency Hub daveti ödeme sonrası dashboard/email içinde görünebilir; link henüz aktif değilse support daveti manuel gönderir. SWITCH20 veya benzeri promo code’lar yalnızca kontrollü competitor-switch kampanyalarında kullanılabilir; her kullanıcıya garanti edilmez, abuse ve süre kontrolüyle yönetilir. Promo veya hub daveti için pricing ya da support sayfasını kontrol edin.",
    primaryUrl: "/dashboard/contact",
    primaryLabel: "Request VIP / promo help",
    links: [
      { label: "Request VIP / promo help", href: "/dashboard/contact" },
      { label: "Pricing", href: "/pricing" },
      { label: "Community showcase", href: "/community-showcase" },
      { label: "Affiliate", href: "/affiliate" }
    ]
  },
  {
    id: "human",
    title: "Need human support",
    keywords: ["human", "agent", "person", "support", "help", "email", "insan", "destek", "yardım", "yardim", "admin", "biri", "cevap"],
    answer: "Bu kutu canlı insan chat’i değil; Crelavo için hazırlanmış hızlı bilgi rehberidir. Hesap, ödeme, üretim veya teslimat için insan incelemesi gerekiyorsa support formuna hesap email’i, ödeme referansı veya production ID ile yazmalısınız.",
    primaryUrl: "/dashboard/contact",
    primaryLabel: "Contact support",
    links: [
      { label: "Dashboard contact", href: "/dashboard/contact" },
      { label: "Public contact", href: "/contact" },
      { label: "Email support", href: "mailto:support@crelavo.com", external: true }
    ]
  },
  {
    id: "site",
    title: "What is Crelavo?",
    keywords: ["what", "crelavo", "site", "platform", "ai", "nedir", "ne işe", "ne ise", "nasıl", "nasil", "site", "platform"],
    answer: "Crelavo; ecommerce product video, website, app, brand kit, campaign asset, live sales agent, Growth Intelligence ve dashboard teslim akışları için çalışan AI production studio’dur. Shopify, Amazon, marketplace seller, creator ve ajanslar için pratik teslimatlar üretmeye odaklanır.",
    primaryUrl: "/categories",
    primaryLabel: "Explore Crelavo categories",
    links: [
      { label: "Explore categories", href: "/categories" },
      { label: "Pricing", href: "/pricing" },
      { label: "Showcase", href: "/showcase/explore-samples" }
    ]
  }
];

const quickQuestionsByLang: Record<Lang, string[]> = {
  tr: ["Cancel preview", "Paket fiyatları", "Ekstra kredi gerekir mi?", "Affiliate komisyonları", "Üretim durumum nerede?"],
  en: ["Cancel preview", "Plan prices", "Do premium features cost extra?", "Affiliate commissions", "Where is my production?"],
  de: ["Preview kündigen", "Paketpreise", "Kosten Premium-Funktionen extra?", "Affiliate-Provisionen", "Wo ist meine Produktion?"],
  fr: ["Annuler le preview", "Prix des plans", "Les options premium coûtent-elles plus?", "Commissions affiliées", "Où est ma production?"],
  es: ["Cancelar preview", "Precios de planes", "¿Las funciones premium cuestan extra?", "Comisiones de afiliado", "¿Dónde está mi producción?"],
  pt: ["Cancelar preview", "Preços dos planos", "Recursos premium custam extra?", "Comissões de afiliado", "Onde está minha produção?"]
};

const localizedContent: Record<string, Partial<Record<Lang, { title: string; answer: string }>>> = {
  cancel: {
    en: { title: "Cancel preview / subscription", answer: "If you are inside the 24-hour preview and do not want the main subscription to start, cancel from Whop before the preview ends. Whop is the billing source of record, so the official cancellation must be completed there." },
    de: { title: "Preview / Abo kündigen", answer: "Wenn Sie im 24-Stunden-Preview sind und das Hauptabo nicht starten möchten, kündigen Sie vor Ablauf des Previews in Whop. Whop ist die offizielle Zahlungsquelle, daher muss die Kündigung dort abgeschlossen werden." },
    fr: { title: "Annuler le preview / l’abonnement", answer: "Si vous êtes dans le preview de 24 heures et ne voulez pas que l’abonnement principal démarre, annulez dans Whop avant la fin du preview. Whop est la source officielle de facturation." },
    es: { title: "Cancelar preview / suscripción", answer: "Si estás dentro del preview de 24 horas y no quieres que empiece la suscripción principal, cancela desde Whop antes de que termine el preview. Whop es la fuente oficial de facturación." },
    pt: { title: "Cancelar preview / assinatura", answer: "Se você está no preview de 24 horas e não quer que a assinatura principal comece, cancele pelo Whop antes do fim do preview. O Whop é a fonte oficial de cobrança." }
  },
  billing: {
    en: { title: "Payment, invoice or billing help", answer: "Payments are processed by Whop or the active payment provider. Crelavo does not store raw card numbers. Use the same email for checkout and your Crelavo account so credits, billing and support can be matched quickly." },
    de: { title: "Zahlung, Rechnung oder Billing", answer: "Zahlungen laufen über Whop oder den aktiven Zahlungsanbieter. Crelavo speichert keine Kartennummern. Nutzen Sie dieselbe E-Mail für Checkout und Crelavo-Konto, damit Credits und Support schnell zugeordnet werden." },
    fr: { title: "Paiement, facture ou billing", answer: "Les paiements passent par Whop ou le fournisseur actif. Crelavo ne stocke pas les numéros de carte. Utilisez le même email au checkout et dans Crelavo pour associer crédits et support rapidement." },
    es: { title: "Pago, factura o billing", answer: "Los pagos se procesan por Whop o el proveedor activo. Crelavo no guarda números de tarjeta. Usa el mismo email en checkout y en tu cuenta Crelavo para emparejar créditos y soporte rápido." },
    pt: { title: "Pagamento, fatura ou billing", answer: "Pagamentos são processados pelo Whop ou provedor ativo. A Crelavo não armazena números de cartão. Use o mesmo email no checkout e na conta Crelavo para conectar créditos e suporte rapidamente." }
  },
  pricing: {
    en: { title: "Plans, packages and credit amounts", answer: "Main plans: Pro $29/mo with 2,500 credits, Business $79/mo with 12,000 credits, Ultra $199/mo with 25,000 credits, Team $130/seat/mo or Team Annual with 174,000 yearly credits. The 24-hour preview is the safest entry: Business for smaller ecommerce tests, Team Annual for agency/bulk production value." },
    de: { title: "Pläne, Pakete und Credits", answer: "Hauptpläne: Pro $29/Monat mit 2.500 Credits, Business $79/Monat mit 12.000 Credits, Ultra $199/Monat mit 25.000 Credits, Team $130/Sitz/Monat oder Team Annual mit 174.000 Jahrescredits. Der 24-Stunden-Preview ist der risikoarme Einstieg." },
    fr: { title: "Plans, packages et crédits", answer: "Plans principaux : Pro 29 $/mois avec 2 500 crédits, Business 79 $/mois avec 12 000 crédits, Ultra 199 $/mois avec 25 000 crédits, Team 130 $/seat/mois ou Team Annual avec 174 000 crédits annuels. Le preview 24 h est l’entrée la moins risquée." },
    es: { title: "Planes, paquetes y créditos", answer: "Planes principales: Pro $29/mes con 2,500 créditos, Business $79/mes con 12,000 créditos, Ultra $199/mes con 25,000 créditos, Team $130/asiento/mes o Team Annual con 174,000 créditos anuales. El preview de 24 horas es la entrada de menor riesgo." },
    pt: { title: "Planos, pacotes e créditos", answer: "Planos principais: Pro US$29/mês com 2.500 créditos, Business US$79/mês com 12.000 créditos, Ultra US$199/mês com 25.000 créditos, Team US$130/seat/mês ou Team Annual com 174.000 créditos anuais. O preview de 24h é a entrada de menor risco." }
  },
  "campaign-offer": {
    en: { title: "Current preview campaign and special offers", answer: "The strongest current offer is 24-hour preview + high credit value: Business gives 12,000 credits for lower-risk ecommerce tests, while Team Annual gives 174,000 yearly credits for agency/bulk production. If the preview offer is active at checkout, starting now helps avoid missing the credit advantage." },
    de: { title: "Aktuelle Preview-Kampagne", answer: "Das stärkste Angebot ist 24-Stunden-Preview + hoher Credit-Wert: Business bietet 12.000 Credits für risikoärmere Ecommerce-Tests, Team Annual 174.000 Jahrescredits für Agentur/Bulk-Produktion. Wenn das Angebot aktiv ist, lohnt sich der frühe Start." },
    fr: { title: "Campagne preview et offres", answer: "L’offre la plus forte est le preview 24 h + une grande valeur de crédits : Business inclut 12 000 crédits pour tester l’ecommerce à faible risque, Team Annual inclut 174 000 crédits annuels pour agences et production bulk." },
    es: { title: "Campaña preview y ofertas", answer: "La oferta más fuerte es preview de 24 horas + alto valor de créditos: Business incluye 12,000 créditos para pruebas ecommerce de bajo riesgo; Team Annual incluye 174,000 créditos anuales para agencias y producción bulk." },
    pt: { title: "Campanha preview e ofertas", answer: "A oferta mais forte é preview de 24h + alto valor em créditos: Business inclui 12.000 créditos para testes ecommerce com menor risco; Team Annual inclui 174.000 créditos anuais para agências e produção em volume." }
  },
  credits: {
    en: { title: "Credits, rollover and top-ups", answer: "Credits are added after payment confirmation and early-launch admin review. Monthly unused subscription credits roll over while the subscription remains active. Top-ups are separate: $10/800 credits, $25/2,500 credits, $60/7,000 credits." },
    de: { title: "Credits, Rollover und Top-ups", answer: "Credits werden nach Zahlungsbestätigung und Early-Launch-Admin-Review hinzugefügt. Nicht genutzte monatliche Abo-Credits rollen weiter, solange das Abo aktiv bleibt. Top-ups sind separat: $10/800, $25/2.500, $60/7.000 Credits." },
    fr: { title: "Crédits, rollover et top-ups", answer: "Les crédits sont ajoutés après confirmation du paiement et revue admin early-launch. Les crédits mensuels non utilisés se reportent tant que l’abonnement reste actif. Top-ups séparés : 10 $/800, 25 $/2 500, 60 $/7 000 crédits." },
    es: { title: "Créditos, rollover y top-ups", answer: "Los créditos se añaden tras confirmar el pago y la revisión admin inicial. Los créditos mensuales no usados se acumulan mientras la suscripción siga activa. Top-ups separados: $10/800, $25/2,500, $60/7,000 créditos." },
    pt: { title: "Créditos, rollover e top-ups", answer: "Créditos são adicionados após confirmação de pagamento e revisão admin inicial. Créditos mensais não usados acumulam enquanto a assinatura estiver ativa. Top-ups separados: US$10/800, US$25/2.500, US$60/7.000 créditos." }
  },
  "extra-credits": {
    en: { title: "Extra features, materials and premium credit use", answer: "Premium quality and materials can use more credits: 480p draft 10 credits/sec, 720p standard 20/sec, 1080p premium 55/sec, 1080p cinematic/luxury 160/sec, future 4K ultra 250/sec. Luxury locations, custom outfits, vehicles, hero props, voice clone, character continuity and stunt/fantasy worlds may cost extra." },
    de: { title: "Extras, Materialien und Premium-Credits", answer: "Premium-Qualität und Materialien können mehr Credits nutzen: 480p Draft 10 Credits/Sek., 720p Standard 20/Sek., 1080p Premium 55/Sek., 1080p Cinematic/Luxury 160/Sek. Luxusorte, Outfits, Fahrzeuge, Voice Clone oder Charakter-Kontinuität können extra kosten." },
    fr: { title: "Options premium et crédits", answer: "La qualité et les matériaux premium peuvent utiliser plus de crédits : 480p draft 10 crédits/s, 720p standard 20/s, 1080p premium 55/s, 1080p cinematic/luxury 160/s. Lieux premium, tenues, véhicules, voice clone ou continuité personnage peuvent coûter plus." },
    es: { title: "Funciones extra y créditos premium", answer: "La calidad y materiales premium pueden usar más créditos: 480p draft 10 créditos/s, 720p estándar 20/s, 1080p premium 55/s, 1080p cinematic/luxury 160/s. Lugares de lujo, outfits, vehículos, voice clone o continuidad de personaje pueden costar extra." },
    pt: { title: "Recursos extras e créditos premium", answer: "Qualidade e materiais premium podem usar mais créditos: 480p draft 10 créditos/s, 720p standard 20/s, 1080p premium 55/s, 1080p cinematic/luxury 160/s. Locais de luxo, roupas, veículos, voice clone ou continuidade de personagem podem custar extra." }
  },
  preview: {
    en: { title: "24-hour preview and downloads", answer: "The 24-hour preview is a low-risk access check: you start with a small preview payment, test the system, then the main plan continues if you keep it. Downloads are controlled during preview and final downloads unlock after the selected plan starts and payment is confirmed. If you do not want to continue, cancel in Whop before the main plan starts." },
    de: { title: "24-Stunden-Preview und Downloads", answer: "Der 24-Stunden-Preview ist ein risikoarmer Test: kleine Preview-Zahlung, System prüfen, Hauptplan läuft weiter, wenn Sie bleiben. Downloads sind im Preview kontrolliert; finale Downloads öffnen nach Planstart und Zahlungsbestätigung. Wenn Sie nicht weitermachen möchten, kündigen Sie vorher in Whop." },
    fr: { title: "Preview 24 h et téléchargements", answer: "Le preview 24 h est un test à faible risque : petit paiement preview, test du système, puis le plan principal continue si vous le gardez. Les downloads sont contrôlés pendant le preview et s’ouvrent après activation du plan et paiement confirmé. Sinon, annulez dans Whop avant le démarrage." },
    es: { title: "Preview de 24 horas y descargas", answer: "El preview de 24 horas es una prueba de bajo riesgo: pagas una pequeña entrada, pruebas el sistema y el plan principal continúa si lo mantienes. Las descargas están controladas durante el preview y se desbloquean tras iniciar el plan y confirmar el pago. Si no quieres seguir, cancela en Whop antes." },
    pt: { title: "Preview de 24h e downloads", answer: "O preview de 24h é um teste de baixo risco: pequeno pagamento inicial, você testa o sistema e o plano principal continua se mantiver. Downloads são controlados no preview e liberam após início do plano e confirmação do pagamento. Se não quiser continuar, cancele no Whop antes." }
  },
  affiliate: {
    en: { title: "Affiliate / partner program", answer: "Crelavo Partner Program is in early access. Launch-safe examples: 15% on credit/top-up sales, 25% on standard production packages, 30% on Growth Intelligence plans. Commissions stay pending for 30 days and are voided for refunds, cancellations, chargebacks, unpaid or fraud cases." },
    de: { title: "Affiliate / Partnerprogramm", answer: "Das Crelavo Partner Program ist im Early Access. Beispiele: 15% auf Credit/Top-up-Verkäufe, 25% auf Standard-Production-Pakete, 30% auf Growth-Intelligence-Pläne. Provisionen bleiben 30 Tage pending und verfallen bei Refund, Kündigung, Chargeback oder Fraud." },
    fr: { title: "Programme affilié / partenaire", answer: "Le Crelavo Partner Program est en early access. Exemples : 15 % sur crédits/top-ups, 25 % sur packages production standard, 30 % sur Growth Intelligence. Les commissions restent pending 30 jours et sont annulées en cas de refund, annulation, chargeback ou fraude." },
    es: { title: "Programa afiliado / partner", answer: "El Crelavo Partner Program está en early access. Ejemplos: 15% en créditos/top-ups, 25% en paquetes de producción estándar, 30% en Growth Intelligence. Las comisiones quedan pending 30 días y se anulan por refund, cancelación, chargeback o fraude." },
    pt: { title: "Programa afiliado / parceiro", answer: "O Crelavo Partner Program está em early access. Exemplos: 15% em créditos/top-ups, 25% em pacotes standard de produção, 30% em Growth Intelligence. Comissões ficam pending por 30 dias e são anuladas em refund, cancelamento, chargeback ou fraude." }
  },
  production: {
    en: { title: "Production, delivery or project status", answer: "Production requests are tracked in the dashboard. Crelavo separates planning, preview, production and delivery states so you can see what is happening before credits are spent." },
    de: { title: "Produktion, Lieferung oder Status", answer: "Produktionsanfragen werden im Dashboard verfolgt. Crelavo trennt Planning, Preview, Production und Delivery, damit Sie sehen, was passiert, bevor Credits genutzt werden." },
    fr: { title: "Production, livraison ou statut", answer: "Les demandes de production sont suivies dans le dashboard. Crelavo sépare planning, preview, production et delivery pour voir l’état avant d’utiliser les crédits." },
    es: { title: "Producción, entrega o estado", answer: "Las solicitudes de producción se siguen en el dashboard. Crelavo separa planning, preview, production y delivery para que veas qué ocurre antes de gastar créditos." },
    pt: { title: "Produção, entrega ou status", answer: "Os pedidos de produção são acompanhados no dashboard. A Crelavo separa planning, preview, production e delivery para você ver o status antes de gastar créditos." }
  },
  "ecommerce-video": {
    en: { title: "Ecommerce product video and campaign workflow", answer: "Crelavo turns Shopify, Amazon and marketplace product links into video ads, campaign briefs, hooks/CTAs, social variants and dashboard delivery. Start with the free ad score, then move to Business or Team preview." },
    de: { title: "Ecommerce-Produktvideo und Kampagnenflow", answer: "Crelavo verwandelt Shopify-, Amazon- und Marketplace-Produktlinks in Video Ads, Kampagnenbriefs, Hooks/CTAs, Social-Varianten und Dashboard-Delivery. Starten Sie mit dem kostenlosen Ad Score, dann Business oder Team Preview." },
    fr: { title: "Vidéo produit ecommerce et campagne", answer: "Crelavo transforme les liens produits Shopify, Amazon et marketplace en vidéos publicitaires, briefs, hooks/CTA, variantes social media et livraison dashboard. Commencez par le score publicitaire gratuit, puis Business ou Team preview." },
    es: { title: "Video ecommerce y campaña", answer: "Crelavo convierte links de Shopify, Amazon y marketplaces en video ads, briefs de campaña, hooks/CTA, variantes sociales y entrega en dashboard. Empieza con el ad score gratis y luego Business o Team preview." },
    pt: { title: "Vídeo ecommerce e campanha", answer: "A Crelavo transforma links de Shopify, Amazon e marketplaces em video ads, briefs, hooks/CTA, variantes sociais e entrega no dashboard. Comece pelo ad score grátis e depois Business ou Team preview." }
  },
  "live-sales": {
    en: { title: "AI live sales agent plans", answer: "AI Live Sales Agent plans are service subscriptions, not regular credit packs. Starter is $249/mo with 10 fair-use live hours, Pro $799/mo with 40 hours, Agency $2,499/mo with 120 hours. Extra provider/API hours are reviewed separately." },
    de: { title: "AI Live Sales Agent Pläne", answer: "AI Live Sales Agent Pläne sind Service-Abos, keine normalen Credit-Pakete. Starter $249/Monat mit 10 Fair-Use-Live-Stunden, Pro $799 mit 40 Stunden, Agency $2.499 mit 120 Stunden. Extra API/Provider-Stunden werden separat geprüft." },
    fr: { title: "Plans AI Live Sales Agent", answer: "Les plans AI Live Sales Agent sont des abonnements service, pas des packs de crédits. Starter 249 $/mois avec 10 heures live fair-use, Pro 799 $ avec 40 heures, Agency 2 499 $ avec 120 heures. Les heures API/provider extra sont revues séparément." },
    es: { title: "Planes AI Live Sales Agent", answer: "Los planes AI Live Sales Agent son suscripciones de servicio, no packs de créditos. Starter $249/mes con 10 horas live fair-use, Pro $799 con 40 horas, Agency $2,499 con 120 horas. Horas extra de API/provider se revisan aparte." },
    pt: { title: "Planos AI Live Sales Agent", answer: "Os planos AI Live Sales Agent são assinaturas de serviço, não pacotes de créditos. Starter US$249/mês com 10 horas live fair-use, Pro US$799 com 40 horas, Agency US$2.499 com 120 horas. Horas extras de API/provider são analisadas separadamente." }
  },
  "growth-intelligence": {
    en: { title: "Growth Intelligence plans", answer: "Growth Intelligence is competitor and market monitoring, not normal production credits. Starter $179/mo covers 1 competitor weekly monitoring, Growth $499/mo covers 3 competitors daily monitoring, Enterprise $1,999/mo covers 5-10 competitors and critical checks." },
    de: { title: "Growth Intelligence Pläne", answer: "Growth Intelligence ist Wettbewerber- und Marktmonitoring, keine normalen Production Credits. Starter $179/Monat: 1 Wettbewerber wöchentlich; Growth $499: 3 Wettbewerber täglich; Enterprise $1.999: 5-10 Wettbewerber und Critical Checks." },
    fr: { title: "Plans Growth Intelligence", answer: "Growth Intelligence est un monitoring marché/concurrents, pas des crédits production. Starter 179 $/mois : 1 concurrent weekly; Growth 499 $ : 3 concurrents daily; Enterprise 1 999 $ : 5-10 concurrents et critical checks." },
    es: { title: "Planes Growth Intelligence", answer: "Growth Intelligence es monitoreo de mercado/competidores, no créditos normales de producción. Starter $179/mes: 1 competidor semanal; Growth $499: 3 competidores diarios; Enterprise $1,999: 5-10 competidores y critical checks." },
    pt: { title: "Planos Growth Intelligence", answer: "Growth Intelligence é monitoramento de mercado/concorrentes, não créditos normais de produção. Starter US$179/mês: 1 concorrente semanal; Growth US$499: 3 concorrentes diários; Enterprise US$1.999: 5-10 concorrentes e critical checks." }
  },
  drone: {
    en: { title: "Drone / satellite video packages", answer: "Drone/Satellite packages are one-time credit purchases. Drone Location Video Pack is $299 with 2,600 credits; Satellite + Drone Story Pack is $699 with 6,800 credits for location, route, map/satellite intro and drone-style videos." },
    de: { title: "Drone / Satellite Video Pakete", answer: "Drone/Satellite-Pakete sind einmalige Credit-Käufe. Drone Location Video Pack: $299 mit 2.600 Credits; Satellite + Drone Story Pack: $699 mit 6.800 Credits für Location, Route, Map/Satellite Intro und Drone-Style Videos." },
    fr: { title: "Packs vidéo drone / satellite", answer: "Les packs Drone/Satellite sont des achats de crédits one-time. Drone Location Video Pack : 299 $ avec 2 600 crédits ; Satellite + Drone Story Pack : 699 $ avec 6 800 crédits pour location, route, intro map/satellite et vidéos drone-style." },
    es: { title: "Paquetes drone / satélite", answer: "Los paquetes Drone/Satellite son compras únicas de créditos. Drone Location Video Pack: $299 con 2,600 créditos; Satellite + Drone Story Pack: $699 con 6,800 créditos para ubicación, ruta, intro mapa/satélite y videos estilo drone." },
    pt: { title: "Pacotes drone / satélite", answer: "Pacotes Drone/Satellite são compras únicas de créditos. Drone Location Video Pack: US$299 com 2.600 créditos; Satellite + Drone Story Pack: US$699 com 6.800 créditos para localização, rota, intro mapa/satélite e vídeos estilo drone." }
  },
  "website-app-brand": {
    en: { title: "Website, app and brand kit production", answer: "Crelavo is not only video. It also supports websites, mobile apps, landing pages, brand kits, visual packs, campaign calendars and source handoff. Website starter work can start around 500 credits; campaign starter work around 2,500 credits." },
    de: { title: "Website, App und Brand Kit Produktion", answer: "Crelavo ist nicht nur Video. Es unterstützt Websites, Mobile Apps, Landing Pages, Brand Kits, Visual Packs, Kampagnenkalender und Source Handoff. Website-Starter können bei ca. 500 Credits starten, Campaign-Starter bei ca. 2.500 Credits." },
    fr: { title: "Production website, app et brand kit", answer: "Crelavo ne fait pas seulement de la vidéo. La plateforme couvre websites, apps mobiles, landing pages, brand kits, packs visuels, calendriers campagne et source handoff. Website starter peut commencer vers 500 crédits, campaign starter vers 2 500 crédits." },
    es: { title: "Producción web, app y brand kit", answer: "Crelavo no es solo video. También cubre websites, apps móviles, landing pages, brand kits, visual packs, calendarios de campaña y source handoff. Un website starter puede empezar alrededor de 500 créditos; campaign starter alrededor de 2,500." },
    pt: { title: "Produção website, app e brand kit", answer: "A Crelavo não é só vídeo. Também cobre websites, apps mobile, landing pages, brand kits, pacotes visuais, calendários de campanha e source handoff. Website starter pode começar por volta de 500 créditos; campaign starter por volta de 2.500." }
  },
  samples: {
    en: { title: "Samples, showcase and examples", answer: "Samples and showcase pages help users review Crelavo’s video, tools, sample and category-specific production directions before choosing a package or starting a request." },
    de: { title: "Samples, Showcase und Beispiele", answer: "Samples und Showcase-Seiten helfen, Crelavo Videos, Tools und category-specific Produktionsrichtungen zu prüfen, bevor ein Paket gewählt oder eine Anfrage gestartet wird." },
    fr: { title: "Samples, showcase et exemples", answer: "Les pages samples et showcase aident à voir les directions vidéo, tools et catégories Crelavo avant de choisir un package ou de démarrer une demande." },
    es: { title: "Samples, showcase y ejemplos", answer: "Las páginas de samples y showcase ayudan a revisar videos, tools y categorías de Crelavo antes de elegir un paquete o iniciar una solicitud." },
    pt: { title: "Samples, showcase e exemplos", answer: "As páginas de samples e showcase ajudam a revisar vídeos, tools e categorias da Crelavo antes de escolher um pacote ou iniciar um pedido." }
  },
  "tools-categories": {
    en: { title: "Tools, categories and production types", answer: "Crelavo supports AI Video, AI Avatar, AI Image, Product & E-commerce, Audio & Music, Cleanup & Enhancement, Highlights & Clips, Anime & Influencer, Short Drama, Drama, Stickman Animation, Interior & Real Estate and Video Edit & Replace workflows." },
    de: { title: "Tools, Kategorien und Produktionsarten", answer: "Crelavo unterstützt AI Video, AI Avatar, AI Image, Product & E-commerce, Audio & Music, Cleanup & Enhancement, Highlights & Clips, Anime & Influencer, Short Drama, Drama, Stickman Animation, Interior & Real Estate und Video Edit & Replace Workflows." },
    fr: { title: "Tools, catégories et types de production", answer: "Crelavo couvre AI Video, AI Avatar, AI Image, Product & E-commerce, Audio & Music, Cleanup & Enhancement, Highlights & Clips, Anime & Influencer, Short Drama, Drama, Stickman Animation, Interior & Real Estate et Video Edit & Replace." },
    es: { title: "Tools, categorías y tipos de producción", answer: "Crelavo soporta AI Video, AI Avatar, AI Image, Product & E-commerce, Audio & Music, Cleanup & Enhancement, Highlights & Clips, Anime & Influencer, Short Drama, Drama, Stickman Animation, Interior & Real Estate y Video Edit & Replace." },
    pt: { title: "Tools, categorias e tipos de produção", answer: "A Crelavo suporta AI Video, AI Avatar, AI Image, Product & E-commerce, Audio & Music, Cleanup & Enhancement, Highlights & Clips, Anime & Influencer, Short Drama, Drama, Stickman Animation, Interior & Real Estate e Video Edit & Replace." }
  },
  "membership-account": {
    en: { title: "Membership, login and account area", answer: "Crelavo accounts run through the dashboard. After login/register, users manage productions, credits, billing, settings, contact, partners and delivery. Using the same checkout email and account email helps match credits and support faster." },
    de: { title: "Mitgliedschaft, Login und Konto", answer: "Crelavo-Konten laufen über das Dashboard. Nach Login/Register verwalten Nutzer Productions, Credits, Billing, Settings, Contact, Partners und Delivery. Dieselbe Checkout- und Konto-E-Mail hilft bei schneller Zuordnung." },
    fr: { title: "Compte, login et espace membre", answer: "Les comptes Crelavo fonctionnent via le dashboard. Après login/register, les utilisateurs gèrent productions, crédits, billing, settings, contact, partners et delivery. Le même email checkout/compte accélère le matching." },
    es: { title: "Membresía, login y cuenta", answer: "Las cuentas Crelavo funcionan desde el dashboard. Tras login/register, el usuario gestiona productions, credits, billing, settings, contact, partners y delivery. Usar el mismo email acelera el matching de créditos y soporte." },
    pt: { title: "Membresia, login e conta", answer: "Contas Crelavo funcionam pelo dashboard. Após login/register, o usuário gerencia productions, credits, billing, settings, contact, partners e delivery. Usar o mesmo email acelera o matching de créditos e suporte." }
  },
  "production-stages": {
    en: { title: "Production stages and delivery flow", answer: "A typical Crelavo flow is brief, materials/brand info, credit estimate, production request, preview/QA, revision if needed, final delivery and dashboard download/handoff. Premium work like voice clone, subtitles, multi-language, source files or full managed handoff can require extra credits." },
    de: { title: "Produktionsphasen und Delivery Flow", answer: "Typischer Crelavo-Flow: Brief, Materialien/Brand-Info, Credit Estimate, Production Request, Preview/QA, Revision, Final Delivery und Dashboard Download/Handoff. Premium-Arbeiten wie Voice Clone, Subtitles, Multi-Language, Source Files oder Managed Handoff können extra Credits benötigen." },
    fr: { title: "Étapes de production et livraison", answer: "Flux typique Crelavo : brief, matériaux/brand info, estimation crédits, production request, preview/QA, revision si besoin, final delivery et dashboard download/handoff. Voice clone, subtitles, multi-language, source files ou managed handoff peuvent demander plus de crédits." },
    es: { title: "Etapas de producción y entrega", answer: "Flujo típico Crelavo: brief, materiales/brand info, estimación de créditos, production request, preview/QA, revisión, final delivery y dashboard download/handoff. Voice clone, subtítulos, multi-language, source files o managed handoff pueden requerir créditos extra." },
    pt: { title: "Etapas de produção e entrega", answer: "Fluxo típico Crelavo: brief, materiais/brand info, estimativa de créditos, production request, preview/QA, revisão, final delivery e dashboard download/handoff. Voice clone, legendas, multi-language, source files ou managed handoff podem exigir créditos extras." }
  },
  "roas-marketing": {
    en: { title: "ROAS, ad score and marketing performance", answer: "Crelavo aims to support marketing performance, not only file output. The free AI Ad Performance Score Checker analyzes hook, CTA and creative weaknesses. Future output screens can show Video Conversion Score, Estimated ROAS Boost and Hook Rate." },
    de: { title: "ROAS, Ad Score und Marketing Performance", answer: "Crelavo unterstützt Marketing Performance, nicht nur Datei-Output. Der kostenlose AI Ad Performance Score Checker analysiert Hook, CTA und Creative-Schwächen. Später können Video Conversion Score, Estimated ROAS Boost und Hook Rate angezeigt werden." },
    fr: { title: "ROAS, ad score et performance", answer: "Crelavo vise la performance marketing, pas seulement le fichier final. Le AI Ad Performance Score Checker gratuit analyse hook, CTA et faiblesses créatives. Les écrans futurs peuvent afficher Video Conversion Score, Estimated ROAS Boost et Hook Rate." },
    es: { title: "ROAS, ad score y performance", answer: "Crelavo busca apoyar performance de marketing, no solo entregar archivos. El AI Ad Performance Score Checker gratis analiza hook, CTA y debilidades creativas. En el futuro puede mostrar Video Conversion Score, Estimated ROAS Boost y Hook Rate." },
    pt: { title: "ROAS, ad score e performance", answer: "A Crelavo busca apoiar performance de marketing, não só entregar arquivos. O AI Ad Performance Score Checker grátis analisa hook, CTA e fraquezas criativas. No futuro pode mostrar Video Conversion Score, Estimated ROAS Boost e Hook Rate." }
  },
  "ad-recreator": {
    en: { title: "AI Ad Re-Creator and reference ad analysis", answer: "Crelavo does not position this as direct competitor copying. The safe flow extracts only hook, pacing, scene order, proof moment and CTA logic from a reference ad, then creates an original brief for your own product without reusing competitor footage, logos, music, faces, voice or exact copy." },
    de: { title: "AI Ad Re-Creator und Referenzanalyse", answer: "Crelavo positioniert dies nicht als direktes Kopieren von Wettbewerbern. Der sichere Flow extrahiert nur Hook, Pacing, Szenenfolge, Proof Moment und CTA-Logik aus einer Referenzanzeige und erstellt dann ein originales Briefing für Ihr eigenes Produkt ohne fremdes Footage, Logos, Musik, Gesichter, Stimmen oder exakte Texte." },
    fr: { title: "AI Ad Re-Creator et analyse de référence", answer: "Crelavo ne le positionne pas comme une copie directe de concurrents. Le flux sûr extrait uniquement hook, rythme, ordre des scènes, preuve et CTA d’une publicité de référence, puis crée un brief original pour votre produit sans réutiliser images, logos, musique, visages, voix ou texte exact." },
    es: { title: "AI Ad Re-Creator y análisis de referencia", answer: "Crelavo no lo presenta como copia directa de competidores. El flujo seguro extrae solo hook, ritmo, orden de escenas, prueba y lógica CTA de un anuncio de referencia, y luego crea un brief original para tu producto sin reutilizar footage, logos, música, caras, voz o copy exacto." },
    pt: { title: "AI Ad Re-Creator e análise de referência", answer: "A Crelavo não posiciona isso como cópia direta de concorrentes. O fluxo seguro extrai apenas hook, ritmo, ordem das cenas, prova e lógica de CTA de um anúncio de referência, depois cria um brief original para seu produto sem reutilizar vídeos, logos, música, rostos, voz ou texto exato." }
  },
  "community-promos": {
    en: { title: "VIP community and competitor switch offers", answer: "Preview buyers may see a VIP Agency Hub invite in the dashboard or payment email; if the link is not active yet, support can send it manually. SWITCH20 or similar promo codes are only for controlled competitor-switch campaigns, not guaranteed for every user, and are managed with expiry and abuse checks." },
    de: { title: "VIP Community und Wechselangebote", answer: "Preview-Käufer können den VIP Agency Hub Invite im Dashboard oder in der Zahlungs-E-Mail sehen; wenn der Link noch nicht aktiv ist, kann Support ihn manuell senden. SWITCH20 oder ähnliche Promo Codes gelten nur für kontrollierte Competitor-Switch-Kampagnen, nicht garantiert für jeden Nutzer, mit Ablauf- und Abuse-Kontrolle." },
    fr: { title: "Communauté VIP et offres switch", answer: "Les acheteurs preview peuvent voir l’invitation VIP Agency Hub dans le dashboard ou l’email de paiement ; si le lien n’est pas encore actif, le support peut l’envoyer manuellement. SWITCH20 ou codes similaires sont réservés aux campagnes competitor-switch contrôlées, sans garantie pour chaque utilisateur, avec expiration et contrôle anti-abus." },
    es: { title: "Comunidad VIP y ofertas switch", answer: "Los compradores preview pueden ver la invitación VIP Agency Hub en el dashboard o email de pago; si el enlace aún no está activo, soporte puede enviarlo manualmente. SWITCH20 o códigos similares solo se usan en campañas controladas de cambio desde competidores, no están garantizados para todos y tienen caducidad y control anti-abuso." },
    pt: { title: "Comunidade VIP e ofertas switch", answer: "Compradores preview podem ver o convite VIP Agency Hub no dashboard ou email de pagamento; se o link ainda não estiver ativo, o suporte pode enviar manualmente. SWITCH20 ou códigos similares são usados apenas em campanhas controladas de troca de concorrente, não são garantidos para todos e têm expiração e controle anti-abuso." }
  },
  human: {
    en: { title: "Need human support", answer: "This box is not live human chat; it is a fast Crelavo guide. For account, billing, production or delivery questions that need review, send a support request with your account email, payment reference or production ID." },
    de: { title: "Menschlichen Support benötigt", answer: "Diese Box ist kein Live-Human-Chat, sondern ein schneller Crelavo Guide. Für Konto-, Zahlungs-, Produktions- oder Lieferfragen mit Review senden Sie eine Support-Anfrage mit Konto-E-Mail, Zahlungsreferenz oder Production ID." },
    fr: { title: "Besoin d’un support humain", answer: "Cette box n’est pas un live chat humain ; c’est un guide Crelavo rapide. Pour les questions compte, paiement, production ou livraison nécessitant revue, envoyez une demande avec email de compte, référence paiement ou production ID." },
    es: { title: "Necesitas soporte humano", answer: "Esta caja no es chat humano en vivo; es una guía rápida de Crelavo. Para cuenta, pago, producción o entrega que requiera revisión, envía una solicitud con email de cuenta, referencia de pago o production ID." },
    pt: { title: "Precisa de suporte humano", answer: "Esta caixa não é chat humano ao vivo; é um guia rápido da Crelavo. Para conta, pagamento, produção ou entrega que precise de revisão, envie suporte com email da conta, referência de pagamento ou production ID." }
  },
  site: {
    en: { title: "What is Crelavo?", answer: "Crelavo is an AI production studio for ecommerce product video, websites, apps, brand kits, campaign assets, live sales agents, Growth Intelligence and dashboard delivery workflows. It is built for Shopify, Amazon, marketplace sellers, creators and agencies." },
    de: { title: "Was ist Crelavo?", answer: "Crelavo ist ein AI Production Studio für Ecommerce-Produktvideos, Websites, Apps, Brand Kits, Kampagnenassets, Live Sales Agents, Growth Intelligence und Dashboard Delivery. Es ist für Shopify, Amazon, Marketplace Seller, Creator und Agenturen gebaut." },
    fr: { title: "Qu’est-ce que Crelavo ?", answer: "Crelavo est un AI production studio pour vidéos ecommerce, websites, apps, brand kits, assets de campagne, live sales agents, Growth Intelligence et delivery dashboard. Il est conçu pour Shopify, Amazon, marketplace sellers, creators et agences." },
    es: { title: "¿Qué es Crelavo?", answer: "Crelavo es un AI production studio para videos ecommerce, websites, apps, brand kits, assets de campaña, live sales agents, Growth Intelligence y delivery dashboard. Está diseñado para Shopify, Amazon, vendedores marketplace, creators y agencias." },
    pt: { title: "O que é a Crelavo?", answer: "A Crelavo é um AI production studio para vídeos ecommerce, websites, apps, brand kits, assets de campanha, live sales agents, Growth Intelligence e delivery dashboard. Foi criada para Shopify, Amazon, sellers de marketplace, creators e agências." }
  }
};

const uiText: Record<Lang, { badge: string; heading: string; intro: string; placeholder: string; button: string; bestPage: string; redirecting: string; close: string; redirectOffer: (url: string) => string; redirectMessage: (url: string) => string }> = {
  tr: { badge: "Crelavo site rehberi", heading: "Merhaba, ben Crelavo Support Guide.", intro: "Crelavo sayfaları, paketler, krediler, affiliate, ödeme, iptal veya üretim hakkında soru sorun. Direkt cevap verip en doğru Crelavo URL’sini göstereceğim.", placeholder: "Sorun: affiliate oranı, kredi, iptal, paket, üretim...", button: "Direkt cevap al", bestPage: "En iyi sayfa", redirecting: "Yönlendiriliyor", close: "Desteği kapat", redirectOffer: (url) => `İsterseniz sizi ${url} sayfamıza yönlendirebilirim. “Evet” yazarsanız direkt o sayfaya gideriz.`, redirectMessage: (url) => `Sizi ilgili Crelavo sayfasına yönlendiriyorum: ${url}` },
  en: { badge: "Crelavo site guide", heading: "Hi, I’m Crelavo Support Guide.", intro: "Ask about Crelavo pages, pricing, credits, affiliate, billing, cancellation or production. I will answer directly and show the best Crelavo URL.", placeholder: "Ask: affiliate rates, credits, cancel, pricing, production...", button: "Get direct answer", bestPage: "Best page", redirecting: "Redirecting", close: "Close support", redirectOffer: (url) => `I can take you to ${url} if you want. Type “yes” and I’ll open that page.`, redirectMessage: (url) => `I’m taking you to the relevant Crelavo page: ${url}` },
  de: { badge: "Crelavo Site-Guide", heading: "Hallo, ich bin der Crelavo Support Guide.", intro: "Fragen Sie zu Crelavo-Seiten, Preisen, Credits, Affiliate, Billing, Kündigung oder Produktion. Ich antworte direkt und zeige die beste Crelavo-URL.", placeholder: "Fragen: Affiliate, Credits, Kündigung, Preise, Produktion...", button: "Direkte Antwort", bestPage: "Beste Seite", redirecting: "Weiterleitung", close: "Support schließen", redirectOffer: (url) => `Ich kann Sie zu ${url} weiterleiten. Schreiben Sie „ja“ und ich öffne die Seite.`, redirectMessage: (url) => `Ich leite Sie zur passenden Crelavo-Seite weiter: ${url}` },
  fr: { badge: "Guide du site Crelavo", heading: "Bonjour, je suis le Crelavo Support Guide.", intro: "Posez une question sur les pages, prix, crédits, affiliation, billing, annulation ou production. Je réponds directement et montre la meilleure URL Crelavo.", placeholder: "Demandez : affiliation, crédits, annulation, prix, production...", button: "Réponse directe", bestPage: "Meilleure page", redirecting: "Redirection", close: "Fermer le support", redirectOffer: (url) => `Je peux vous rediriger vers ${url}. Écrivez « oui » et j’ouvrirai la page.`, redirectMessage: (url) => `Je vous redirige vers la page Crelavo pertinente : ${url}` },
  es: { badge: "Guía del sitio Crelavo", heading: "Hola, soy Crelavo Support Guide.", intro: "Pregunta sobre páginas, precios, créditos, afiliados, pagos, cancelación o producción. Respondo directo y muestro la mejor URL de Crelavo.", placeholder: "Pregunta: afiliado, créditos, cancelar, precios, producción...", button: "Ver respuesta", bestPage: "Mejor página", redirecting: "Redirigiendo", close: "Cerrar soporte", redirectOffer: (url) => `Puedo llevarte a ${url} si quieres. Escribe “sí” y abriré esa página.`, redirectMessage: (url) => `Te llevo a la página relevante de Crelavo: ${url}` },
  pt: { badge: "Guia do site Crelavo", heading: "Olá, sou o Crelavo Support Guide.", intro: "Pergunte sobre páginas, preços, créditos, afiliados, pagamentos, cancelamento ou produção. Respondo direto e mostro a melhor URL da Crelavo.", placeholder: "Pergunte: afiliado, créditos, cancelar, preços, produção...", button: "Ver resposta", bestPage: "Melhor página", redirecting: "Redirecionando", close: "Fechar suporte", redirectOffer: (url) => `Posso levar você para ${url}. Digite “sim” e eu abro essa página.`, redirectMessage: (url) => `Estou levando você para a página relevante da Crelavo: ${url}` }
};

function detectLanguage(text: string, fallback: Lang = "en"): Lang {
  const clean = normalize(text);
  if (/[ğıüşöçİĞÜŞÖÇ]/.test(text) || /\b(nedir|iptal|kredi|paket|fiyat|ücret|odeme|ödeme|yardim|yardım|evet|tamam|yonlendir|yönlendir)\b/.test(clean)) return "tr";
  if (/\b(wie|was|kündigen|kuendigen|rechnung|preise|paket|weiterleiten|ja|öffnen|offnen|credits|guthaben)\b/.test(clean)) return "de";
  if (/\b(comment|combien|annuler|paiement|facture|crédits|credits|prix|abonnement|oui|rediriger|ouvrir)\b/.test(clean)) return "fr";
  if (/\b(cuanto|cuántos|cancelar|pago|factura|precio|precios|créditos|creditos|suscripción|suscripcion|sí|redirigir|abrir)\b/.test(clean)) return "es";
  if (/\b(quanto|quantos|cancelar|pagamento|fatura|preço|precos|preços|créditos|creditos|assinatura|sim|redirecionar|abrir)\b/.test(clean)) return "pt";
  if (/\b(yes|no|ok|open|go|pricing|credits|billing|cancel|subscription|affiliate|production|website|app|tools|ecommerce)\b/.test(clean)) return "en";
  return fallback;
}

function contentFor(answer: SupportAnswer, lang: Lang) {
  if (lang === "tr") return { title: answer.title, answer: answer.answer };
  return localizedContent[answer.id]?.[lang] ?? localizedContent[answer.id]?.en ?? { title: answer.title, answer: answer.answer };
}

function canShow(pathname: string | null) {
  const path = pathname || "/";
  return !hiddenPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[ıİ]/g, "i").replace(/[ğĞ]/g, "g").replace(/[üÜ]/g, "u").replace(/[şŞ]/g, "s").replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c");
}

function absoluteUrl(href: string) {
  if (href.startsWith("http") || href.startsWith("mailto:")) return href;
  return `${siteUrl}${href}`;
}

function wantsRedirect(text: string) {
  const clean = normalize(text.trim());
  return ["yes", "evet", "olur", "tamam", "yonlendir", "yönlendir", "git", "gidelim", "ac", "aç", "send", "go", "open", "ja", "öffnen", "offnen", "weiter", "weiterleiten", "oui", "ouvrir", "rediriger", "sí", "si", "abrir", "redirigir", "sim", "redirecionar"].some((word) => clean === normalize(word) || clean.includes(normalize(word)));
}

function findDirectoryRoute(question: string) {
  const clean = normalize(question);
  const scored = siteDirectory.map((item) => ({
    item,
    score: item.keywords.reduce((total, keyword) => total + (clean.includes(normalize(keyword)) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);
  return scored[0]?.score ? scored[0].item : null;
}

function findAnswer(question: string) {
  const clean = normalize(question);
  const scored = supportAnswers.map((item) => ({
    item,
    score: item.keywords.reduce((total, keyword) => total + (clean.includes(normalize(keyword)) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);
  const best = scored[0]?.score ? scored[0].item : supportAnswers.find((item) => item.id === "site")!;
  const directoryRoute = findDirectoryRoute(question);
  if (!directoryRoute || best.links.some((link) => link.href === directoryRoute.href)) return best;
  return {
    ...best,
    links: [{ label: directoryRoute.label, href: directoryRoute.href }, ...best.links].slice(0, 4),
    primaryUrl: directoryRoute.href,
    primaryLabel: directoryRoute.label
  };
}

export function PreviewSupportBox() {
  const pathname = usePathname();
  const allowed = useMemo(() => canShow(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<SupportAnswer>(supportAnswers.find((item) => item.id === "site")!);
  const [redirecting, setRedirecting] = useState(false);
  const [currentLang, setCurrentLang] = useState<Lang>("en");

  if (!allowed) return null;

  function ask(question: string) {
    const lang = detectLanguage(question, currentLang);
    const next = findAnswer(question);
    setCurrentLang(lang);
    setInput(question);
    setAnswer(next);
    setRedirecting(false);
    setOpen(true);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = input.trim();
    if (!clean) return;
    const lang = detectLanguage(clean, currentLang);
    setCurrentLang(lang);
    if (wantsRedirect(clean)) {
      setRedirecting(true);
      window.location.href = absoluteUrl(answer.primaryUrl);
      return;
    }
    setAnswer(findAnswer(clean));
    setRedirecting(false);
  }

  const t = uiText[currentLang];
  const localizedAnswer = contentFor(answer, currentLang);
  const quickQuestions = quickQuestionsByLang[currentLang];
  const primaryAbsoluteUrl = absoluteUrl(answer.primaryUrl);

  return (
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 70, width: "min(410px, calc(100vw - 32px))" }}>
      {open ? (
        <div className="card" style={{ border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 22px 70px rgba(0,0,0,0.32)", background: "rgba(12, 18, 32, 0.96)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span className="logo-mark" style={{ flex: "0 0 auto", marginTop: 2 }}>▶</span>
              <div>
                <span className="badge">{t.badge}</span>
                <h3 style={{ margin: "10px 0 6px" }}>{t.heading}</h3>
                <p style={{ color: "var(--muted)", margin: 0, fontSize: 13 }}>{t.intro}</p>
              </div>
            </div>
            <button type="button" aria-label={t.close} onClick={() => setOpen(false)} style={{ border: 0, borderRadius: 999, width: 32, height: 32, cursor: "pointer", background: "rgba(255,255,255,0.12)", color: "var(--text)" }}>×</button>
          </div>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder}
              style={{ width: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,0.16)", padding: "12px 14px", background: "rgba(255,255,255,0.06)", color: "var(--text)" }}
            />
            <button className="primary-button" type="submit">{t.button}</button>
          </form>

          <div className="workspace-action-note" style={{ marginTop: 14 }}>
            <strong>{redirecting ? t.redirecting : localizedAnswer.title}</strong>
            {redirecting ? (
              <p style={{ marginBottom: 0 }}>{t.redirectMessage(primaryAbsoluteUrl)}</p>
            ) : (
              <>
                <p style={{ marginBottom: 8 }}>{localizedAnswer.answer}</p>
                <p style={{ marginBottom: 0 }}>{t.redirectOffer(primaryAbsoluteUrl)}</p>
              </>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {answer.links.map((link) => link.external ? (
              <a className="secondary-button" href={link.href} target={link.href.startsWith("mailto:") ? undefined : "_blank"} rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"} key={`${link.label}-${link.href}`}>{link.label}</a>
            ) : (
              <Link className="secondary-button" href={link.href} key={`${link.label}-${link.href}`}>{link.label}</Link>
            ))}
          </div>

          <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
            <small style={{ color: "var(--muted)" }}>{t.bestPage}: {primaryAbsoluteUrl}</small>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {quickQuestions.map((question) => <button type="button" className="btn secondary" style={{ padding: "8px 10px", fontSize: 12 }} onClick={() => ask(question)} key={question}>{question}</button>)}
          </div>
        </div>
      ) : (
        <button type="button" className="primary-button" onClick={() => setOpen(true)} style={{ width: "100%", boxShadow: "0 16px 45px rgba(0,0,0,0.28)" }}>
          <span className="logo-mark" style={{ marginRight: 8 }}>▶</span>Crelavo Support Guide
        </button>
      )}
    </div>
  );
}
