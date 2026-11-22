# Studio V2 — Nova referans arayüz düzeltmesi

## Kapsam
37 kategorinin tek Studio kabuğu vardır. Kategori seçimi Canvas başlığını, boş durumu ve araçları değiştirir; panel düzenini değiştirmez. B1/B2 konuşma motoru, tarife, Tool Registry, kredi politikası, migration ve auth bileşenleri değişmedi. `/studio-design-test` aynı kaldı. C1 uygulanmadı.

## Canvas
- Boş: çıktı yok; sohbet veya sahip olunan projeyi açma yönlendirmesi.
- Yükleniyor: mevcut kaynağı okuma, yeni üretim değil.
- Hazır: sadece sahip olunan, website türündeki hazır kaydın saklanan HTML dosyaları veya doğrulanmış runtime kaynağı.
- Kullanılamıyor: doğru kaynak yok, henüz hazır değil veya erişilemiyor. Genel teslim builder'ına ve mobil/demo kartlarına fallback yok.

`/api/studio/website-preview` GET-only, bearer auth, user/type filtreleri, rate limit ve sayfa allowlist kullanır. Bakiye/RPC/provider yazımı yapmaz. Runtime kaynağı mevcut kabul/hash/finalization kontrollerinden geçer. Üretilmiş kaynak yoksa yeni HTML örneği oluşturulmaz. İç iframe scriptsiz, formsuz ve bağlantısız salt okunur kalır; sayfalar dış Studio kontrolünden seçilir. Masaüstü/tablet/mobil gerçek iframe viewport genişlikleri 1280/768/390px ve Canvas'a sığdırılmış zoom kullanır.

## Assistant
Mesaj geçmişi ve alt composer ana deneyimdir. Mod açık küçük rozet; krediler iki ayrı küçük gösterge; dil/mod/bağlam varsayılan kapalı açılır ayrıntıda. Bilinen proje alanları okunabilir etiketlerle gösterilir. Dosya seçimi hâlâ upload değildir. Mock sohbet üretim çıktısı yaratmaz. Kategori, mod ve kullanıcı değişiminde Canvas/proje listesi temizlenir. Gecikmiş kategori/proje/sayfa yanıtları ekrana uygulanmaz.

## Dosyalar
- `src/app/dashboard/studio-v2/page.tsx`
- `src/lib/studio-agent/conversation-client.ts`
- `src/lib/studio-agent/studio-view.ts` (yeni ortak UI)
- `src/lib/studio-agent/website-preview.ts` (yeni salt okunur kaynak izdüşümü)
- `src/app/api/studio/website-preview/route.ts` (yeni)
- `scripts/studio-agent-b2-browser.cjs` (UI fixture/okunabilir bağlam etiketlerine uyarlama; işlev/sahiplik/kredi kontrolleri korunur)
- `scripts/studio-v2-reference-ui-regression.cjs` (yeni)
- Bu belge.

## Ücretsiz doğrulama
B1 21 grup; B2 konuşma 20 grup; izole PostgreSQL/RPC 12 grup; mevcut B2 browser suite; yeni UI/API suite (37 kategori, dört Canvas durumu, kaynak/sahiplik, sayfa ve cihazlar, scriptsiz iframe, gecikmiş yanıt izolasyonu, dar ekran); TypeScript.

1280×720 DOM ölçümü: sütunlar 196/744/340px; Canvas 712×432px; mesaj alanı 307×377px; composer ekran altına erişilebilir. 1920×1080 ve 390×844 testleri de vardır. Görsel referans 1280×720 Nova video karesiyle aynı ölçekte karşılaştırılır.

## Görsel farklar ve test sınırı
Bu bir influencer kopyası değildir: referanstaki medya/filmstrip yerine Website boş durumu veya saklanan site kaynağı, sayfa/cihaz araçları vardır. Sol listede gerçek 37 kategori korunur; örnek Nova projesi ve tek toplam kredi göstergesi kopyalanmaz. İkonlar/başlıklar tipografik olarak birebir değildir. Dar ekranda üç panel aynı anda sıkıştırılmaz; panel sekmeleri vardır.

Ekran görüntüleri gerçek Studio UI koduyla kontrollü browser fixture'ında alınır; mock sohbet ve sahte oturum kullanırlar. Test Website dosyaları yalnız fixture'dır; gerçek müşteri üretimi diye sunulmaz. Gerçek ücretli AI/üretim/tahsilat yapılmadı. PGlite çok oturumlu concurrency kanıtı değildir. Gerçek kullanıcı e-posta dönüşü Supabase redirect allowlist'e bağlıdır; auth ayarları değiştirilmedi. Preview deployment auth/API 401 ayrıca kontrol edilir. B2 sonunda kullanıcı değerlendirmesi beklenir.
