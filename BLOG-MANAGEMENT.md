# Blog / SEO yazı yönetimi

- Yönetim: /admin/blog; herkese açık liste: /blog; yazı: /blog/{slug}.
- Mevcut sabit rehberler ve Site Content konu kartları korunur. Yeni uzun yazılar ayrı blog editöründen yönetilir.
- Mevcut platform_configs tablosunda blog_posts_v1 anahtarı kullanılır; yeni tablo veya migration gerekmez. Okuma hatası boş kayıt gibi sunulmaz, hata durumunda kaydetme engellenir.
- API /api/admin/blog geçerli imzalı yönetici oturumu ve content yetkisi ister. Tek başına e-posta başlığı yetkilendirme sağlamaz. Yabancı origin istekleri reddedilir.
- Başlık, URL, özet, içerik, yazar, kapak URL/alt metin, SEO başlık/açıklama ve anahtar kelimeler yönetilir. Yazı taslak olarak kaydedilir; Yayınla ayrıca onay ister. Yayından kaldırma ve silme desteklenir.
- İçerik: ## alt başlık, ### üçüncü seviye başlık, - liste maddesi, [metin](/sayfa) veya HTTPS bağlantısı. Ham HTML çalıştırılmaz. Kapaklar mevcut HTTPS görsel URL veya site içi yol ile girilir; dosya yükleme bu sürümde yoktur.
- Yayın için özet, en az 100 karakter içerik, SEO başlığı, 50–170 karakter meta açıklaması gereklidir. Anahtar kelimeler en fazla 20. Google sıralaması garanti edilmez.
- Taslaklar public liste, yazı rotası ve sitemap dışında kalır. Canonical, Open Graph, Twitter ve güvenli BlogPosting JSON-LD eklenir. Yayınlanmış URL sabitlenir; eski bağlantılar değişmez.
- Yazı kaydı revision karşılaştırmasıyla korunur. Çakışmada yerel metin saklanır, kullanıcı metni kopyalayıp yeniden yüklemelidir.
- Test: npm run smoke:blog-admin. Testler mock veritabanı ile yereldir. Canlı admin oturumu, platform_configs yazma izni, yayın/gizleme ve Google çıktı kontrolü yayından sonra ayrıca doğrulanmalıdır.
