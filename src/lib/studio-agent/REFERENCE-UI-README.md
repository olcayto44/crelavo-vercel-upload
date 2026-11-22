# Studio V2 — Nova referans arayüz düzeltmesi

## Kapsam
37 kategorinin tek Studio kabuğu vardır. Kategori seçimi Canvas başlığını, boş durumu ve araçları değiştirir; panel düzenini değiştirmez. Tarife, store/RPC atomik akışı, Tool Registry, kredi politikası, migration ve auth bileşenleri değişmedi. B1 chat sınıfının brief yazması reddedilir; B2 küçük Mock niyet ayrımı ve doğal yanıt/soru sunumu güncellendi. `/studio-design-test` aynı kaldı. C1 uygulanmadı.

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

1280×720 DOM ölçümü: sütunlar 196/744/340px; Canvas 668×371px (yan araçlar ve alt çalışma alanı dahil yeni düzen); mesaj alanı 307×374px; composer ekran altına erişilebilir. 1920×1080 ve 390×844 testleri de vardır. Website, AI Video ve AI Character için güncel kayıtla aynı 1918×1012 çözünürlükte test görüntüleri alınır. Önceki 1280×720 karşılaştırması önceki revizyona aittir.

## Görsel farklar ve test sınırı
Bu bir influencer kopyası değildir: referanstaki medya/filmstrip yerine Website boş durumu veya saklanan site kaynağı, sayfa/cihaz araçları vardır. Sol listede gerçek 37 kategori korunur; örnek Nova projesi ve tek toplam kredi göstergesi kopyalanmaz. İkonlar/başlıklar tipografik olarak birebir değildir. Dar ekranda üç panel aynı anda sıkıştırılmaz; panel sekmeleri vardır.

Ekran görüntüleri gerçek Studio UI koduyla kontrollü browser fixture'ında alınır; mock sohbet ve sahte oturum kullanırlar. Test Website dosyaları yalnız fixture'dır; gerçek müşteri üretimi diye sunulmaz. Gerçek ücretli AI/üretim/tahsilat yapılmadı. PGlite çok oturumlu concurrency kanıtı değildir. Gerçek kullanıcı e-posta dönüşü Supabase redirect allowlist'e bağlıdır; auth ayarları değiştirilmedi. Preview deployment auth/API 401 ayrıca kontrol edilir. B2 sonunda kullanıcı değerlendirmesi beklenir.


## Çalışma alanı bileşenleri — ikinci düzeltme
- Altı ortak işlem: Create, Edit, Enhance, Upscale, Translate, Export. Üretim/düzenleme bağlı olmadığından açıkça disabled; salt okunur görünüm, sekme, dosya seçme ve sohbet kontrolleri kullanılabilir.
- Yeni workspace.ts katmanı sadece sunumdur: video 16:9 boş önizleme, disabled oynatıcı, sıfır klip/ses timeline, boş varyasyon/medya; Website sayfa/cihaz/tasarım çalışma alanı; karakter kimlik/poz/görünüm boş referansları.
- Website Preview/Pages/Design/Assets/History; video Canvas/Variants/Timeline/Assets/Details; image Canvas/Variations/Layers/Assets. Bağlı olmayan Design/History/Layers disabled, fake geçmiş veya katman üretilmez.
- 37 kategori aynı kabuktadır. Altı açılır grup, dikey kaydırma ve yatay taşma kontrolleri vardır. AI Character, mevcut visual_clone ID'sinin görünür çalışma alanıdır; yeni kategori eklenmedi.
- Mock turn ayrımı sınırlı deterministik kurallardır, gerçek doğal dil modeli değildir. Selam/teşekkür/genel soru brief alanlarını değiştirmez; açık bilgi/tercih değişikliği kanonik ve alıntı kanıtlı kaydedilir; üretim komutu daima bloklanır. Bilinmeyen mesaj chat kalır. Teknik değerler doğal etiketlerle gösterilir.
- Snapshot revision, B2 atomik settlement için konuşma sürümüdür; selamda ilerleyebilir, brief alanları değişmez. SQL/RPC sürüm sözleşmesi korunur.
- B1 21 + B2 20 + izole SQL 12 + yeni Mock 12 = 65 test grubu; B2 browser ve genişletilmiş UI suite ayrıca. Görüntüler kontrollü fixture, canlı kullanıcıya ait Demo Dijital çıktısı değildir.
- Gerçek AI, Assistant Credits muhasebesinin canlı doğrulaması, plan/onay ve gerçek üretim zinciri sonraki ayrı aşamadır; bu çalışma bunları etkinleştirmez. Production config/deploy/migration/bakiye değişikliği yapılmaz.
