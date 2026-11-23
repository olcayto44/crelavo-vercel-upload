# Web sitesi kabul çalıştırıcısı

Bu servis müşteri hostingi değildir. Her kaynak sürümünü geçici, internete kapalı bir Docker ortamında test eder; müşterinin ödeme hesabını veya gerçek API anahtarlarını istemez. Vercel uygulamasının içine Docker kurulmaz: servis Docker bulunan ayrı bir iç işçi sunucusunda çalışır.

## Kurulum (operatör işlemi)

1. Node.js 24, Docker Engine ve HTTPS reverse proxy bulunan, yalnız bu iş için ayrılmış Linux sunucu hazırlayın. Docker soketini müşteriye veya üretilen konteynere vermeyin. Docker yetkisi güçlüdür; servisi genel amaçlı uygulama sunucusunda çalıştırmayın.
2. Bu klasörde `docker build -t crelavo-website-acceptance:1 .` ile test imajını hazırlayın. İmaj indirme ve tarayıcı kurulumu yalnız bu aşamada ağ kullanır. Üretimde `RUNTIME_WORKER_IMAGE` için denetlenmiş imajın digest'ini sabitleyin.
3. Aynı uzunlukta olmayan, birbirinden bağımsız rastgele 32+ karakter `WEBSITE_RUNTIME_WORKER_TOKEN` ve `WEBSITE_RUNTIME_WORKER_REPORT_SECRET` tanımlayın. Serviste `RUNTIME_WORKER_DATA` özel kalıcı diski, `HOST=127.0.0.1`, `PORT=4080` ayarlayın. Değerleri repoya yazmayın.
4. Repo kökünden `npm run worker:website-runtime` başlatın. HTTPS proxy yalnız `/v1/jobs/*` yollarını açmalı; Authorization başlığını korumalı ve gövde sınırını 21 MB yapmalıdır. Servisi process manager/systemd ile yönetin.
5. Crelavo'nun **geliştirme ortamına** aynı iki sırrı ve `WEBSITE_RUNTIME_WORKER_URL=https://worker.example.com` origin'ini bağlayın. `WEBSITE_RUNTIME_ENABLED=1` geliştirme kilidi korunur. Bu commit canlı ortamı açmaz veya dağıtmaz.

## Otomatik akış

Onaylanan blueprint tüm runtime dosyalarına derlenir. Kaynak hash'iyle bağlı iş önce CAS ile veritabanına kaydedilir, sonra worker'a gönderilir. Worker yoksa `configuration_pending` görünür; kabul veya ZIP teslimi varmış gibi davranılmaz. Arayüz sonucu sorgular. Geçici bağlantı hatasında aynı iş kimliğiyle yeniden deneme yapılabilir; farklı içerik aynı işe yazılamaz.

Worker her iş için `--network none`, read-only kök dosya sistemi, ayrı veri dizini, root olmayan kullanıcı, kapatılmış capability'ler ve CPU/RAM/PID/zaman sınırı kullanır. Konteynerin gerçek ayarları `docker inspect` ile doğrulanır. Kaynaklar salt okunur girişten alınır; Docker soketi ve Crelavo sırları içeri verilmez. Kaynak dosyaları yalnız konteyner içinde çalıştırılır. Servis konteyner dışına kaçışa karşı tam güvenlik sertifikası değildir; düzenli Docker/Chromium güncellemesi ve altyapı denetimi gerekir.

Testler: ZIP oluşturma/açma ve temiz kurulum, bütün JS dosyalarının sözdizimi, owner girişi, yetkisiz erişim, CSRF/origin, her koleksiyonda gerçek CRUD/sürüm çakışması, yeniden başlatmada veri kalıcılığı, public/özel veri ayrımı, tanımlı filtreler ve detaylar, resim yükleme, her public sayfa, iç bağlantılar, gerçek tarayıcıda admin kaydetme ve mobil taşma. Tanımlı üyelik erişimi, çakışan rezervasyon ve checkout iş akışları ayrıca test edilir.

Checkout testi **sahte HTTP sağlayıcısı ve imzalı webhook fixture'ı** kullanır; gerçek ödeme başarısı değildir. Yalnız bu adaptöre açıkça eşlenmiş dış yetenek `configuration_pending` olabilir. Diğer sağlayıcılar/özel işlevler kod ve test eşlemesi olmadan `not_implemented` kalır ve teslimi engeller. Kayıtlar fixture verisidir; müşterinin mevcut veritabanına bağlanılmaz.

Rapor HMAC ile imzalanır; iş/proje/blueprint/kaynak hash'i ve her testin sürümü Crelavo'da yeniden doğrulanır. Başarısız veya çalışmamış bir test, eksik işlev, eski sürüm ya da doğrulanmayan izolasyon ZIP kilidini kaldırmaz. Rapor iş süresi dolmadan alınmalıdır. Geçici kaynak/veri dizinleri iş süresi dolunca silinir. Bağlı canlı Preview üretilmez; `not_provisioned` olarak kalır.

## Yerel doğrulama ve sınırlar

- `npm run smoke:website-production-manager`: mevcut regresyonlar, projeye özel gerçek runtime/tarayıcı testleri ve worker HTTP protokol testi.
- `website-project-acceptance-smoke.cjs` geliştiricinin yerel bilgisayarında fixture kaynaklarını çalıştırır; bu **Docker izolasyon kanıtı değildir**.
- `website-worker-service-smoke.cjs` gerçek HTTP/HMAC/kuyruk davranışını test eder; Docker yürütücüsünü taklit eder.
- Docker bulunmayan geliştirme makinesinde imajın derlendiği veya izole üretim işinin geçtiği iddia edilemez. Ayrı sunucuda imaj kurulumu ve uçtan uca kabul işi ayrıca doğrulanmalıdır.
- Sohbet revizyonu; mevcut derleyicinin sayfa, tema, içerik, tipli alan, filtre ve desteklenen iş akışlarını kapsar. Rastgele backend kodu yazma veya her sektöre özgü sınırsız işlev garantisi değildir. Şema/veri silme, alan türü değiştirme, özel veriyi açma ve mevcut iş akışını değiştirme migration gerektirir.
