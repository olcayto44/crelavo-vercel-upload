export function detectLanguage(idea: string) {
  if (/[çğıöşüÇĞİÖŞÜ]/.test(idea)) return "Turkish";
  if (/\b(merhaba|selam|istiyorum|yap|olsun|görsel|ürün|reklam|kredi|asistan|web sitesi|uygulama|doküman|teklif|marka|panel)\b/i.test(idea)) return "Turkish";
  return "the same language as the user's latest message";
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function detectCategory(idea: string) {
  const text = idea.toLowerCase();

  if (includesAny(text, ["shopify app", "shopify app store", "uygulama mağazası", "app store entegrasyon"])) return "SaaS";
  if (includesAny(text, ["e-ticaret sitesi", "e ticaret sitesi", "ecommerce website", "e-commerce website", "online mağaza", "online magaza", "mağaza sitesi", "magaza sitesi", "storefront", "checkout", "sepet", "ürün sayfası", "urun sayfasi"])) return "Website";
  if (includesAny(text, ["kampanya", "campaign", "text-to-campaign", "metinden kampanyaya", "ürün reklam", "urun reklam", "ürün linki", "product link", "tiktok", "instagram", "google reklam", "email newsletter", "e-posta bülteni", "çoklu mecra", "zamanla", "otomatik dağıtım"])) return "Text-to-Campaign";
  if (includesAny(text, ["growth intelligence", "rakip takibi", "rakip fiyat", "fiyat değişikliği", "fiyat degisikligi", "competitor monitoring", "competitor intelligence", "market intelligence", "pazar istihbarat", "public signal", "weekly report", "haftalık rapor", "haftalik rapor"])) return "Growth Intelligence";
  if (includesAny(text, ["ai agent", "agent", "yapay zekâ temsilci", "yapay zeka temsilci", "ai influencer", "marka yüzü", "dijital avatar", "otonom sosyal medya", "sosyal medya müdürü", "rakip analizi", "trend ses", "7/24", "canlı yayın"])) return "AI Agents";
  if (includesAny(text, ["lokalizasyon", "localization", "küreselleşme", "global", "kültürel adaptasyon", "japonya", "brezilya", "çeviri", "ülkeye göre", "culture", "cultural adaptation"])) return "Global Localization";
  if (includesAny(text, ["görselden video", "gorselden video", "image-to-video", "image to video", "linkten video", "link-to-video", "senaryodan video", "script-to-video", "video büyüt", "video buyut", "video extend", "fligransız", "filigransız", "watermark-free", "watermarksız"])) return "Video Tools";
  if (includesAny(text, ["documentary", "belgesel", "docu series", "docuseries", "research-led video", "interview documentary", "archival visuals"])) return "Documentary";
  if (includesAny(text, ["çöp adam", "cop adam", "stickman"])) return "Stickman Animation";
  if (includesAny(text, ["anime kısa film", "anime short film", "anime film", "manga video", "shonen", "chibi", "anime scene"])) return "Anime Short Film";
  if (includesAny(text, ["hayvan video", "hayvan videosu", "animal video", "pet video", "kedi videosu", "köpek videosu", "komik hayvan", "funny animal", "wildlife animal"])) return "Animal Video";
  if (includesAny(text, ["doğa videosu", "doga videosu", "nature video", "landscape video", "wildlife video", "orman videosu", "dağ videosu", "dag videosu", "weather video", "ocean video"])) return "Nature Video";
  if (includesAny(text, ["gezegen videosu", "planet video", "space video", "uzay videosu", "astronomy video", "galaxy video", "universe video", "cosmic video"])) return "Planet / Space Video";
  if (includesAny(text, ["animasyon", "animation", "2d", "2.5d", "3d", "whiteboard", "motion control", "hareket kontrolü", "karakter animasyon"])) return "Animation";
  if (includesAny(text, ["stüdyo", "studio", "dizi", "film stüdyo", "senaryo", "sahne planı", "karakter dökümü", "fragman", "trailer"])) return "Studio / Series-Film";
  if (includesAny(text, ["sinematik", "cinematic", "lüks video", "luxury video", "premium video"])) return "Cinematic Video";
  if (includesAny(text, ["video kırp", "video kirp", "uzun video", "shorts çıkar", "shorts cikar", "en heyecanlı", "en heyecanli", "en korkunç", "en korkunc", "komik sahne", "hook çıkar", "hook cikar", "clipping"])) return "Video Clipping";
  if (includesAny(text, ["avatar tasarla", "avatar üret", "avatar uret", "kendi avatar", "talking avatar", "avatar video"])) return "Avatar Design / Avatar Video";
  if (includesAny(text, ["dudak senk", "lip sync", "lipsync", "konuştur", "konustur", "ağız senk", "agiz senk"])) return "Lip Sync Video";
  if (includesAny(text, ["ses klon", "voice clone", "ses kopya", "clean vocal", "sesden video", "sesten video"])) return "Voice Cloning";
  if (includesAny(text, ["görsel klon", "gorsel klon", "visual clone", "style clone", "referans stil", "style transfer"])) return "Visual Clone / Style Clone";
  if (includesAny(text, ["görselden video", "gorselden video", "image-to-video", "image to video", "linkten video", "link-to-video", "senaryodan video", "script-to-video", "video büyüt", "video buyut", "video extend", "fligransız", "filigransız", "watermark-free", "watermarksız"])) return "Video Tools";
  if (includesAny(text, ["mobil", "mobile", "ios", "android", "react native", "expo", "app ", "uygulama"])) return "Mobile App";
  if (includesAny(text, ["admin panel", "admin dashboard", "yönetim paneli", "crm", "cms", "crud"]) && !text.includes("saas")) return "Admin Panel Project";
  if (includesAny(text, ["saas", "dashboard", "panel", "portal", "müşteri paneli", "client portal", "subscription", "abonelik"])) return "SaaS";
  if (includesAny(text, ["brand kit", "marka kiti", "logo", "kurumsal kimlik", "visual identity", "renk paleti", "typography", "tipografi"])) return "Brand Kit";
  if (includesAny(text, ["doküman", "document", "pdf", "pitch", "proposal", "teklif", "sunum", "deck", "katalog", "catalog", "dosya paketi"])) return "Document / File Pack";
  if (includesAny(text, ["görsel", "image", "visual", "poster", "afiş", "mockup", "fotoğraf", "photo", "hero image", "sosyal medya görseli"])) return "Image / Visual";
  if (includesAny(text, ["web sitesi", "website", "landing", "site", "e-ticaret", "ecommerce", "e-commerce", "shopify", "web page", "anasayfa"])) return "Website";
  if (includesAny(text, ["video", "reklam filmi", "shorts", "tiktok", "reels", "cinematic", "film", "fragman", "drama", "avatar"])) return "AI Video";

  return "Website";
}

export function detectStyle(idea: string) {
  const text = idea.toLowerCase();

  if (includesAny(text, ["shopify", "app store", "merchant"])) return "E-commerce Product";
  if (includesAny(text, ["premium saas", "saas", "dashboard", "platform"])) return "Premium SaaS";
  if (includesAny(text, ["luxury", "lüks", "premium", "high-end", "prestij"])) return "Luxury Brand";
  if (includesAny(text, ["startup", "clean", "minimal", "sade", "modern"])) return "Startup Clean";
  if (includesAny(text, ["mobile", "mobil", "ios", "android", "app"])) return "Mobile App Modern";
  if (includesAny(text, ["ecommerce", "e-commerce", "e-ticaret", "ürün", "product"])) return "E-commerce Product";
  if (includesAny(text, ["doküman", "document", "pdf", "pitch", "proposal", "teklif", "deck"])) return "Editorial Document";
  if (includesAny(text, ["cinematic", "sinema", "film", "movie", "video"])) return "Cinematic Video";
  if (includesAny(text, ["viral", "bold", "tiktok", "reels", "shorts", "sosyal medya"])) return "Bold Social";

  return "Premium SaaS";
}

export function durationForCategory(category: string, idea: string) {
  const text = idea.toLowerCase();
  if (category === "Documentary") {
    if (includesAny(text, ["10 minute", "10 dakika", "episode", "pilot", "series", "seri"])) return "10 minutes";
    if (includesAny(text, ["5 minute", "5 dakika", "mini documentary", "kısa belgesel", "kisa belgesel"])) return "5 minutes";
    return "2 minutes";
  }
  if (category === "Growth Intelligence") return "Monthly monitoring";
  if (category !== "AI Video") return "Project based";
  if (includesAny(text, ["2 minute", "2 dakika", "uzun"])) return "2 minutes";
  if (includesAny(text, ["60 second", "60 saniye", "1 dakika"])) return "60 seconds";
  if (includesAny(text, ["15 second", "15 saniye", "shorts", "reels", "tiktok"])) return "15 seconds";
  return "30 seconds";
}

export function modeForSuggestion(category: string, idea: string) {
  const text = `${category} ${idea}`.toLowerCase();
  if (includesAny(text, ["e-ticaret sitesi", "e ticaret sitesi", "ecommerce website", "e-commerce website", "storefront", "checkout", "sepet", "mağaza sitesi", "magaza sitesi", "ürün sayfası", "urun sayfasi"])) return "project";
  if (includesAny(text, ["ürün linki", "product link", "ürün reklam", "urun reklam", "product ad", "amazon", "trendyol", "shopify reklam", "woocommerce reklam"])) return "commerce";
  if (includesAny(text, ["tiktok", "instagram", "reels", "youtube shorts", "linkedin", "x/twitter", "sosyal medya", "social", "campaign", "kampanya"])) return "social";
  if (includesAny(text, ["saas", "website", "web sitesi", "mobile", "mobil", "admin panel", "dashboard", "portal", "shopify", "woocommerce", "ecommerce", "e-commerce", "e-ticaret"])) return "project";
  if (includesAny(text, ["documentary", "belgesel", "docuseries", "interview documentary", "archival visuals", "video", "animation", "animasyon", "anime", "manga", "animal", "hayvan", "nature", "doğa", "doga", "planet", "gezegen", "space", "uzay", "studio", "stüdyo", "cinematic", "sinematik", "clipping", "kırp", "avatar", "lip sync", "dudak", "voice clone", "ses klon", "visual clone", "görsel klon", "görsel", "image", "visual", "music", "müzik"])) return "media";
  if (category === "Growth Intelligence") return "project";
  if (includesAny(text, ["document", "doküman", "pdf", "deck", "proposal", "teklif"])) return "document";
  if (includesAny(text, ["brand kit", "marka kiti", "logo"])) return "brand";
  return "general";
}

export function detectActionRoute(idea: string, category: string) {
  const text = idea.toLowerCase();

  if (category === "Growth Intelligence") {
    return { action: "growth_intelligence_brief", route: "/dashboard/growth-intelligence", nextStep: "Growth Intelligence brief ve rakip takip ayarlarını aç" };
  }
  if (includesAny(text, ["kredi", "credit", "bakiye", "balance", "paket satın", "ödeme", "payment", "fatura", "billing", "stripe"])) {
    return { action: "manage_credits", route: "/dashboard/credits", nextStep: "Kredi ve ödeme ekranına git" };
  }
  if (includesAny(text, ["teslim", "indir", "download", "hazır mı", "hazir mi", "hazırlandı mı", "hazirlandi mi", "üretimlerim", "my productions", "siparişlerim", "taleplerim", "durum", "status"])) {
    return { action: "track_delivery", route: "/dashboard/productions", nextStep: "Üretim durumunu ve tek tık teslimatı gör" };
  }
  if (includesAny(text, ["kategori", "categories", "ne yapabilirim", "neler var", "paketler", "pricing", "fiyat"])) {
    return { action: "browse_catalog", route: "/categories", nextStep: "Kategori ve paketleri incele" };
  }
  if (includesAny(text, ["ayar", "settings", "profil", "hesap", "account"])) {
    return { action: "account_settings", route: "/dashboard/settings", nextStep: "Hesap ayarlarını aç" };
  }
  if (includesAny(text, ["materyal", "material", "logo yükle", "dosya ekle", "ürün fotoğraf", "referans ekle", "asset ekle"])) {
    return { action: "add_materials", route: "/dashboard/assistant-workspace", nextStep: "Crelavo materyal kütüphanesi ve üretim seçenekleri panelini aç" };
  }
  if (includesAny(text, ["paylaş", "yayınla", "post at", "sosyal medyaya yükle", "shopify'a yükle", "shopifya yükle", "mail gönder", "email gönder", "otomatik dağıtım"])) {
    return { action: "external_publish", route: "/dashboard/productions", nextStep: "Dış platform yayınlama ve onay akışını aç" };
  }
  if (includesAny(text, ["ülke", "şehir", "ortam", "kültür", "inanç", "din", "hastane", "toplantı", "büro", "ofis", "okul", "mağaza", "restoran", "klinik", "fabrika", "sokak", "ev ortamı", "japonya", "brezilya", "almanya", "arabistan", "amerika", "yerel", "lokal"])) {
    return { action: "context_adaptation", route: "/dashboard/assistant-workspace", nextStep: "Ülke, kültür ve ortam seçenekleriyle üretim başlat" };
  }
  if (includesAny(text, ["admin operasyon", "operasyon", "hata", "failed job", "support", "e-posta kontrol", "admin paneline git", "admin'i aç", "admini aç"])) {
    return { action: "admin_operations", route: "/admin", nextStep: "Operasyon paneline git" };
  }
  if (category === "Growth Intelligence") {
    return { action: "growth_intelligence_brief", route: "/dashboard/growth-intelligence", nextStep: "Growth Intelligence brief ve rakip takip ayarlarını aç" };
  }

  const params = new URLSearchParams({ category, idea, mode: modeForSuggestion(category, idea) });
  return { action: "start_automatic_production", route: `/dashboard/assistant-workspace?${params.toString()}`, nextStep: "Full otomatik üretim seçenekleriyle canlı workspace akışını başlat" };
}
