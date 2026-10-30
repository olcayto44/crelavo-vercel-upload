# Crelavo — Phase 2 Website MVP Implementation Plan

Tarih: 2026-10-30
Önkoşul: `docs/category-aware-assistant-phase1-report.md`
Kapsam: Website kategorisini ilk uçtan uca MVP olarak canonical kategori akışına bağlamak.

## Hedef

Kullanıcı `/dashboard/create?category=website` girişinden geldiğinde kategori değişmeden korunacak; asistan yalnızca website üretimi için gerekli bilgileri toplayacak; plan, kredi tahmini ve kullanıcı onayı tamamlanmadan üretim başlatılmayacak; onaydan sonra mevcut website local engine ve mevcut teslimat hattı kullanılacak.

## Değiştirilecek alanlar

### 1. Canonical kategori sözlüğü

Yeni küçük bir yardımcı modül oluşturulacak veya mevcut kategori kataloğuna eklenerek şu değerler tek kaynaktan yönetilecek:

- `website`
- `app`
- `video`
- `product_ad`
- `social_media`
- `ecommerce`
- `ecommerce_kit`

Her canonical kategori için:

- görüntüleme adı,
- desteklenen legacy ID'ler,
- gerekli intake alanları,
- üretim tipi,
- preview/plan endpoint davranışı,
- gerçek üretim endpoint'i,
- teslimat tipi

tanımlanacak.

İlk implementasyon yalnızca `website` kaydını aktif hale getirecek; diğerleri geriye dönük uyumluluk için tanımlı kalacak.

### 2. Kategori kilidi

`AssistantPage` ve ilgili assistant-work payload'larında:

- URL'den gelen canonical kategori bir kez çözümlenecek.
- `lockedCategory` session state içinde tutulacak.
- Kullanıcının serbest metni kategori kilidini değiştirmeyecek.
- Kullanıcı başka kategori istediğinde üretim akışı sessizce değişmeyecek; açık kategori değiştirme eylemi gösterilecek.
- Legacy `type` / `category` değerleri canonical kategoriye normalize edilecek.

Bu değişiklik mevcut route'ları kaldırmadan yapılacak.

### 3. Website intake state machine

Website için eksik alanlar sıralı ve deterministik toplanacak:

1. Site amacı / türü
2. Sektör veya iş alanı
3. Hedef müşteri
4. Gerekli sayfalar
5. Ana CTA ve iletişim yöntemi
6. İçerik kaynağı veya kullanıcı tarafından sağlanacak metin
7. Görsel yönlendirme / marka notu

Her adımda yalnızca bir sonraki eksik bilgi sorulacak. Kullanıcı mevcut cevabında birden fazla alan verirse zaten tamamlanan alanlar tekrar sorulmayacak.

### 4. Plan ve onay kapısı

Tüm zorunlu alanlar tamamlandığında:

- üretilecek sayfalar,
- oluşturulacak dosyalar,
- tahmini kredi maliyeti,
- teslimat biçimi,
- varsa eksik/varsayılan içerikler

tek bir plan kartında gösterilecek. Kullanıcı açıkça onaylamadan `start` / production dispatch çağrısı yapılmayacak.

Plan çağrısı ile gerçek üretim çağrısı ayrıştırılacak. Client-side kredi değeri yalnızca gösterim amaçlı olacak; server-side reservation/spend kaynak olarak kalacak.

### 5. Mevcut website engine'e bağlama

Mevcut `website` local engine korunacak. Yeni akış yalnızca aşağıdaki doğrulanmış sözleşmeyle çağıracak:

- canonical `categoryId: website`,
- normalize edilmiş website intake payload'ı,
- kullanıcı onay kaydı,
- mevcut auth ve kredi kontrolleri.

Engine'in ürettiği HTML/CSS/README/ZIP teslimat formatı değiştirilmeyecek.

### 6. Teslimat ve hata durumu

Üretim tamamlandığında mevcut `production_requests` ve delivery endpoint'leri kullanılacak. UI şu durumları birbirinden ayıracak:

- plan hazır,
- kullanıcı onayı bekleniyor,
- üretim başladı,
- üretim tamamlandı,
- provider/engine yapılandırılmamış,
- kredi yetersiz,
- üretim başarısız.

Başarısız üretimde kredi refund davranışı mevcut server mantığına bırakılacak; client yeni refund yapmayacak.

## Değiştirilmeyecekler

- `src/app/globals.css`
- Supabase schema ve migration'lar
- mevcut provider adapter'ları
- mevcut kredi reservation/spend/refund mantığı
- ödeme ve deployment ayarları
- legacy route'lar
- mevcut ZIP/preview delivery formatı

## Test planı

Kod değişikliğinden sonra, en sonda çalıştırılacak testler:

1. TypeScript/build kontrolü.
2. Mevcut assistant routing smoke testi.
3. Website query parametresiyle başlangıç testi.
4. Website intake alanlarının sıralı ilerleme testi.
5. Kategori kilidi testi; serbest metinle kategori değişmemeli.
6. Plan aşamasında production dispatch yapılmadığı testi.
7. Onay sonrası local website engine çağrısı testi.
8. Kredi yetersizliği ve engine hata yolları testi.
9. ZIP/delivery response ve dashboard link testi.
10. Legacy route geriye dönük uyumluluk testi.

## Uygulama sırası

1. Canonical kategori normalize yardımcıları.
2. Website intake state modeli ve reducer/helper testleri.
3. AssistantPage kategori kilidi ve intake akışı.
4. API payload doğrulaması.
5. Plan/onay/dispatch ayrımı.
6. Website engine entegrasyonu.
7. Teslimat ve hata UI'sı.
8. Testler ve diff incelemesi.

## Açık kararlar

- Website intake alanlarının varsayılan metinleri ürün dilinde mi, yoksa yalnızca kullanıcı girdisiyle mi doldurulacak?
- Kullanıcı website akışı içinde açıkça başka kategori istediğinde kategori değiştirme modalı mı, yoksa yeni assistant session mı açılacak?
- İlk MVP'de görsel yükleme/brand asset desteği zorunlu mu, yoksa sonraki iterasyona mı bırakılacak?

Bu kararlar netleşmeden provider veya Supabase katmanında değişiklik yapılmamalı.
