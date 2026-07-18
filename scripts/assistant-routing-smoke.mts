import { detectActionRoute, detectCategory, modeForSuggestion } from "../src/lib/assistant-routing.mts";

type Case = {
  idea: string;
  category: string;
  mode: string;
  routeIncludes: string[];
};

const cases: Case[] = [
  {
    idea: "Rakiplerimi ve fiyat değişikliklerini takip eden Growth Intelligence raporu istiyorum",
    category: "Growth Intelligence",
    mode: "project",
    routeIncludes: ["/dashboard/growth-intelligence"]
  },
  {
    idea: "E-ticaret sitesi istiyorum, Shopify tarzı ürün sayfası ve sepet olsun",
    category: "Website",
    mode: "project",
    routeIncludes: ["category=Website", "mode=project"]
  },
  {
    idea: "Ürün linkinden TikTok reklam videosu yap",
    category: "Text-to-Campaign",
    mode: "commerce",
    routeIncludes: ["category=Text-to-Campaign", "mode=commerce"]
  },
  {
    idea: "Mobil uygulama istiyorum, Expo kaynak dosyası ve admin panel olsun",
    category: "Mobile App",
    mode: "project",
    routeIncludes: ["category=Mobile+App", "mode=project"]
  },
  {
    idea: "Uzun videoyu kırp, en heyecanlı ve komik sahneleri Shorts yap",
    category: "Video Clipping",
    mode: "media",
    routeIncludes: ["category=Video+Clipping", "mode=media"]
  },
  {
    idea: "Kendi avatarımı tasarlamak ve istersem video yapmak istiyorum",
    category: "Avatar Design / Avatar Video",
    mode: "media",
    routeIncludes: ["category=Avatar+Design+%2F+Avatar+Video", "mode=media"]
  },
  {
    idea: "Görselden video üret ve hareket kontrolü olsun, filigransız çıktı ver",
    category: "Video Tools",
    mode: "media",
    routeIncludes: ["category=Video+Tools", "mode=media"]
  },
  {
    idea: "Dudak senkronizasyonu ile avatar konuştur",
    category: "Lip Sync Video",
    mode: "media",
    routeIncludes: ["category=Lip+Sync+Video", "mode=media"]
  },
  {
    idea: "Yapay zeka tarihi hakkında 5 dakika belgesel hazırla",
    category: "Documentary",
    mode: "media",
    routeIncludes: ["category=Documentary", "mode=media"]
  },
  {
    idea: "Kısa film için fragman ve teaser hazırla",
    category: "Studio / Series-Film",
    mode: "media",
    routeIncludes: ["category=Studio+%2F+Series-Film", "mode=media"]
  },
  {
    idea: "Anime short film üret, karakterler konuşsun ve çocuk sesi seçeneği olsun",
    category: "Anime Short Film",
    mode: "media",
    routeIncludes: ["category=Anime+Short+Film", "mode=media"]
  },
  {
    idea: "Komik hayvan videosu yap, kendi seslendirmem ve arka fon müziği olsun",
    category: "Animal Video",
    mode: "media",
    routeIncludes: ["category=Animal+Video", "mode=media"]
  },
  {
    idea: "Doğa videosu hazırla, sinematik müzik ve anlatım olsun",
    category: "Nature Video",
    mode: "media",
    routeIncludes: ["category=Nature+Video", "mode=media"]
  },
  {
    idea: "Gezegen videosu ve 3D uzay sahnesi yap",
    category: "Planet / Space Video",
    mode: "media",
    routeIncludes: ["category=Planet+%2F+Space+Video", "mode=media"]
  }
];

for (const item of cases) {
  const category = detectCategory(item.idea);
  const mode = modeForSuggestion(category, item.idea);
  const actionRoute = detectActionRoute(item.idea, category);

  if (category !== item.category) {
    throw new Error(`Category mismatch for "${item.idea}": expected ${item.category}, got ${category}`);
  }
  if (mode !== item.mode) {
    throw new Error(`Mode mismatch for "${item.idea}": expected ${item.mode}, got ${mode}`);
  }
  for (const part of item.routeIncludes) {
    if (!actionRoute.route.includes(part)) {
      throw new Error(`Route mismatch for "${item.idea}": expected route to include ${part}, got ${actionRoute.route}`);
    }
  }
}

console.log("assistant-routing-smoke ok");
