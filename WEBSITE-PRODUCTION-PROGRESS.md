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
