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
