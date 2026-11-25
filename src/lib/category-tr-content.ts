// Turkish editorial category content, excluding the existing localized video landing page.
export type TurkishCategoryProfile={slug:string;title:string;description:string;uses:string[];question:string;answer:string};
export const turkishCategoryProfiles:Record<string,TurkishCategoryProfile>={
  "website": {
    "slug": "yapay-zeka-web-sitesi-olusturucu",
    "title": "Yapay Zeka Web Sitesi Oluşturucu",
    "description": "İşletme sitesi, açılış sayfası, e-ticaret mağazası veya portfolyo için sayfa yapısını, markayı ve mobil uyum gereksinimlerini belirleyin.",
    "uses": [
      "Açılış sayfası",
      "Kurumsal web sitesi",
      "Online mağaza",
      "Portfolyo"
    ],
    "question": "Kod bilmeden başlayabilir miyim?",
    "answer": "İhtiyaçlarınızı normal cümlelerle anlatabilirsiniz. Barındırma, alan adı, ödeme ve kaynak kodu teslimi proje kapsamına göre ayrıca doğrulanır."
  },
  "saas": {
    "slug": "yapay-zeka-saas-olusturucu",
    "title": "Yapay Zeka SaaS Oluşturucu",
    "description": "Yazılım fikrinizi kullanıcı rolleri, abonelik akışları, veri yapısı ve yönetim ekranlarıyla bir MVP planına dönüştürün.",
    "uses": [
      "Abonelik paneli",
      "Müşteri portalı",
      "Ekip iş akışları",
      "MVP planı"
    ],
    "question": "SaaS MVP için nereden başlamalıyım?",
    "answer": "İlk kullanıcı grubunu ve temel işlevi tanımlayın; üyelik, ödeme ve entegrasyon ihtiyaçlarını sonraki özelliklerden ayırın."
  },
  "mobile_app": {
    "slug": "yapay-zeka-mobil-uygulama-olusturucu",
    "title": "Yapay Zeka Mobil Uygulama Oluşturucu",
    "description": "iOS ve Android uygulama fikirleri için ekranları, gezinmeyi, kullanıcı yolculuğunu ve prototip gereksinimlerini planlayın.",
    "uses": [
      "iOS tasarımı",
      "Android tasarımı",
      "Ekran akışları",
      "Uygulama prototipi"
    ],
    "question": "Uygulama mağazasında yayımlama da dahil mi?",
    "answer": "Hedef işletim sistemi, cihaz özellikleri ve mağaza yayın gereksinimleri teslimat kapsamına göre ayrıca belirlenir."
  },
  "admin_project": {
    "slug": "yapay-zeka-yonetim-paneli",
    "title": "Yapay Zeka Yönetim Paneli Oluşturucu",
    "description": "İş süreçleriniz için yönetim ekranları, kullanıcı yetkileri, kayıt yönetimi ve raporlama ihtiyaçlarını tanımlayın.",
    "uses": [
      "Yönetim ekranları",
      "Kullanıcı rolleri",
      "Raporlama",
      "Onay süreçleri"
    ],
    "question": "Yetkileri nasıl tanımlamalıyım?",
    "answer": "Her rolün görebileceği ve değiştirebileceği kayıtları, onay adımlarını ve denetim ihtiyaçlarını belirtin."
  },
  "talking_video": {
    "slug": "yapay-zeka-konusan-video",
    "title": "Yapay Zeka Konuşan Video",
    "description": "Sunucu videoları, röportajlar ve çok kişili diyaloglar için karakter, senaryo ve ses gereksinimlerini hazırlayın.",
    "uses": [
      "Dijital sunucu",
      "Röportaj",
      "Çok kişili diyalog",
      "Tanıtım videosu"
    ],
    "question": "Birden fazla konuşmacı nasıl planlanır?",
    "answer": "Her konuşmacıyı senaryoda ayrı belirtin; izinli görüntü ve ses referanslarını, telaffuzu ve sahne sırasını ekleyin."
  },
  "documentary": {
    "slug": "yapay-zeka-belgesel-hazirlama",
    "title": "Yapay Zeka Belgesel Hazırlama",
    "description": "Belgesel konusunu araştırma soruları, kaynaklar, anlatım metni ve görsel sahne planıyla yapılandırın.",
    "uses": [
      "Belgesel senaryosu",
      "Röportaj planı",
      "Anlatım",
      "Görsel taslak"
    ],
    "question": "Gerçek çekimler ile yapay zekâyla üretilen sahneler nasıl ayırt edilir?",
    "answer": "Doğrulanabilir kaynaklar kullanın; canlandırma ve yapay görselleri açık biçimde etiketleyin."
  },
  "animation": {
    "slug": "yapay-zeka-animasyon-olusturucu",
    "title": "Yapay Zeka Animasyon Oluşturucu",
    "description": "2D, 3D ve karakter animasyonu için hikâye, özgün karakterler, sahneler ve hareket tarzını belirleyin.",
    "uses": [
      "2D animasyon",
      "3D konsept",
      "Karakter animasyonu",
      "Eğitici içerik"
    ],
    "question": "Karakter tutarlılığı nasıl planlanır?",
    "answer": "İzinli referansları, renk ve kıyafet tanımlarını, sahne listesini hazırlayın; her çıktıyı tutarlılık açısından inceleyin."
  },
  "music_video": {
    "slug": "yapay-zeka-muzik-klibi",
    "title": "Yapay Zeka Müzik Klibi Hazırlama",
    "description": "Kullanım hakkına sahip olduğunuz müzik için klip, şarkı sözü videosu ve görselleştirici konseptleri oluşturun.",
    "uses": [
      "Müzik klibi",
      "Şarkı sözü videosu",
      "Görselleştirici",
      "Performans konsepti"
    ],
    "question": "Her şarkıyı kullanabilir miyim?",
    "answer": "Yalnızca size ait veya izinli müzik ve sözleri kullanın. Şarkı bölümlerini ve görsel ritim beklentisini belirtin."
  },
  "drama": {
    "slug": "yapay-zeka-kisa-film-drama",
    "title": "Yapay Zeka Kısa Film ve Drama",
    "description": "Kısa film ve bölüm dizileri için olay örgüsünü, karakter gelişimini, diyalogları ve sahneleri planlayın.",
    "uses": [
      "Kısa film",
      "Drama bölümü",
      "Karakter hikâyesi",
      "Pilot bölüm"
    ],
    "question": "Dizi üretimine nasıl başlanır?",
    "answer": "Önce karakter ilişkilerini, bölüm çatısını ve kısa bir pilot sahneyi belirleyerek kapsamı değerlendirin."
  },
  "cinematic_video": {
    "slug": "yapay-zeka-sinematik-video",
    "title": "Yapay Zeka Sinematik Video",
    "description": "Film estetiğine sahip sahneler ve fragmanlar için kamera hareketi, ışık, kadraj ve anlatım yönünü planlayın.",
    "uses": [
      "Sinematik sahne",
      "Fragman",
      "Kamera planı",
      "Marka hikâyesi"
    ],
    "question": "Çekim planında neler olmalı?",
    "answer": "Kadrajı, kamera hareketini, ışığı, özne hareketini, sahne süresini ve geçiş ihtiyaçlarını tanımlayın."
  },
  "video_clipping": {
    "slug": "yapay-zeka-video-kirpma",
    "title": "Yapay Zeka Video Kırpma",
    "description": "Uzun ve izinli videolardan kısa sosyal medya klipleri, dikkat çekici anlar ve özetler için kesim planı hazırlayın.",
    "uses": [
      "Podcast klibi",
      "Kısa video",
      "Öne çıkan anlar",
      "Dikey format"
    ],
    "question": "İyi bir kısa klip nasıl seçilir?",
    "answer": "Tek başına anlaşılabilen, güçlü açılışı ve sonucu olan anları işaretleyin; altyazı ve kadraj beklentisini belirtin."
  },
  "video_tools": {
    "slug": "online-video-duzenleme-araclari",
    "title": "Online Video Düzenleme Araçları",
    "description": "Video kesme, birleştirme, ses ve katman düzenleme ihtiyaçlarını belirleyin; desteklenen editör seçeneklerini inceleyin.",
    "uses": [
      "Kesme ve birleştirme",
      "Video katmanları",
      "Ses düzenleme",
      "En boy oranı"
    ],
    "question": "Hangi dışa aktarma formatları kullanılabilir?",
    "answer": "Mevcut editördeki desteklenen kaynak ve çıktı biçimlerini kontrol edin. Bulut üretimi ve yerel editör farklı özellikler sunabilir."
  },
  "campaign": {
    "slug": "yapay-zeka-reklam-kampanyasi",
    "title": "Yapay Zeka Reklam ve Kampanya Oluşturucu",
    "description": "Ürün bilgisi, hedef kitle ve teklif üzerinden e-ticaret reklamları için kancalar, metinler ve görsel konseptler planlayın.",
    "uses": [
      "Ürün reklamı",
      "Sosyal medya kampanyası",
      "UGC konsepti",
      "Reklam metni"
    ],
    "question": "Bir reklamın farklı versiyonları nasıl hazırlanır?",
    "answer": "Ürün iddialarını değiştirmeden dikkat çekici açılışı, hedef kitleye uygun mesajı, görsel yaklaşımı ve harekete geçirici çağrıyı çeşitlendirin."
  },
  "ad_score_checker": {
    "slug": "yapay-zeka-reklam-analizi",
    "title": "Yapay Zeka Reklam Analizi",
    "description": "Reklam fikrini üretimden önce açılışın dikkat çekiciliği, teklifin açıklığı, görsel yaklaşım ve harekete geçirici çağrı açısından değerlendirin.",
    "uses": [
      "Kanca analizi",
      "Teklif değerlendirme",
      "CTA kontrolü",
      "Kreatif inceleme"
    ],
    "question": "Reklam puanı satış garantisi verir mi?",
    "answer": "Hayır. Geri bildirim iyileştirme ve kontrollü test için kullanılır; gerçek performans kampanya verilerine bağlıdır."
  },
  "campaign_calendar": {
    "slug": "yapay-zeka-kampanya-takvimi",
    "title": "Yapay Zeka Kampanya Takvimi",
    "description": "Ürün lansmanları, sezonluk teklifler ve sosyal medya içerikleri için yayın tarihlerini, içerik materyallerini ve onay adımlarını düzenleyin.",
    "uses": [
      "İçerik takvimi",
      "Lansman planı",
      "Sezon kampanyası",
      "Yayın planı"
    ],
    "question": "Kampanya takvimi nasıl hazırlanır?",
    "answer": "Lansman tarihinden geriye doğru planlayın; her kanalın içeriklerini ve inceleme tarihlerini belirleyin."
  },
  "ai_agent": {
    "slug": "yapay-zeka-ajan-olusturucu",
    "title": "Yapay Zeka Ajan Oluşturucu",
    "description": "İşletmenizin tekrarlanan işleri için ajan rolü, bilgi kaynakları, izinler ve insan onayı gereksinimlerini tanımlayın.",
    "uses": [
      "İş akışı ajanı",
      "Destek ajanı",
      "Bilgi asistanı",
      "Onay akışı"
    ],
    "question": "Ajanın yetkileri nasıl belirlenir?",
    "answer": "İzinli verileri, eylemleri ve insana aktarılması gereken kararları tanımlayın; entegrasyon kapsamını ayrıca onaylayın."
  },
  "localization": {
    "slug": "yapay-zeka-icerik-yerellestirme",
    "title": "Yapay Zeka İçerik Yerelleştirme",
    "description": "Videolar ve marka mesajları için hedef dil, altyazı, seslendirme ve terminoloji gereksinimlerini hazırlayın.",
    "uses": [
      "Video çevirisi",
      "Altyazı planı",
      "Çok dilli dublaj",
      "İçerik uyarlama"
    ],
    "question": "Çeviri kalitesi nasıl kontrol edilir?",
    "answer": "Terim listesi ve ana dil incelemesiyle anlamı, telaffuzu, altyazı zamanlamasını ve ses kullanım haklarını kontrol edin."
  },
  "cultural_localization": {
    "slug": "kulturel-yerellestirme",
    "title": "Kültürel Yerelleştirme",
    "description": "Reklam ve ürün mesajlarını hedef pazarın diline, bağlamına ve yerel inceleme ihtiyaçlarına göre uyarlamayı planlayın.",
    "uses": [
      "Pazar uyarlaması",
      "Yerel reklam metni",
      "Hedef kitle analizi",
      "Kampanya uyarlama"
    ],
    "question": "Çeviri ile kültürel uyarlama farkı nedir?",
    "answer": "Kültürel uyarlama dilin yanında örnekleri, teklif ifadelerini ve yerel bağlamı da inceler; genellemelerden kaçınır."
  },
  "live_sales_agent": {
    "slug": "yapay-zeka-canli-satis-asistani",
    "title": "Yapay Zeka Canlı Satış Asistanı",
    "description": "Canlı ürün tanıtımı ve alışveriş için sunucu senaryosu, doğrulanmış ürün bilgisi ve müşteri etkileşim gereksinimlerini planlayın.",
    "uses": [
      "Canlı satış konsepti",
      "Ürün demosu",
      "Soru yanıt akışı",
      "Dijital sunucu"
    ],
    "question": "Canlı satış için hangi bilgiler gerekli?",
    "answer": "Ürün özelliklerini, fiyat ve stok kaynaklarını, izinli iddiaları ve müşteri sorularının aktarım kurallarını hazırlayın."
  },
  "avatar": {
    "slug": "yapay-zeka-avatar-olusturucu",
    "title": "Yapay Zeka Avatar Oluşturucu",
    "description": "Özgün veya izinli dijital karakterler için görünüm, kişilik, konuşma tarzı ve video kullanım alanını tanımlayın.",
    "uses": [
      "Dijital sunucu",
      "Marka avatarı",
      "Eğitim karakteri",
      "Sanal karakter"
    ],
    "question": "Aynı avatarı farklı videolarda kullanabilir miyim?",
    "answer": "Tutarlı görünüm, kıyafet, ses ve kadraj referansları hazırlayın. Üretilen sahneleri inceleyin; gerçek kişiler için izin alın."
  },
  "lip_sync": {
    "slug": "yapay-zeka-dudak-senkronizasyonu",
    "title": "Yapay Zeka Dudak Senkronizasyonu",
    "description": "İzinli ses ve videolar için dublaj, konuşma zamanlaması ve dudak hareketi uyumunu planlayın.",
    "uses": [
      "Dublaj",
      "Konuşan video",
      "Ses eşleme",
      "Dil uyarlama"
    ],
    "question": "Senkronizasyonu ne etkiler?",
    "answer": "Net ses, ağzın açıkça görülebildiği bir kadraj ve konuşmanın doğru zamanlaması önemlidir."
  },
  "voice_clone": {
    "slug": "yapay-zeka-ses-klonlama",
    "title": "Yapay Zeka Ses Klonlama",
    "description": "Kendi sesiniz veya açık izinli kayıtlarla anlatım, seslendirme ve çok dilli ses projeleri planlayın.",
    "uses": [
      "Anlatıcı sesi",
      "Seslendirme",
      "Ses referansı",
      "Çok dilli ses"
    ],
    "question": "Başkasının sesini kullanabilir miyim?",
    "answer": "Yalnızca kendi sesinizi veya konuşmacının açık izni olan kayıtları kullanın; kullanım amacı ve izin sınırlarını belirtin."
  },
  "visual_clone": {
    "slug": "yapay-zeka-gorsel-stil-aktarimi",
    "title": "Yapay Zeka Görsel Stil Aktarımı",
    "description": "İzinli görsel referanslardan renk, kompozisyon ve stil yönünü tanımlayarak özgün görsel varyasyonlar planlayın.",
    "uses": [
      "Stil referansı",
      "Renk varyasyonu",
      "Kompozisyon",
      "Özgün görsel"
    ],
    "question": "Referans görsel birebir kopyalanmalı mı?",
    "answer": "Hayır. Kullanım izni olan referansın genel görsel özelliklerini tanımlayın; korunan tasarımları birebir kopyalamayın."
  },
  "virtual_model_studio": {
    "slug": "yapay-zeka-sanal-moda-modeli",
    "title": "Yapay Zeka Sanal Moda Modeli",
    "description": "Giyim ve aksesuar katalogları için sanal model görünümü, ürün referansları, poz ve arka plan konseptleri hazırlayın.",
    "uses": [
      "Moda kataloğu",
      "Ürün modeli",
      "Aksesuar konsepti",
      "Kampanya görseli"
    ],
    "question": "Ürün detaylarının doğru kalması nasıl sağlanır?",
    "answer": "İzinli ürün fotoğraflarını farklı açılardan hazırlayın; kumaş, kesim ve ürün özelliklerini koruma gereksinimini belirtin."
  },
  "image": {
    "slug": "yapay-zeka-gorsel-olusturucu",
    "title": "Yapay Zeka Görsel Oluşturucu",
    "description": "Ürün görselleri, afişler, banner ve sosyal medya tasarımları için özgün görsel fikirleri ve format gereksinimlerini hazırlayın.",
    "uses": [
      "Ürün görseli",
      "Afiş",
      "Sosyal medya tasarımı",
      "Banner"
    ],
    "question": "Görsel istemi nasıl hazırlanır?",
    "answer": "Özne, kompozisyon, ışık, renkler, boyut ve kullanım alanını tanımlayın; izinli referansları ekleyin."
  },
  "brand_kit": {
    "slug": "yapay-zeka-marka-kimligi",
    "title": "Yapay Zeka Marka Kimliği Oluşturucu",
    "description": "Logo yönü, renk paleti, tipografi ve marka kullanım kuralları için görsel kimlik planı hazırlayın.",
    "uses": [
      "Logo konsepti",
      "Renk paleti",
      "Tipografi",
      "Marka kılavuzu"
    ],
    "question": "Marka kimliği paketinde neler olabilir?",
    "answer": "Logo yönü, renkler, yazı tipleri ve kullanım kurallarını belirleyin; düzenlenebilir dosyalar teslim kapsamına göre doğrulanır."
  },
  "document_pack": {
    "slug": "yapay-zeka-belge-olusturucu",
    "title": "Yapay Zeka Belge Oluşturucu",
    "description": "İş teklifleri, sunumlar ve ürün katalogları için hedef okuyucu, içerik düzeni ve dosya gereksinimlerini belirleyin.",
    "uses": [
      "İş teklifi",
      "Sunum",
      "Ürün kataloğu",
      "Kurumsal belge"
    ],
    "question": "Belge hazırlamak için hangi bilgileri vermeliyim?",
    "answer": "Doğrulanmış bilgiler, hedef okuyucu, marka materyalleri, gerekli bölümler ve dosya biçimini hazırlayın."
  },
  "anime_short_film": {
    "slug": "yapay-zeka-anime-kisa-film",
    "title": "Yapay Zeka Anime Kısa Film",
    "description": "Özgün anime tarzı kısa filmler için karakter, dünya, diyalog, sahne sırası ve animasyon yönünü planlayın.",
    "uses": [
      "Anime karakteri",
      "Kısa film",
      "Sahne taslağı",
      "Özgün hikâye"
    ],
    "question": "Özgün bir anime sahnesi nasıl hazırlanır?",
    "answer": "Kendi karakterinizi ve dünyanızı tanımlayın; korunan karakterleri kopyalamadan görsel yaklaşımınızı belirleyin."
  },
  "animal_video": {
    "slug": "yapay-zeka-hayvan-videosu",
    "title": "Yapay Zeka Hayvan Videosu",
    "description": "Hayvan temalı eğlence, eğitim veya ürün anlatımı için karakter, ortam, hareket ve hikâye konsepti hazırlayın.",
    "uses": [
      "Evcil hayvan videosu",
      "Hayvan animasyonu",
      "Eğitim sahnesi",
      "Ürün hikâyesi"
    ],
    "question": "Hayvan sahnesinde neler belirtilmeli?",
    "answer": "Türü, görünümü, ortamı ve hareketi tanımlayın; gerçek görüntü ile kurgusal veya üretilen sahneleri ayırın."
  },
  "nature_video": {
    "slug": "yapay-zeka-doga-videosu",
    "title": "Yapay Zeka Doğa Videosu",
    "description": "Manzara, yaban hayatı ve doğa belgeselleri için sahneler, atmosfer, anlatım ve çevre sesi ihtiyaçlarını planlayın.",
    "uses": [
      "Manzara videosu",
      "Doğa belgeseli",
      "Yaban hayatı",
      "Atmosferik sahne"
    ],
    "question": "Üretilen doğa görüntüsü gerçek çekim midir?",
    "answer": "Hayır. Yapay sahneleri canlandırma olarak etiketleyin ve belgesel bilgilerini bağımsız kaynaklarla doğrulayın."
  },
  "planet_space_video": {
    "slug": "yapay-zeka-uzay-videosu",
    "title": "Yapay Zeka Uzay Videosu",
    "description": "Gezegen anlatımları, galaksi sahneleri ve kozmik görseller için bilimsel veya kurgusal bağlamı belirleyin.",
    "uses": [
      "Gezegen anlatımı",
      "Galaksi sahnesi",
      "Uzay animasyonu",
      "Bilimsel görsel"
    ],
    "question": "Bilimsel içerik ile kurgu nasıl ayrılır?",
    "answer": "Bilimsel anlatım için güvenilir kaynakları kullanın ve sanatsal yorumlarla kurgusal sahneleri açıkça belirtin."
  },
  "drone_video": {
    "slug": "yapay-zeka-drone-tarzi-video",
    "title": "Yapay Zeka Drone Tarzı Video",
    "description": "Manzaralar ve mülkler için havadan çekim benzeri kamera yolu, görüş açısı ve görsel konseptleri planlayın.",
    "uses": [
      "Havadan görünüm",
      "Mülk tanıtımı",
      "Manzara geçişi",
      "Kamera rotası"
    ],
    "question": "Yapay drone görüntüsü gerçek havadan çekim mi?",
    "answer": "Hayır. Gerçek izinli görüntü mü yoksa simülasyon mu istediğinizi belirtin; coğrafi ayrıntıları kontrol edin."
  },
  "stickman_animation": {
    "slug": "cubuk-adam-animasyonu",
    "title": "Çubuk Adam Animasyonu Oluşturucu",
    "description": "Basit karakterlerle eğitici anlatımlar, kısa komedi ve açıklayıcı hikâyeler için sahne ve diyalog planı oluşturun.",
    "uses": [
      "Eğitici animasyon",
      "Komedi",
      "Kısa açıklama",
      "Basit hikâye"
    ],
    "question": "Etkili bir çubuk adam videosu nasıl planlanır?",
    "answer": "Tek bir mesaj veya espriye odaklanın; kısa diyalog, anlaşılır hareket ve anlatıma uygun sahne sırası oluşturun."
  },
  "studio": {
    "slug": "yapay-zeka-film-dizi-studyosu",
    "title": "Yapay Zeka Film ve Dizi Stüdyosu",
    "description": "Uzun film veya dizi fikirleri için senaryo, karakterler, bölüm planı, sahne listesi ve teslim kapsamını organize edin.",
    "uses": [
      "Film konsepti",
      "Dizi bölümleri",
      "Karakter dosyası",
      "Çekim listesi"
    ],
    "question": "Uzun projeye doğrudan başlamalı mıyım?",
    "answer": "Önce küçük bir pilotla karakterleri ve görsel yaklaşımı değerlendirin; ardından bölüm ve teslim kapsamını belirleyin."
  },
  "crelavo_academy": {
    "slug": "crelavo-akademi",
    "title": "Crelavo Akademi",
    "description": "Yapay zeka ile yaratıcı üretim konusunda öğrenme hedefleri, uygulama egzersizleri ve eğitim materyalleri planlayın.",
    "uses": [
      "Öğrenme planı",
      "Uygulama egzersizi",
      "Eğitim materyali",
      "Atölye konsepti"
    ],
    "question": "Eğitim planı nasıl hazırlanır?",
    "answer": "Beceri düzeyini, hedefi, uygulanabilir egzersizi ve öğrenmenin nasıl değerlendirileceğini belirleyin."
  },
  "community_showcase": {
    "slug": "topluluk-projeleri",
    "title": "Crelavo Topluluk Projeleri",
    "description": "Yaratıcı proje örneklerini inceleyin veya yayın hakkına sahip olduğunuz çalışmalar için paylaşım planı oluşturun.",
    "uses": [
      "Yaratıcı proje",
      "Portfolyo",
      "Video örneği",
      "Topluluk paylaşımı"
    ],
    "question": "Hangi projeleri paylaşabilirim?",
    "answer": "Size ait veya yayın izni olan çalışmaları doğru açıklamalar ve hak bilgileriyle paylaşmayı planlayın."
  }
};
export function turkishCategoryPath(id:string){return turkishCategoryProfiles[id]?"/tr/"+turkishCategoryProfiles[id].slug:undefined}
export function turkishCategoryId(slug:string){return Object.keys(turkishCategoryProfiles).find(id=>turkishCategoryProfiles[id].slug===slug)}
