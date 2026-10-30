# Crelavo — Phase 1 Category-Aware Assistant Audit

Tarih: 2026-10-30
Dal: phase1/category-aware-analysis
Kapsam: Yalnızca mevcut sistemi analiz eder. CSS, ödeme, Supabase şeması ve mevcut üretim API'leri değiştirilmemiştir.

## 1. Mevcut route ve asistan yüzeyleri

| Giriş | Gerçek route zinciri | Durum |
|---|---|---|
| `/dashboard/create` | `src/app/dashboard/create/page.tsx` → `RequireFreeAccount` → `CreateProductionGate` → `src/components/assistant-work/AssistantPage.tsx` | Aktif ana giriş |
| `/dashboard/assistant-workspace` | `src/app/dashboard/assistant-workspace/page.tsx` → `AssistantPage` | Aynı component'in doğrudan girişi |
| `/dashboard-create` | `src/app/dashboard-create/page.tsx` → redirect → `/dashboard/assistant-workspace` | Legacy redirect; varsayılan kategori `ecommerce` |
| `/assistant` | `src/app/assistant/page.tsx` → redirect → `/dashboard/create` | Kısa alias |

Pages Router karşılığı (`src/pages/dashboard/create.*`) bulunamadı. App Router kullanılıyor.

## 2. Mevcut kategori yönlendirmeleri

Kategori kartları `src/components/CategoryGroupBrowser.tsx` içinden şu biçimde açılıyor:

`/dashboard/create?type=<label>&category=<id>`

Mevcut sistemde kullanılan üretim ID'leri yedi hedef kategoriyle sınırlı değil. Örnekler: `website`, `saas`, `mobile_app`, `campaign`, `video`, `talking_video`, `drone_video`, `brand_kit`, `document_pack`, `image`, `animation`, `live_sales_agent` ve daha fazlası.

`src/lib/assistant-links.ts` mevcut yardımcı eşlemeleri:

- `campaign` → `social`
- `website`, `saas`, `mobile_app`, `admin_project` → `project`
- medya kategorileri → `media`
- `brand_kit` → `brand`
- `document_pack` → `document`
- diğerleri → `general`

Bu nedenle yeni standart ID'ler eski bağlantıları kırmadan canonical katmanda eşlenmelidir.

## 3. Kategori standardı için önerilen canonical eşleme

| Yeni canonical ID | Mevcut ID / sinyal eşlemesi |
|---|---|
| `website` | `website`, `saas`, `admin_project`, `ecommerce` web sitesi sinyalleri |
| `app` | `mobile_app`, mobil uygulama sinyalleri |
| `video` | `video`, `documentary`, `animation`, `drama`, `cinematic_video` ve benzeri görsel üretim sinyalleri |
| `product_ad` | `campaign`, `ecommerce_product_ad`, ürün reklamı ve ürün linki sinyalleri |
| `social_media` | `campaign`, `campaign_calendar`, TikTok/Reels/Instagram/LinkedIn sosyal yayın sinyalleri |
| `ecommerce` | `ecommerce`, `shopify`, `woocommerce`, mağaza/checkout/storefront sinyalleri |
| `ecommerce_kit` | `campaign`, `brand_kit`, `document_pack`, ürün satış materyali ve mağaza kampanyası sinyalleri |

Not: `campaign` mevcut sistemde hem sosyal kampanya hem ürün reklamı hem de commerce akışı için kullanılıyor. Bu ID doğrudan silinmemeli; canonical kategori + alt amaç olarak korunmalı.

## 4. Mevcut asistan başlangıç davranışı

### `src/components/assistant-work/AssistantPage.tsx`

- Query parametrelerini okuyor: `type`, `category`.
- Kategori context'i API çağrılarına gönderiliyor: `category`, `categoryId`, `type`, `packId`, `features`, `extras`.
- Sağ panelde yalnızca sınırlı başlangıç planı var:
  - `website`: site türü, sektör ve fonksiyonlar
  - `video`: ürün, hedef kitle ve platform
  - diğerleri: genel kategori metni
- Bu panel mesajı henüz gerçek bilgi toplama state machine'i değil.
- Session storage anahtarı kategoriye bağlı: `crelavo-aw-session-v3-${type}-${category}`.
- Kategori değişince shot/session state resetleniyor.

### `src/components/AssistantWorkspace.tsx`

Bu component daha geniş ve eski/aktif wizard davranışını taşıyor:

- `categoryOptionProfiles` ile kategoriye özel `quality`, `style`, `duration`, `modules`, `features`, `platforms` seçenekleri var.
- Dynamic wizard, kategoriye göre seçenek panelleri açıyor.
- `productionTypeFromAssistantCategory()` gelen kategori metnini üretim tipine çeviriyor.
- Kullanıcı mesajından plan ve kategori çıkarma davranışı mevcut; fakat serbest metin içinde kategori değişimi yapabildiği için sabit kategori context koruması ayrıca tasarlanmalı.
- `Start Production` sonrası kredi kontrolü ve üretim başlangıcı burada yönetiliyor.

## 5. Gerçek API ve üretim kabiliyetleri

### Assistant/API katmanı

- `/api/assistant`
- `/api/assistant-chat`
- `/api/assistant/plan`
- `/api/assistant/orchestrate`
- `/api/assistant-work`
- `/api/assistant-work/status`
- `/api/assistant-work/library`
- `/api/assistant-work/package`

`/api/assistant-work` şu akışı taşıyor:

1. Auth kontrolü.
2. `category`, `type`, `prompt`, `scene`, `action` okuma.
3. `plan`/preview gibi harcamayan aksiyonları ayırma.
4. Local engine veya media engine seçimi.
5. Gerçek provider ayarlıysa üretim başlatma.
6. `production_requests` kaydı oluşturma.
7. Kredi rezerv/spend kaydı.
8. Output ve teslimat bilgilerini döndürme.

### Gerçek local engine'ler

`src/lib/assistant-work/runLocalEngine.ts` içinde gerçek dosya/copy üretimi bulunan kategoriler:

- `website`
- `saas`
- `mobile_app`
- `admin_project`
- `video_clipping`
- `ad_score_checker`
- `campaign_calendar`
- `document_pack`
- `crelavo_academy`
- `community_showcase`
- `virtual_model_studio`

Bunlar provider çağrısı değil; Crelavo sunucusunda dosya/plan üreten local engine'lerdir.

### Gerçek medya provider katmanı

`src/lib/assistant-work/runMediaEngine.ts`:

- HeyGen yolları: `talking_video`, `avatar`, `lip_sync`, `voice_clone`, `live_sales_agent`, `ai_agent`, `localization`.
- MiniMax yolları: `video`, `documentary`, `animation`, `music_video`, `drama`, `cinematic_video`, `video_tools`, `campaign`, `image`, `brand_kit`, `visual_clone` ve diğer medya kategorileri.
- Video fallback: Runway ve FAL, ilgili environment key'leri varsa.
- Provider yapılandırılmamışsa `engine_not_configured` / benzeri gerçek hata döndürülüyor; var olmayan üretim yapılmış gibi davranılmıyor.

## 6. Kredi ve teslimat bağlantıları

- Kullanıcı kredi bakiyesi: `credit_balances`.
- Assistant kredileri: `assistant_credit_balances`.
- Üretim kaydı: `production_requests`.
- Job kaydı: `production_jobs`.
- Kredi hareketleri: `credit_ledger`.
- `/api/credits`, `/api/credits/balance`, `/api/credits/spend`.
- Üretim başlatma öncesi `production-ready-gate`, `production-dispatch-gate`, `production-profit` ve provider readiness kontrolleri var.
- Teslimat: `production_requests` içindeki `delivery_link`, `delivery_zip_url`, `preview_url`, `output_json`; ayrıca `/api/productions/[id]/delivery` ve dashboard productions ekranı.
- Reservation/spend/refund mantığı server tarafında mevcut; client kredi tutarını güvenilir kaynak olarak kullanmamalı.

## 7. Eksik veya hatalı davranışlar

1. Yedi hedef kategori için tek bir canonical ID sözlüğü yok.
2. `campaign` birden fazla amaca hizmet ediyor; product ad ve social media ayrımı açık değil.
3. `AssistantPage` başlangıç metni kategoriye duyarlı görünse de eksik bilgi toplama state machine'i yok.
4. Kategori context'i API payload'ında taşınıyor, fakat serbest metin analizinin kategori değiştirmesini engelleyen açık bir `lockedCategory` kuralı yok.
5. Plan, kredi tahmini, kullanıcı onayı ve gerçek üretim adımları mevcut parçalarda bulunuyor; bunlar tek bir kategori sözleşmesi olarak birleşmiş değil.
6. `dashboard-create` legacy route'u varsayılan olarak `ecommerce` gönderiyor; bu davranış korunmalı veya açıkça legacy olarak belgelenmeli.
7. `AssistantPage` ile `AssistantWorkspace` aynı ürünün iki ayrı UX/akış katmanı. İlk MVP için hangisinin canonical assistant surface olduğu kesinleştirilmeli.
8. Mevcut local engine çıktıları çoğunlukla starter/source dosyalarıdır; canlı hosting, app-store, domain veya ödeme kurulumu yaptıkları varsayılmamalı.
9. Provider key'leri ve model readiness gerçek environment durumuna bağlıdır; bu rapor yalnızca kod desteğini kanıtlar, production key varlığını kanıtlamaz.

## 8. İlk uçtan uca MVP adayı

**Website (`website`)** en uygun ilk MVP adayıdır.

Gerekçe:

- Local engine doğrudan dört HTML sayfası, CSS ve README üretebiliyor.
- API akışı, production kaydı, kredi ve ZIP teslimatı mevcut.
- Harici provider beklemeden uçtan uca test edilebilir.
- Kullanıcı soruları doğal biçimde sınırlanabilir: site türü, sektör, sayfalar, tasarım, CTA/iletişim ve içerik kaynakları.
- Gerçek teslimat biçimi nettir: kaynak dosyaları + README + ZIP.

Önerilen website MVP akışı:

1. Kullanıcı `website` kategorisinden gelir; kategori kilitlenir.
2. Açılış: “Merhaba! Web siteni birlikte oluşturalım. Öncelikle nasıl bir web sitesi istiyorsun: kurumsal, e-ticaret, hizmet veya kişisel?”
3. Her cevap sonrası yalnızca eksik alanlardan bir sonraki soru sorulur.
4. Tüm zorunlu alanlar tamamlanınca plan + teslimatlar + tahmini kredi gösterilir.
5. Açık kullanıcı onayı alınmadan local engine veya kredi harcaması başlatılmaz.
6. Onay sonrası mevcut `website` local engine çalışır, `production_requests` kaydı açılır ve ZIP teslim edilir.

## 9. İlk aşamada değiştirilmemesi gerekenler

- `src/app/globals.css`
- Supabase schema ve migrations
- Mevcut provider çağrıları
- Kredi hesaplama/reservation/spend mekanizması
- Ödeme ve deployment ayarları
- Mevcut route'ların geriye dönük çalışması

## 10. Sonuç

Altyapı, kategoriye duyarlı bir Production Manager için yeterli parçaya sahip; fakat canonical kategori sözleşmesi ve bilgi toplama state machine'i eksik. İlk kodlama aşaması bütün kategorileri aynı anda değiştirmek yerine `website` MVP'sini, mevcut local engine ve teslimat hattını bozmadan canonical category context ile birleştirmelidir.
