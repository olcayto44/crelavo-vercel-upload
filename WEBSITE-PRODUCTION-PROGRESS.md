# Website Production Manager — geliştirme durumu

Dal: feature/website-production-manager. Production deploy/push yapılmadı.

## Uygulanan temel
- Ortak motor üzerinden isteğe bağlı müşteri runtime kaynakları. Sadece WEBSITE_RUNTIME_DEVELOPMENT=1 ve VERCEL_ENV!=production koşulunda üretilir; satıştaki admin paketi açılmadı.
- Bağımsız Node.js 22.13+ / SQLite projesi; Crelavo veritabanı ve anahtarları kullanılmaz.
- Owner/editor, scrypt parola özeti, HttpOnly/SameSite oturum, origin ve CSRF kontrolü, giriş deneme sınırı.
- Sayfa/block, menü sırası, içerik/katalog CRUD, tema/logo/font, görsel kütüphanesi, kullanıcı editörü.
- Film kategori/yıl/ülke filtreleme ve kalıcı katalog kayıtları; diğer sektörler şimdilik yalnız veri koleksiyonu, tamamlanmış iş akışı değil.
- Migration, seed, .env.example, kurulum/yedekleme rehberi. ZIP runtime dosyalarını korur, generic starter ile üstüne yazmaz.
- Builder runtime üretimini acceptance_pending olarak saklar; test/Preview olmadan ready vermez.

## Yerel doğrulama
npm run smoke:website-runtime gerçek üretilmiş kaynakları geçici klasörde çalıştırır. JS syntax, SQLite, admin login, auth/CSRF, CRUD, kayıt sürümü çakışması, public yansıma/filtre, bozuk görsel reddi ve restart sonrası kalıcılık geçti.
Mevcut website assistant, content, generation-quality, automatic-delivery ve delivery-package testleri geçti. Crelavo production build geçti. Bu müşteri projesi için tarayıcı/mobil kalite kabulü değildir.

## Tamamlanmayanlar — teslim hazır değil
- İzole uzak runtime Preview sağlayıcısı/provisioning, müşteri başına persistent storage, Preview erişim politikası ve yaşam döngüsü.
- Assistant ve Builder için tek iş kaydı/onay/kredi yürütme akışı; runtime henüz Assistant üretiminde etkin değil.
- Tasarımı brief'e göre özgün oluşturan bölüm üretimi; runtime public sayfaları şimdilik temel düzen.
- Ödeme/checkout, rezervasyon çakışma ve takvim, müşteri üyelik/favori, öğrenci erişim sistemi; katalog CRUD bunların yerine sayılmaz.
- Tam kaynak kodu revizyonu ve runtime veri revizyonlarının Crelavo geçmişiyle eşleşmesi.
- Browser/mobile, başarılı gerçek görsel yükleme, temiz ZIP kurulum ve tüm rol/iş akışı kabul testleri.
- Güncel paket/fiyat onayı. Fiyat değişmedi.

## Altyapı kararı
Remote Preview için güvenli container/VM veya eşdeğer izole uygulama çalıştırma ve persistent disk gerekiyor. Vercel frontend/serverless ortamı tek başına bu SQLite runtime'ını barındırmaz. Harici hesap/sağlayıcı seçimi ve yetki olmadan bir Preview URL'si oluşturulmuş gibi raporlanamaz.

## İkinci geliştirme turu
- Sektörden bağımsız runtimeSchema eklendi: doğrulanmış koleksiyon/alan/gizlilik tanımı ile film dışı, örneğin laboratuvar ekipmanı kataloğu üretilebilir. Şema henüz AI ihtiyaç analizinden otomatik oluşturulmuyor; API geliştirme sözleşmesi hazır.
- Gerçek müşteri admininde sürüm geçmişi/geri alma, medya yükleme başarı testi ve editor rol erişim testi eklendi.
- Gizli koleksiyonlar public API'ye açılmıyor; ders içeriği öğrenci yetkisi kurulana kadar private. Public API yalnız şemada bildirilen alanları döndürüyor.
- Kayıt versiyonuna bağlı kabul kontrolü tanımlandı; önceki sürüm testleri yeni sürümü onaylamaz. Ancak otomatik kabul worker'ına ve teslimat sonlandırmasına henüz bağlanmadı; bu yeni kontrol tek başına uçtan uca entegrasyon değildir.
- Uzak Preview sağlayıcısı ve hesap/kalıcı disk henüz yok. Ortamda sağlayıcı erişimi doğrulanmadığından Preview ve Production deploy yapılmadı.
- Tek üretim işi, AI kaynak revizyonu, iş akışı entegrasyonları ve mobil tarayıcı kabulü tamamlanmadı. Runtime development flag arkasında kaldı.

## Ortak akış ve ihtiyaç planı turu
- Assistant ve Builder aynı executeWebsiteRequest adaptörünü ve handleWebsiteAssistant durum makinesini kullanır. Builder ayrı production insert/ücretsiz ready yolunu kullanmaz. Plan, açık onay ve ayrı üretim başlatma adımı gösterilir. Paketler aynı katalogdan gelir. Mevcut proje kimliği korunur.
- Geliştirme modunda /api/websites/blueprint; aynı kullanıcıya ait ortak website brief'inden gerçek AI yanıtıyla sektör bağımsız veri/sayfa/özellik planı üretir. Şema, public/private erişim ve plan hash'i doğrulanır. Kaydetme CAS ile korunur. Henüz UI ve runtime üretim işine bağlı değildir.
- Blueprint eklenen projede statik üretime sessiz düşüş engellenir; runtime kabulü beklenirken kredi harcayıp hazır teslim edilmez.
- Önceki geliştirme runtime yolu ayrı Builder endpoint'i kaldırıldığından şu anda yalnız doğrudan motor geliştirme/test çağrısı üzerinden kullanılabilir. Otomatik runtime üretimi halen tamamlanmadı.
- İzole Preview sağlayıcısı, otomatik kabul worker'ı, tam kaynak revizyonu ve gerçek checkout/booking/membership iş akışları halen eksik. Tüm ürün tamamlandı iddiası yok.

## Push sonrası yeni çalışma
- 180b4a2 geliştirme dalına pushlandı, main/Production değiştirilmedi.
- Yeni compileRuntimeBlueprint onay hash kontrolüyle sektör bağımsız planı runtime sayfa/block/koleksiyon kaynaklarına çevirir. Private koleksiyonlar ziyaretçi sayfasına bağlanmaz. Sabit içerik hash ile artifactVersion oluşturulur.
- Geliştirme blueprint API compile eylemi: aynı sahip/proje/CAS, açık approve ve blueprintHash ister. Statik brief değişince eski plan derlenemez. Runtime artifact ve önceki 5 artifact ayrı saklanır; mevcut statik çıktı üzerine yazılmaz, kredi harcanmaz, ready verilmez.
- Derleme burada kaynak üretimi anlamındadır; çalışan uzak build/Preview ve kabul testi anlamına gelmez. Bu son tur henüz pushlanmadı.

## Setup entegrasyonu
- Sadece geliştirme ortamında Setup içinde AI planı, kullanıcı plan revizyonu, onay/hash ile kaynak üretimi ve kayıtlı plan/artifact durum sorgusu eklendi. Production flag kilidi korunur.
- Plan revizyonuna önceki blueprint gönderilir; açıkça değişmeyen gereksinimleri koruma talimatı verilir. Bu tam kaynak kodu/veritabanı migration revizyonu değildir.
- API rotası için Production kilidi, kullanıcı sahipliği, açık onay, CAS çakışması ve eski plan/artifact durumları mock testte doğrulandı.
- Tamamlanmayanlar: uzak Preview hesabı/sağlayıcısı, çalışma ortamı, ödeme/rezervasyon/üyelik süreçleri, özgün tasarım/kod revizyonu, mobil browser ve temiz ZIP kabul worker. Yeni eklemeler pushlanmadı.

## İş süreçleri, gerçek tarayıcı ve teslim kilidi turu — yerel geliştirme
- Blogun canlı düzeltmesi main dalından bu geliştirme dalına birleştirildi; website geliştirmesi Production'a alınmadı.
- Onaylı blueprint workflows ile sektör bağımsız müşteri hesapları, owner kontrollü özel koleksiyon grant/revoke, tek kaynak için UTC aralık rezervasyonu, müsaitlik sorgusu, çakışma ve müşteri sahipliği kontrolleri üretilebilir. Hesap/admin oturumları ve tabloları ayrıdır.
- Sepet fiyatı sunucu kayıtlarından hesaplanır; tamsayı küçük para birimi, opsiyonel stok ayırma, idempotent sipariş ve Stripe Checkout API adaptörü eklendi. Yalnız tutar/para birimi/session eşleşen imzalı webhook paid yapar; iptal/başarısız event stok ayırmayı yalnız bir kez geri alır. Gerçek Stripe hesabı ve test-mode/live uçtan uca ödeme kabulü YAPILMADI.
- /account müşteri giriş, üyelik içeriği, rezervasyon ve sepet; /business-admin owner erişim yönetimi ve sipariş/rezervasyon görünümü eklendi.
- Dockerfile, kalıcı volume, non-root/read-only uygulama, kaynak limitleri, HTTPS ve parola korumalı Caddy Preview tarifi üretime eklendi. Bu makinada Docker yok; Docker dağıtımı test edilmedi ve uzak Preview oluşturulmadı. Parolalı Preview webhook'a da kapalı; gerçek ödeme için ayrıca erişim politikası gerekir.
- Teslim API'sine mevcut plan, kaynak hash'i, kabul durumu, bütün gerekli yetenekler, aynı sürüm testleri ve çalışan HTTPS Preview kontrolü bağlandı. Eksik runtime projesi eski/statik ZIP'e düşmez; admin de bu kilidi atlayamaz.
- Gerçek üretilen teslim ZIP'i bağımsız unzip kütüphanesiyle temiz klasöre açıldı ve byte-byte kaynak eşleşmesi doğrulandı; Node/SQLite çalıştırıldı. Gerçek Chromium'da masaüstü müşteri giriş/sepet/ödeme yönlendirmesi ve mobil menü/hesap/taşma/JS hata kontrolleri geçti. Ödeme sağlayıcı HTTP isteği testte mock'tur.
- API, auth/CSRF, özel veri erişimi, grant/revoke, iki eşzamanlı rezervasyon, kayıt sahipliği, fiyat manipülasyonu, stok yetersizliği, idempotency, imzalı webhook/replay/stock release ve restart sonrası veri testleri geçti.
- Bunlar geliştirme fixture testleri: her müşteri projesini izole ortamda test edip imzalı raporla otomatik sonlandıran remote worker hâlâ yok. Teslim kilidi bu nedenle kaldırılmadı.
- Açık kalanlar: özgün görsel tasarım kalite kabulü; sohbetten tam frontend/backend/DB migration ve güvenli rollback; remote provisioning/lifecycle ve worker bağlantısı; gerçek müşteri ödeme hesabı kabulü; özel sektör iş kuralları; tax/shipping/refund/subscription; provider kesintisindeki pending siparişlerin otomatik uzlaştırılması; imzalı özel medya dağıtımı.

## Veri koruma ve kaynak geri alma turu
- Runtime revision analizi: koleksiyon/alan silme, private->public veri açılması, mevcut URL kaybı ve workflow sözleşmesi değişiklikleri migration_required olarak engellenir. Ekleme ve içerik/tasarım değişiklikleri ayrı raporlanır. Bu koruma gerçek müşteri DB migration çalıştırıcısı değildir.
- Kaynak artifact'ine normalize blueprint snapshot ve sourcePlanHash bağlandı. Kaynak geri alma yalnız aynı brief'e bağlı, kaynak hash'i doğrulanmış geçmiş sürüm ve açık kullanıcı onayı ile yapılır. CAS/expectedArtifactVersion korunur; acceptance sıfırlanır ve Preview stale yapılır. Müşteri canlı verisi silinmez/geri alınmaz, uzak dağıtım yapılmaz.
- Setup ekranına revizyon riskleri ve geçmiş kaynak sürümünü geri alma eklendi; destructive derleme migration olmadan açılmaz.
- Sayfa seed kimlikleri liste sırası yerine slug'a bağlandı. Yeni sayfa eklenince diğer sayfaların kimliği değişmez.
- Gerçek onaylı veri migration/deployment çalıştırıcısı ve tam AI kaynak kodu revizyonu hâlâ eksik; bu tur bunların tamamlandığını iddia etmez.
