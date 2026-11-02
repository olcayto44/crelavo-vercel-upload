# Website üretimini birleştirme — ilk kabul kapısı

## Tek üretim mimarisi
- Bağımsız giriş: `/api/websites/generate`.
- Asistan girişi: `/api/assistant-work`. Website istekleri genel plan/kredi/yerel motor yolundan önce ayrılır.
- Tek dosya üretim kaynağı: `src/lib/website-engine.ts`. Mevcut Website Builder şablonu ve kalite kontrolü kullanılır.
- Asistan akışı: `src/lib/assistant-work/website.ts`.
- Konuşma ve brief: `src/lib/assistant-work/website-brief.ts`.
- Ortak revizyon/geçmiş: `/api/website-content/[id]`.
- Ortak yetkili önizleme/ZIP: `/api/productions/[id]/delivery`.

Asistanın eski sabit website üretimi engellendi. Eski üretim kayıtları ve teslim dosyaları silinmedi; içerik editöründen erişilebilir. Diğer kategorilerin üretim yolları değiştirilmedi.

## Proje, onay ve kredi sınırları
Konuşma, brief, onay özeti, üretilmiş dosyalar, içerik geçmişi ve teslim bağlantıları tek `production_requests.id` üzerinde tutulur. Onay, normalize edilmiş brief ve paketin sunucuda hesaplanan özetiyle bağlıdır. İstemcinin onay bayrağı tek başına üretim başlatamaz. Brief değişirse yeniden onay gerekir.

Konuşma ve plan onayı kredi harcamaz. Üretim mevcut kredi bakiyesini kontrol eder; doğrulanmış dosyaları kaydeder; ardından mevcut kredi harcama uç noktasını sabit proje/plan anahtarıyla çağırır. Harcama ve sonuç kaydı tamamlanmadan teslim açılmaz. Üretim hatasında kredi harcanmaz. Ödeme tekrarında aynı dosyalar kullanılır. Kesilmiş üretim üç dakika sonra açık kullanıcı işlemiyle kurtarılabilir.

Müşteri veritabanı göçü, hosting projesi, DNS değişikliği, CMS veya sektör modülü eklenmedi.

## Yerel kabul testi
`npm run smoke:website-assistant`, mevcut website/içerik/teslim testleri ve `npm run build` çalıştırılır.

Birleşme testi gerçek ortak motoru, teslimat GET uç noktasını ve içerik GET/PUT/revizyon/geri alma işleyicilerini bellek içi veritabanı ve kredi kaydıyla çalıştırır. Ayrı HTML sayfaları, sayfa önizlemesi, revizyonun gerçek ZIP baytlarına yansıması, kullanıcı izolasyonu, eksik brief, değiştirilmiş onay, eski plan, yetersiz kredi, üretim hatası, tekrar/eşzamanlı üretim, ödeme hatası, sonuç kaydı hatası ve kesilmiş üretimin kurtarılması kapsanır. Konuşma sağlayıcısı adaptörü sahte yanıtla test edilir; canlı API harcaması yapılmaz. Teslimat API testi seçilen alt sayfayı, geçersiz dosya yollarını, oturum kontrolünü, ödeme tamamlanmadan erişimin engellenmesini ve ZIP içindeki alt sayfaları da doğrular.

## Canlı kabul henüz tamamlanmadı
Bu aşama üretime tamamen hazır sayılmadan önce yayınlanan sürümde test hesabıyla şunlar doğrulanmalı: gerçek sağlayıcıyla doğal sohbet, kapsam ve kredi onayı, Supabase kalıcılığı, kredi kaydında aynı işin iki kez ücretlenmemesi, tarayıcıda sayfa geçişleri, yenileme/yeniden açma, revizyon, geri alma ve yetkili ZIP indirme. Eski teslimlerin açılması da kontrol edilmelidir. Otomatik test bu canlı kabulün yerine geçmez.

## Kapsam
Bu aşama statik website ve kaynak dosya teslimidir. Özel sayfalar statik bilgi sayfası olarak oluşturulur. Dinamik veritabanı, üyelik, çalışan yönetim paneli, checkout, otomatik domain yayını ve sektör modülleri sonraki aşamalardır; bu kapıda teslim edilmiş sayılmaz. Dil/tasarım uyumu ve gerçek tarayıcı/mobil görünümü de kabul incelemesi gerektirir.

## Son yerel doğrulama
- Birleşme, website içerik, otomatik teslim, üretim kalite, teslim paketi ve asistan yönlendirme testleri geçti.
- TypeScript kontrolü ve üretim derlemesi geçti; 560 sayfa oluşturuldu.
- Genel asistan bağlantı testi ana sayfada HardReloadLink, genel sohbet testi ise publicConversationalReply(clean, activeLanguage kaynak ifadesini bulamadığı için başarısız. Bu iki hatanın işaret ettiği ana sayfa, AssistantWorkspace ve assistant-chat dosyaları bu birleşmede değiştirilmedi. Bu hatalar giderilmiş sayılmaz.
- Bu sonuçlar yereldir; yeni sürüm için commit/push/deploy ve canlı kabul henüz yapılmadı.
