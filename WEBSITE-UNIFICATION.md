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

## Asistan ekranı ve giriş düzeltmesi
- Ana asistan kabuğu korunur; website seçimi artık ayrı bir tam ekran formuyla asistanı değiştirmez.
- Website sohbeti mevcut sağ panelde, sunucu onayı aynı panelde, ortak editör/önizleme/teslim mevcut ana alanda çalışır.
- URL sorgusu canlı okunur; genel/video bağlantısına dönünce önceki website seçimi bu bağlantıları ele geçiremez.
- Oturumsuz asistan erişimi /join üzerinden ödeme ekranına gönderilmez. Mevcut giriş penceresi açılır ve kategori dahil dönüş adresi korunur. Diğer sayfaların erişimi ve üretim/indirme ödeme kuralları değiştirilmez.
- npm run smoke:assistant-workspace-regression gerçek bileşen çıktısını ve eylemlerini kontrollü bağımlılıklarla sınar: genel kabuk, website sohbeti, ortak üretim, aynı proje editörü, kategori ayrımı ve giriş dönüş adresi. Bu test canlı tarayıcı kabulü değildir.

## Referans ekrandaki iç düzenin geri getirilmesi
- Website modunda da özgün Home/Setup/Render final kartı, Category/Scene-page/Status kutuları, büyük önizleme alanı, yatay sayfa sekmeleri, sağ plan özeti ve dikey sayfa listesi korunur.
- Referans URL alanı ve UPDATE PLAN düğmesi geri geldi. URL, kullanıcı tarafından sağlanan konuşma bağlamıdır; otomatik tarandığı iddia edilmez.
- Brief alanları, paket seçimi ve kurtarma işlemleri ana ekranın yerine geçmez; Setup içindedir. Mevcut onay düğmesi sunucu onayına, Render final ortak üretim motoruna gider.
- Üretilen sayfalar gerçek dosya manifestinden alınır. Önizleme mevcut büyük alanın içinde yetkili teslim API üzerinden yüklenir; iframe sandbox ve kaynak/manifest denetimli gezinme kullanılır.
- Revizyon/geçmiş/ZIP aynı proje için sekmelerin altındaki açılır alandadır. İçerik kaydı, revizyon ve geri alma önizlemeyi yeniler.
- Regresyon testi bu kontrolleri, sayfa seçimini, sunucu onayı ayrımını, sandbox önizlemesini, eski HTML gösterilmemesini ve ödeme hatasının önizlemeye yansımasını kapsar. Piksel düzeyinde canlı tarayıcı kabulü yerine geçmez.

## Genel asistan konuşmasının gerçek akışa bağlanması
- Ekran kaydında General modunda gönderilen website talebi website motoruna geçmiyordu. Genel plan uç noktası da gerçek yanıt yerine prompt metnini geri döndürüyordu; istemci bu metni sol sayfa alanına uyguluyor, asistan mesajı eklemiyordu.
- General modundaki açık website oluşturma isteği sunucuda website akışına yönlenir. Yanıttaki aynı proje istemciye alınır ve website kategori URL parametreleri güncellenir; ikinci bir üretim ya da kredi harcaması başlatılmaz. Açık video/diğer kategori seçimi website sözcüğüyle ele geçirilmez.
- Genel sohbet de gerçek yanıt sağlayıcısını kullanır; kendi mesajını geri alan echo yanıtı reddedilir. Sağlayıcı yoksa/hatalıysa 503 ve görünür hata döner; tamamlanmış üretim veya gerçek yanıt varmış gibi gösterilmez.
- Kullanıcı/asistan mesajları yalnız sağ sohbet panelindedir. Sol sayfa sekmelerinden konuşma çıkarılmıştır. Mesaj gönderimi önizlemeyi veya dosyaları silmez; bekleme ve hata sohbet içinde görünür.
- Sohbet bağlamı sunucuya iletilir. Genel yerel kayıt kullanıcı/kategori bazında ayrılır; farklı kategoriye ait eski sayfa durumu General ekranına yüklenmez. Geciken kayıt yüklemesi yeni gönderilen mesajı ezemez.
- smoke:workspace-conversation, gerçek POST işleyicisini kontrollü bağımlılıklarla test eder: General üzerinden film sitesi, açık kategori ayrımı, gerçek cevap sözleşmesi, geçmiş, sağlayıcı hatası ve konuşmada üretim kredisi harcanmaması. Canlı sağlayıcı/Supabase kabulü ayrıca gereklidir.

## Arayüz dili, sohbet dili ve doğru onay durumu
- Arayüz EN/TR/DE/ES/FR/AR site tercihini ve dil değişikliği olayını izler; asistan başlığındaki dil seçici aynı tercihi günceller. Ekranın mevcut düzeni korunur.
- Kullanıcı/asistan mesajları arayüz çevirisinin dışında kalır. Yanıt dili son anlamlı kullanıcı mesajından belirlenir; üretilen sitenin dili bağımsızdır. Plan güncelleme düğmesinin yapay mesajı kullanıcı geçmişine yazılmaz.
- Eksik brief, seçilmemiş paket, statik kapsam, fiyat ve plan özeti sunucuda kontrol edilir. Hazır/onay durumları gerçek proje aşamasını izler. Paket seçimini boşaltmak eski paketi geri getirmez.
- Gerçek kişisel öneriler ve kullanıcı yorumları çalışan servis olarak vaat edilmez; açıkça statik örnek olarak belirtilen içerikler ayrı değerlendirilir.
- Yeni test: npm run smoke:workspace-language. Kontroller yereldir; gerçek sağlayıcı, tarayıcı/mobil görünüm ve canlı üretim-kredi-ZIP kabulü ayrıca gereklidir.
