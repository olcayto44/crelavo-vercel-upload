# Studio V2 — B1 sözleşmeleri

Bu dizin yalnızca B1 kapsamıdır. Studio arayüzüne veya API rotalarına bağlı değildir.
Gerçek LLM, DB, üretim, bakiye yazımı, migration ve deploy içermez. B2/C1/C2/C3 uygulanmadı.

## Dosyalar

- `requirements.ts`: kanonik 37 kategori/katalog ve mevcut soru yapılandırmasının salt okunur izdüşümü; kategoriye özel strict brief alanları, kritik eksikler, opsiyonel alanlar, varsayılan önerileri, referans gereksinimleri.
- `intent.ts`: kategoriye bağlı niyet/brief/araç önerisi; eski bilgiyi koruyan patch; kategori değişikliği yalnızca öneridir.
- `tool-registry.ts`: strict Zod aksiyon/parametre şemaları, merkezi kategori/scope/sahiplik/onay politikaları ve kapalı yürütme kapısı.
- `billing-policy.ts`: Assistant / Production / ücretsiz işlem ayrımı. Fiyat hesaplama, grant, transfer, fallback veya gerçek bakiye işlemi yok.
- `scripts/studio-agent-b1-smoke.cjs`: ücretsiz, deterministik mock model testleri; gerçek modülleri yükler, `fetch` çağrısını yasaklar.

## Gereksinim sözleşmesi

Her kategori mevcut extra-field ID/seçeneklerini ve tüm soru ID'lerini korur; yeni alanların `sourceIds` bilgisi eski soruya bağlanır. Paket fiyatları değiştirilmez.

`evaluateRequirements` verilen alanları yeniden sormaz; `missing` yalnızca kritik alanları ve gerekli sunucu kanıtlarını içerir. `nextQuestion` bunların ilkidir. Genel proje açıklaması `brief` alanıdır; ayrıca kategoriye özgü kritik alanlar vardır. Diğer soru alanları opsiyoneldir.

Varsayılanlar yalnızca `proposedDefaults` olarak sunulur. Sunucu doğrulamalı `acceptedDefaults` olmadan uygulanmaz; verilmiş değerlerin üzerine yazılmaz. Örnek sektör, kimlik, kullanım izni veya içerik dili varsayılan sayılmaz. Boş/null alan ile eski veri silme desteklenmez.

Referans alanları en fazla 10 UUID kabul eder. Sahiplik ve dosya türü `ownedReferenceIds` / `referenceKinds`, kullanım izni `referencePermissionConfirmed` üzerinden sunucudan gelmelidir. Model brief'i consent/permission/approval alanlarını belirleyemez. URL başlangıcı HTTPS bağlantısı ister; URL çözümleme/indirme yapılmaz. Gelecek adapter ayrıca SSRF ve sahiplik kontrollerini uygulamalıdır.

`briefComplete: true` sadece brief'in yeterli olduğu anlamına gelir. **`executionReady` B1'de her zaman false.** Proje bazlı DB hafızası ve doğal dilde gerçek bilgi çıkarımı B2'ye aittir; mock testleri bunların çalıştığına dair iddia değildir.

## Araçların durumu

Yalnızca `get_category_capabilities` yerel olarak çalışır; katalog ve araç sözleşmelerini döndürür.

Mevcut Website API yeteneklerine dayanan ama B1'de bağlanmamış araçlar:

- Bakiye okuma; kayıtlı Website projelerini listeleme ve durum okuma.
- Website brief/plan hazırlama; güncel plan hash'i ile onaylı üretim.
- Kayıtlı sayfa önizlemesi ve ZIP/preview teslimi.
- Desteklenen metin/liste/SSS içerik alanları, sürüm geçmişi ve açık onaylı geri alma.
- Sahip olunan Website referansını ekleme.

B1 içerik patch'i mevcut `website-content.ts` anahtarlarının sınırlı alt kümesini kullanır: `heroTitle`, `heroBody`, `primaryCta`, site/about/contact metinleri, SEO/footer, mevcut feature/pricing/workflow/nav listeleri ve SSS. Genel CSS/HTML/JS, görsel URL veya yayın ayarları kabul edilmez. Mevcut sistemin diğer ayarları otomatik bağlanmış değildir.

Planlanan, henüz desteklenmeyen araçlar:

- Proje bağlamı/hafızası ve agent üzerinden onay isteği.
- `update_website_design`: renk, başlık boyutu, buton, bölüm, görsel, sayfa ve responsive düzen komutları. Bunlar yalnızca sınırlı tipli öneri şemalarıdır; kalıcı tasarım dokümanı, compiler, ücret politikası ve C3 adapter'ı yoktur.
- Website dışındaki kategoriler katalog/soru sözleşmesine sahiptir; agent üretim executor'ı yoktur.

`executeB1Tool` yerel kategori okuması dışında her çağrıyı `tool_adapter_not_connected` veya `tool_not_supported_yet` ile reddeder. Doğrulanmış üretim onayı bulunsa da üretim başlatamaz. Gelecek adapter enjekte etmeye yarayan parametre yoktur.

## Güven ve muhasebe sınırı

`ServerToolContextSchema` **kimlik doğrulama yapmaz**. B2 adapter'ı oturum/sahiplik verisini doğrulayıp bu bağlamı sunucuda kurmalıdır. Model/istemci JSON'u bu bağlama aktarılmaz. Sahte `source` etiketi güvenli kimlik doğrulamanın yerine geçmez.

Model yalnızca niyet, brief patch ve araç önerisi verebilir. Kullanıcı ID'si, yetki, kredi tutarı/wallet, onay ve sunucu context'i model aksiyonunda strict şemayla reddedilir. Üretim doğrulamasında açık onay proje/kategori/güncel hash/Production hesabıyla eşleşmelidir; bu B1 sözleşmesi imzalama, DB onay kaydı veya atomik muhasebe uygulaması değildir.

- Assistant: sohbet, analiz, brief çıkarımı, planlama; ileride aynı konuşma request'i başına tek settlement. Araç önerisi ayrıca otomatik tahsilat yapmaz.
- Production: Website/image/video/audio/app üretimi ve ücretli revizyon/render/upscale/extend; sunucu tarifesi ve açık onay gerekir.
- Mevcut provider çağırmayan içerik düzenleme/geri alma ve proje/önizleme/teslim okuma sözleşmeleri ücretsizdir. Ücretli revizyonla karıştırılmaz.
- Hesaplar arasında fallback/transfer/toplam yok; başlangıç hakkı veya mevcut kullanıcı bakiyesi değiştirilmez.

## Doğrulama

```sh
node scripts/studio-agent-b1-smoke.cjs
npm exec -- tsc --noEmit --incremental false --pretty false
```

Mock testleri 37 kategori/soru/paket korunumu, tekrar soru sormama, varsayılan kabulü, kategori izolasyonu, brief patch, model enjeksiyonu, referans kanıtları, wallet ayrımı, sahiplik/onay/hash kontrolleri ve tüm uzak araçların kapalı olduğunu doğrular. Gerçek sağlayıcı veya canlı DB testi değildir; concurrency/atomik tahsilat kanıtı üretmez.

Sonraki çalışma B2'dir; ayrıca onay olmadan başlanmaz. Mevcut UI, eski Assistant ve üretim API'leri bu değişiklik kapsamında düzenlenmedi. Commit/push/deploy yapılmadı.