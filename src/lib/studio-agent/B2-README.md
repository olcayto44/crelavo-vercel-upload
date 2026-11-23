# Studio V2 — B2 Gerçek Konuşma Motoru

## Kapsam ve güvenli varsayılan

B2 adapter kodu hazırdır; ücretli LLM çağrısıyla denenmedi. Mevcut AI sağlayıcı endpoint/key/model altyapısını kullanır. Yeni API `/api/studio/conversation`; eski Assistant/üretim API'leri değişmedi. Studio V2 mevcut şablonla üç paneli korur; sağ panel sohbet, serbest mesaj, kısa seçenekler, proje bağlamı ve ayrı iki bakiye gösterir. Uzun soru formu gizlidir; üretim/revizyon düğmeleri kapalıdır.

**Preview mock**, `STUDIO_AGENT_PREVIEW_MOCK=true` ve `VERCEL_ENV=preview` koşuluyla kullanılabilir. Production ortamında mock reddedilir. Oturum yine doğrulanır. Model deterministik simülasyondur; gösterilen iki bakiye de simülasyondur. Demo hafızası kullanıcı/proje/kategoriye bağlı HMAC imzalı token ile tarayıcı oturumunda saklanır, 24 saat sonra geçersizdir. Bu, gerçek DB hafızası değildir.

**Gerçek mod** ancak aşağıdaki koşullarda çalışabilir; bu çalışmada açılmadı:

1. Offline SQL taslağı bağımsız, yetkili bir incelemeyle hedef test/staging veritabanına uygulanmış olmalı. Production'a uygulanmadı.
2. Sunucuda `STUDIO_AGENT_REAL_AI_ENABLED=true` ve `STUDIO_AGENT_ACCOUNTING_ENABLED=true` açıkça ayarlanmalı.
3. Mevcut sağlayıcı anahtarı/model erişimi; sunucuya ait `STUDIO_AGENT_TARIFF_VERSION`, `STUDIO_AGENT_INPUT_CREDITS_PER_1K`, `STUDIO_AGENT_OUTPUT_CREDITS_PER_1K` geçerli olmalı. Kod kendiliğinden fiyat belirlemez.
4. Doğrulanmış oturum, sahip olunan proje/kategori, yeterli mevcut Assistant bakiyesi, service-only RPC izinleri ve atomik reserve/claim/result/settle sağlanmalı.
5. Operatörün belirsiz sağlayıcı sonuçlarını inceleme/uzlaştırma süreci olmalı. Otomatik timeout refund veya ücretli yeniden çağrı yoktur. Eski Assistant yollarının ortak bakiye yazımları ayrıca incelenmeden canlı aktivasyon yapılmamalı.

Bir koşul eksikse gerçek sağlayıcıya gidilmez. Kullanıcı/model gerçek modu veya tarife/hesap/onay/kimlik alanlarını serbest JSON ile açamaz. Production kredisi sohbet için kullanılmaz; Assistant kredisi üretim için kullanılmaz. Yeni başlangıç hakkı/grant veya bakiye sıfırlama yoktur.

## Konuşma ve hafıza

- Kalıcı DB yolu: `studio_agent_projects`, `studio_agent_messages`, `studio_agent_usage_requests`, `studio_agent_credit_ledger`.
- Her kayıt kullanıcı/proje/kategoriye bağlı; birleşik FK, RLS ve sunucu sahiplik filtreleri var.
- B1'in 37 kategori sözleşmesi ve mevcut paketleri salt okunur kullanılır.
- Model patch'inin her değişen alanı son kullanıcı mesajındaki birebir kaynak alıntısıyla doğrulanır. Dolu alanı boşaltma, uydurma referans/izin, farklı kategoriden veri aktarma reddedilir.
- Bilinen alanlar tekrar soru olarak seçilmez. Modelin soru adayı yalnızca sunucunun bulduğu ilk kritik eksikle eşleşiyorsa kullanılır; değilse sunucu kısa soruyu seçer.
- İçerik dili sohbet/UI dilinden bağımsızdır. Türkçe sohbet ve İngilizce site test edildi.
- B2'de araç önerileri yürütülmez. Üretim/onay/revizyon iddiası operasyonel niyette sunucu tarafından bağlı-değil yanıtına çevrilir.
- Sahip olunan mevcut Website, salt okunur açılabilir; eski `websiteAssistant` brief'i ve konuşmaları yeni konuşma projesine doğrulanmış kaynaktan alınır. Yeniden üretim yapılmaz.

## Atomik muhasebe

`supabase/migration_studio_agent_b2.sql` **OFFLINE ONLY** taslaktır. Sadece Assistant wallet'a rezerv sütunu ve ilgili yeni tablolar/RPC'ler ekler; Production wallet'a yazmaz. SQL migration transaction içindedir. Mevcut kullanıcı tutarlarını/grant politikalarını değiştirmez.

Akış:

1. Sahiplik/şema/tarife/sağlayıcı preflight.
2. Sunucu üst sınırıyla atomik rezerv; kullanıcı+requestId+payload hash idempotency.
3. Atomik dispatch claim başarılı olmadan sağlayıcı çağrısı yapılmaz.
4. Bir sağlayıcı çağrısı; doğrulanmış token kullanımıyla sunucu maliyeti.
5. Sonucu kalıcı `result_ready` kaydet; bakiye, ledger, brief, kullanıcı/asistan mesajları ve yanıt cache'i aynı settlement transaction'ında yazılır.

Ledger veya mesaj yazımı hata verirse tamamı geri alınır. `result_ready` aynı request ile sağlayıcıyı çağırmadan finalize edilebilir. Aynı requestId farklı payload ile reddedilir. Aynı projeye bekleyen başka turn başlatılmaz. Kesin sağlayıcı reddi sadece o rezervi serbest bırakır; ağ/dispatch/kullanım belirsizliğinde rezerv tutulur ve otomatik tekrar yapılmaz.

Model yanıtı geçersiz fakat sağlayıcı kullanımı doğrulanmışsa brief değişmez; güvenli hata mesajı kaydedilir ve gerçekleşmiş Assistant kullanımı muhasebeleşir. Kullanım doğrulanamıyorsa otomatik tahsilat veya refund yerine reconciliation gerekir. RPC'ler `anon`/`authenticated` rollerine açık değildir; yalnızca sunucu service role kullanabilir.

## Dosyalar

- `src/app/dashboard/studio-v2/page.tsx`: B2 ekran bağlantısı; üç panelli temel şablon korunur.
- `src/components/StudioConversationFrame.tsx`: oturum aktarımı, refresh/logout ve dış iframe.
- `src/app/api/studio/conversation/route.ts`: doğrulanmış auth/rate limit API girişi.
- `src/lib/studio-agent/conversation-contract.ts`: istek, proje, model/kullanım/response sözleşmeleri.
- `conversation-engine.ts`: B1 gereksinimleri, kaynak doğrulama, idempotent konuşma/muhasebe akışı.
- `conversation-store.ts`: gerçek DB repository ve mevcut Website hafızasının salt okunur aktarımı.
- `provider-adapter.ts`: mevcut sağlayıcı altyapısı, tek çağrı ve sınırlı output.
- `conversation-handler.ts`: gerçek/mock ayrımı ve güvenli API hata yanıtları.
- `mock-conversation.ts`, `preview-state.ts`: deterministik demo, izole memory store, imzalı kullanıcı/proje/kategori token'ı.
- `conversation-client.ts`: sohbet paneli, kısa seçenekler, ayrı bakiyeler, session/category değişim koruması, kayıtlı site salt okunur önizlemesi.
- `scripts/studio-agent-test-loader.cjs`, `studio-agent-b2-smoke.cjs`, `studio-agent-b2-db.cjs`, `studio-agent-b2-browser.cjs`: ücretsiz testler.
- `supabase/migration_studio_agent_b2.sql`: izole PostgreSQL'de denenmiş migration/RPC taslağı.

## Testler

```sh
node scripts/studio-agent-b1-smoke.cjs
node scripts/studio-agent-b2-smoke.cjs
node scripts/studio-agent-b2-db.cjs
node scripts/studio-agent-b2-browser.cjs
npm exec -- tsc --noEmit --incremental false --pretty false
```

B1: 21 grup. B2 konuşma: 20 grup. B2 PostgreSQL/RPC: 12 grup. Tarayıcı suite'i: üç panel geometrisi, sohbet/composer, form gizleme, ayrı mock bakiyeler, restore, çift tıklama koruması, kategori izolasyonu, dosya seçim bildirimi ve mevcut oturum kapısı.

PGlite gerçek SQL/RPC/transaction yürütür ama sorguları sırayla işler; **çok oturumlu concurrency kanıtı değildir**. Sağlayıcı adapter'ı mock fetch ile test edildi. Hiçbir gerçek ücretli AI veya üretim çağrısı yapılmadı. Canlı kullanıcı bakiyeleri değiştirilmedi.

## Henüz bağlı olmayanlar

- Gerçek sağlayıcının canlı ücretli doğrulaması ve canlı muhasebe aktivasyonu.
- Dosyanın sunucuya yüklenmesi, modele/multimodal referansa bağlanması; B2 alanı seçim bildirimi verir, yüklenmiş gibi göstermez.
- Agent üzerinden plan onayı, gerçek üretim ve Website görsel/tasarımsal revizyonu.
- Yeni Canvas çıktısı, ileri sayfa/araç düzenleme ve çift yönlü değişiklik senkronizasyonu; sadece mevcut Website salt okunur önizlemesi var.
- Otomatik belirsiz provider outcome uzlaştırması; rezervler güvenli şekilde bekler.
- C1/C2/C3 aşamaları. B2 tesliminden sonra otomatik ilerleme yok.
