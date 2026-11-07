const rows = `
Home|Ana sayfa|Startseite|Inicio|Accueil|الرئيسية
Language|Dil|Sprache|Idioma|Langue|اللغة
Setup|Ayarlar|Einrichtung|Configuración|Configuration|الإعدادات
Render final|Üretimi başlat|Produktion starten|Iniciar producción|Lancer la production|بدء الإنتاج
AI production workspace|Yapay zekâ üretim alanı|KI-Produktionsbereich|Espacio de producción IA|Espace de production IA|مساحة الإنتاج
Website production workspace|Website üretim alanı|Website-Produktionsbereich|Espacio de producción web|Espace de production web|مساحة إنتاج المواقع
Category|Kategori|Kategorie|Categoría|Catégorie|الفئة
General|Genel|Allgemein|General|Général|عام
Website|Website|Website|Sitio web|Site web|موقع ويب
Scene / page|Sahne / sayfa|Szene / Seite|Escena / página|Scène / page|المشهد / الصفحة
Status|Durum|Status|Estado|État|الحالة
Processing|İşleniyor|Wird verarbeitet|Procesando|Traitement en cours|قيد المعالجة
Output / preview area|Çıktı / önizleme alanı|Ausgabe / Vorschau|Área de resultado / vista previa|Zone de résultat / aperçu|منطقة النتائج / المعاينة
Generated media output will appear here.|Üretilen çıktı burada görünecek.|Das Ergebnis erscheint hier.|El resultado aparecerá aquí.|Le résultat apparaîtra ici.|ستظهر النتائج هنا.
Media output ready|Medya çıktısı hazır|Medienausgabe bereit|Resultado multimedia listo|Résultat multimédia prêt|النتيجة جاهزة
Page navigation|Sayfa geçişleri|Seitennavigation|Navegación de páginas|Navigation des pages|التنقل بين الصفحات
Page|Sayfa|Seite|Página|Page|صفحة
Scene|Sahne|Szene|Escena|Scène|مشهد
CREDITS|KREDİLER|GUTHABEN|CRÉDITOS|CRÉDITS|الأرصدة
SIGN IN|GİRİŞ YAP|ANMELDEN|INICIAR SESIÓN|SE CONNECTER|تسجيل الدخول
CRELAVO AI PRODUCTION MANAGER|CRELAVO YAPAY ZEKÂ ÜRETİM ASİSTANI|CRELAVO KI-PRODUKTIONSASSISTENT|ASISTENTE DE PRODUCCIÓN IA|ASSISTANT DE PRODUCTION IA|مساعد إنتاج CRELAVO
Orchestrator & category engine active|Asistan ve kategori motoru etkin|Assistent und Kategorie-Engine aktiv|Asistente y motor activos|Assistant et moteur actifs|المساعد ومحرك الفئة نشطان
Plan and approval|Plan ve onay|Plan und Freigabe|Plan y aprobación|Plan et validation|الخطة والموافقة
Package|Paket|Paket|Paquete|Forfait|الباقة
Estimated credits|Tahmini kredi|Geschätztes Guthaben|Créditos estimados|Crédits estimés|الأرصدة المقدرة
Delivery|Teslimat|Lieferung|Entrega|Livraison|التسليم
Not selected yet|Henüz seçilmedi|Noch nicht gewählt|Sin seleccionar|Non sélectionné|لم يتم الاختيار
No package selected|Paket seçilmedi|Kein Paket gewählt|Sin paquete|Aucun forfait sélectionné|لم يتم اختيار باقة
Setup incomplete|Ayarlar eksik|Einrichtung unvollständig|Configuración incompleta|Configuration incomplète|الإعداد غير مكتمل
Static website + preview + source ZIP|Statik website + önizleme + kaynak ZIP|Statische Website + Vorschau + Quellcode-ZIP|Sitio estático + vista previa + ZIP|Site statique + aperçu + ZIP source|موقع ثابت + معاينة + ZIP
Approve plan and continue to production|Planı onayla ve üretime geç|Plan freigeben und fortfahren|Aprobar plan y continuar|Valider le plan et continuer|اعتماد الخطة ومتابعة الإنتاج
Plan approved. Final production is ready to start.|Plan onaylandı. Üretim başlatılabilir.|Plan freigegeben. Produktion kann starten.|Plan aprobado. Puede iniciar la producción.|Plan validé. La production peut commencer.|تم اعتماد الخطة ويمكن بدء الإنتاج.
Active production plan|Aktif üretim planı|Aktiver Produktionsplan|Plan de producción activo|Plan de production actif|خطة الإنتاج الحالية
Active|Aktif|Aktiv|Activo|Actif|نشط
Ready|Hazır|Bereit|Listo|Prêt|جاهز
Draft|Taslak|Entwurf|Borrador|Brouillon|مسودة
Assistant|Asistan|Assistent|Asistente|Assistant|المساعد
You|Sen|Du|Tú|Vous|أنت
Assistant conversation|Asistan sohbeti|Assistentengespräch|Conversación del asistente|Conversation assistant|محادثة المساعد
Waiting for assistant response...|Asistan yanıtı bekleniyor...|Antwort wird erwartet...|Esperando respuesta...|Réponse en attente...|بانتظار رد المساعد...
Tell the assistant what you want to create...|Ne oluşturmak istediğini asistana yaz...|Beschreibe dein Vorhaben...|Describe lo que deseas crear...|Décrivez ce que vous souhaitez créer...|اكتب ما تريد إنشاءه...
Optional product or reference URL (no file upload in MVP)|İsteğe bağlı ürün veya referans bağlantısı|Optionaler Produkt- oder Referenzlink|Enlace opcional de producto o referencia|Lien produit ou référence facultatif|رابط منتج أو مرجع اختياري
UPDATE PLAN|PLANI GÜNCELLE|PLAN AKTUALISIEREN|ACTUALIZAR PLAN|METTRE À JOUR LE PLAN|تحديث الخطة
Sending...|Gönderiliyor...|Wird gesendet...|Enviando...|Envoi en cours...|جارٍ الإرسال...
FILE|DOSYA|DATEI|ARCHIVO|FICHIER|ملف
Attach file|Dosya ekle|Datei anhängen|Adjuntar archivo|Joindre un fichier|إرفاق ملف
CLOSE|KAPAT|SCHLIESSEN|CERRAR|FERMER|إغلاق
Production setup|Üretim ayarları|Produktionseinrichtung|Configuración de producción|Configuration de production|إعداد الإنتاج
Review brief in Setup|Brief bilgilerini Ayarlar bölümünde incele|Briefing in Einrichtung prüfen|Revisar brief en Configuración|Vérifier le brief dans Configuration|مراجعة المتطلبات في الإعدادات
Waiting for Website Brief|Website Brief bekleniyor|Website-Briefing ausstehend|Esperando el brief web|Brief web en attente|بانتظار متطلبات الموقع
Complete the brief before approval|Onaydan önce eksik bilgileri tamamla|Briefing vor Freigabe ergänzen|Completar el brief antes de aprobar|Compléter le brief avant validation|أكمل المتطلبات قبل الموافقة
Select a static website package|Statik website paketi seç|Statisches Website-Paket wählen|Elegir un paquete de sitio estático|Choisir un forfait de site statique|اختر باقة موقع ثابت
Review the updated plan|Güncellenen planı incele|Aktualisierten Plan prüfen|Revisar el plan actualizado|Vérifier le plan modifié|راجع الخطة المحدثة
Static scope needs revision|Statik kapsamın düzeltilmesi gerekiyor|Statischen Umfang überarbeiten|Revisar el alcance estático|Réviser le périmètre statique|يجب تعديل النطاق الثابت
Plan ready for approval|Plan onaya hazır|Plan zur Freigabe bereit|Plan listo para aprobar|Plan prêt à être validé|الخطة جاهزة للموافقة
Plan approved — ready to generate|Plan onaylandı — üretime hazır|Plan freigegeben — bereit zur Produktion|Plan aprobado — listo para producir|Plan validé — prêt à produire|تم اعتماد الخطة وهي جاهزة للإنتاج
Generating website|Website üretiliyor|Website wird erstellt|Generando sitio web|Création du site web|جارٍ إنشاء الموقع
Payment finalization pending|Ödeme sonuçlandırması bekleniyor|Zahlungsabschluss ausstehend|Finalización del pago pendiente|Finalisation du paiement en attente|بانتظار إتمام الدفع
Website ready|Website hazır|Website bereit|Sitio web listo|Site web prêt|الموقع جاهز
Generation failed — retry available|Üretim başarısız — tekrar denenebilir|Produktion fehlgeschlagen — erneut versuchen|Error de producción — puede reintentar|Échec de production — nouvel essai possible|فشل الإنتاج ويمكن إعادة المحاولة
Website Brief|Website Brief|Website-Briefing|Brief del sitio web|Brief du site web|متطلبات الموقع
Website plan and approval|Website planı ve onayı|Website-Plan und Freigabe|Plan web y aprobación|Plan web et validation|خطة الموقع والموافقة
Website Brief details|Website Brief ayrıntıları|Website-Briefing-Details|Detalles del brief web|Détails du brief web|تفاصيل متطلبات الموقع
Brand / business|Marka / işletme|Marke / Unternehmen|Marca / negocio|Marque / entreprise|العلامة / النشاط
Business description and site goal|İşletme açıklaması ve site amacı|Beschreibung und Website-Ziel|Descripción y objetivo del sitio|Description et objectif du site|وصف النشاط وهدف الموقع
Target audience|Hedef kitle|Zielgruppe|Público objetivo|Public cible|الجمهور المستهدف
Site type|Site türü|Website-Typ|Tipo de sitio|Type de site|نوع الموقع
Design style|Tasarım stili|Designstil|Estilo de diseño|Style graphique|نمط التصميم
Pages (comma separated)|Sayfalar (virgülle ayır)|Seiten (durch Kommas getrennt)|Páginas (separadas por comas)|Pages (séparées par virgules)|الصفحات مفصولة بفواصل
Static features|Statik özellikler|Statische Funktionen|Funciones estáticas|Fonctionnalités statiques|الخصائص الثابتة
Website language|Üretilen sitenin dili|Sprache der erzeugten Website|Idioma del sitio generado|Langue du site généré|لغة الموقع الناتج
English|İngilizce|Englisch|Inglés|Anglais|الإنجليزية
Turkish|Türkçe|Türkisch|Turco|Turc|التركية
Review brief — no credit charge|Brief bilgilerini incele — kredi harcanmaz|Briefing prüfen — ohne Guthabenverbrauch|Revisar brief — sin cargo|Vérifier le brief — sans débit|مراجعة المتطلبات دون خصم رصيد
Update plan — no credit charge|Planı güncelle — kredi harcanmaz|Plan aktualisieren — ohne Guthabenverbrauch|Actualizar plan — sin cargo|Mettre à jour le plan — sans débit|تحديث الخطة دون خصم رصيد
Select package|Paket seç|Paket wählen|Elegir paquete|Choisir un forfait|اختر الباقة
Landing Page|Açılış sayfası|Landingpage|Página de destino|Page de destination|صفحة هبوط
Business Website|Kurumsal website|Unternehmenswebsite|Sitio empresarial|Site professionnel|موقع أعمال
Website + Basic Admin|Website + temel yönetim|Website + einfache Verwaltung|Sitio + administración básica|Site + administration de base|موقع مع إدارة أساسية
Server-confirmed plan approval|Sunucuda doğrulanmış plan onayı|Serverbestätigte Freigabe|Aprobación confirmada por servidor|Validation confirmée par le serveur|موافقة مؤكدة من الخادم
Approve plan and credit estimate|Planı ve kredi tahminini onayla|Plan und Guthabenschätzung freigeben|Aprobar plan y créditos estimados|Valider le plan et les crédits estimés|اعتماد الخطة والأرصدة المقدرة
Refresh project|Projeyi yenile|Projekt aktualisieren|Actualizar proyecto|Actualiser le projet|تحديث المشروع
Recover interrupted generation after 3 minutes|Kesilen üretimi 3 dakika sonra kurtar|Unterbrochene Produktion nach 3 Minuten wiederherstellen|Recuperar producción tras 3 minutos|Récupérer la production après 3 minutes|استعادة الإنتاج المنقطع بعد 3 دقائق
New website project|Yeni website projesi|Neues Website-Projekt|Nuevo proyecto web|Nouveau projet web|مشروع موقع جديد
Open an existing website|Mevcut bir website aç|Bestehende Website öffnen|Abrir un sitio existente|Ouvrir un site existant|فتح موقع موجود
Load my websites|Websitelerimi getir|Meine Websites laden|Cargar mis sitios|Charger mes sites|تحميل مواقعي
Website Builder|Website Oluşturucu|Website-Builder|Creador de sitios web|Créateur de sites web|منشئ المواقع
Revisions, history and ZIP delivery|Revizyon, geçmiş ve ZIP teslimi|Überarbeitungen, Verlauf und ZIP|Revisiones, historial y entrega ZIP|Révisions, historique et livraison ZIP|التعديلات والسجل وتسليم ZIP
Project|Proje|Projekt|Proyecto|Projet|المشروع
Estimate|Tahmin|Schätzung|Estimación|Estimation|التقدير
Pages|Sayfalar|Seiten|Páginas|Pages|الصفحات
Missing|Eksik bilgiler|Fehlende Angaben|Datos faltantes|Informations manquantes|المعلومات الناقصة
Outside static scope|Statik kapsam dışında|Außerhalb des statischen Umfangs|Fuera del alcance estático|Hors du périmètre statique|خارج النطاق الثابت
credits|kredi|Guthaben|créditos|crédits|رصيد
brand|marka|Marke|marca|marque|العلامة
brief|site açıklaması|Website-Beschreibung|descripción del sitio|description du site|وصف الموقع
audience|hedef kitle|Zielgruppe|público objetivo|public cible|الجمهور
siteType|site türü|Website-Typ|tipo de sitio|type de site|نوع الموقع
style|tasarım stili|Designstil|estilo de diseño|style graphique|نمط التصميم
pages|sayfalar|Seiten|páginas|pages|الصفحات
package|paket|Paket|paquete|forfait|الباقة
Static website phase. Accounts, payments, databases and working admin modules are not included.|Statik website aşaması. Hesaplar, ödeme, veritabanı ve çalışan yönetim modülleri kapsam dışıdır.|Statische Website-Phase. Konten, Zahlungen, Datenbanken und aktive Verwaltungsfunktionen sind nicht enthalten.|Fase de sitio estático. No incluye cuentas, pagos, bases de datos ni administración funcional.|Phase de site statique. Comptes, paiements, bases de données et administration fonctionnelle non inclus.|هذه مرحلة موقع ثابت ولا تشمل الحسابات أو الدفع أو قواعد البيانات أو الإدارة الفعلية.
UPDATE PLAN saves your current production brief. Only RENDER FINAL starts credit-priced production; copy/layout/color-only revisions do not spend credits.|PLANI GÜNCELLE brief bilgilerini kaydeder. Kredili üretim yalnız ÜRETİMİ BAŞLAT ile başlar; metin, düzen ve renk revizyonları kredi harcamaz.|PLAN AKTUALISIEREN speichert das Briefing. Nur Produktion starten beginnt die kostenpflichtige Produktion.|ACTUALIZAR PLAN guarda el brief. Solo Iniciar producción consume créditos.|METTRE À JOUR LE PLAN enregistre le brief. Seul Lancer la production utilise des crédits.|تحديث الخطة يحفظ المتطلبات وبدء الإنتاج وحده يستهلك الأرصدة.
Request failed|İstek başarısız|Anfrage fehlgeschlagen|Solicitud fallida|Échec de la demande|فشل الطلب
Preview could not be loaded.|Önizleme yüklenemedi.|Vorschau konnte nicht geladen werden.|No se pudo cargar la vista previa.|Impossible de charger la prévisualisation.|تعذر تحميل المعاينة.
Loading {page} preview...|{page} önizlemesi yükleniyor...|Vorschau für {page} wird geladen...|Cargando vista previa de {page}...|Chargement de la page {page}...|جارٍ تحميل معاينة {page}...
Missing information: {fields}|Eksik bilgiler: {fields}|Fehlende Angaben: {fields}|Información faltante: {fields}|Informations manquantes : {fields}|المعلومات الناقصة: {fields}
No production has started and no credits have been spent.|Henüz üretim başlamadı ve kredi harcanmadı.|Die Produktion hat nicht begonnen und kein Guthaben wurde verbraucht.|No se ha iniciado producción ni gastado créditos.|Aucune production lancée ni aucun crédit dépensé.|لم يبدأ الإنتاج ولم يتم خصم أرصدة.
The assistant reply service is unavailable. Please try again.|Asistan yanıt servisine ulaşılamıyor. Lütfen tekrar dene.|Der Antwortdienst ist nicht verfügbar. Bitte erneut versuchen.|El servicio de respuestas no está disponible. Inténtalo de nuevo.|Le service de réponse est indisponible. Veuillez réessayer.|خدمة الرد غير متاحة. يرجى المحاولة مجدداً.
This is a static demo. Accounts, real user reviews, personalized recommendations, payments and databases are not delivered as working services.|Bu statik bir demodur. Hesaplar, gerçek kullanıcı yorumları, kişisel öneriler, ödeme ve veritabanı çalışan servis olarak teslim edilmez.|Dies ist eine statische Demo. Konten, echte Bewertungen, persönliche Empfehlungen, Zahlungen und Datenbanken sind keine aktiven Dienste.|Esta es una demo estática. Cuentas, reseñas reales, recomendaciones personales, pagos y bases de datos no son servicios funcionales.|Ce site est une démo statique. Comptes, avis réels, recommandations personnelles, paiements et bases de données ne sont pas des services fonctionnels.|هذا عرض ثابت. الحسابات والتعليقات الحقيقية والتوصيات الشخصية والدفع وقواعد البيانات ليست خدمات فعلية.
Static website plan: {brand}. Pages: {pages}.|Statik website planı: {brand}. Sayfalar: {pages}.|Statischer Website-Plan: {brand}. Seiten: {pages}.|Plan de sitio estático: {brand}. Páginas: {pages}.|Plan de site statique : {brand}. Pages : {pages}.|خطة موقع ثابت: {brand}. الصفحات: {pages}.
Review the brief and package before approving the plan.|Planı onaylamadan önce brief bilgilerini ve paketi incele.|Briefing und Paket vor Freigabe prüfen.|Revisa el brief y el paquete antes de aprobar.|Vérifiez le brief et le forfait avant de valider.|راجع المتطلبات والباقة قبل اعتماد الخطة.
Available credits|Kullanılabilir kredi|Verfügbares Guthaben|Créditos disponibles|Crédits disponibles|الأرصدة المتاحة
% completed|% tamamlandı|% abgeschlossen|% completado|% terminé|٪ مكتمل
DELIVERY READY|TESLİMAT HAZIR|LIEFERUNG BEREIT|ENTREGA LISTA|LIVRAISON PRÊTE|التسليم جاهز
DOWNLOAD MEDIA|MEDYAYI İNDİR|MEDIEN HERUNTERLADEN|DESCARGAR MEDIOS|TÉLÉCHARGER LE MÉDIA|تنزيل الوسائط
DOWNLOAD ZIP|ZIP İNDİR|ZIP HERUNTERLADEN|DESCARGAR ZIP|TÉLÉCHARGER ZIP|تنزيل ZIP
Crelavo AI Production Manager|Crelavo Yapay Zekâ Üretim Asistanı|Crelavo KI-Produktionsassistent|Asistente de producción IA|Assistant de production IA|مساعد إنتاج Crelavo
SETUP|AYARLAR|EINRICHTUNG|CONFIGURACIÓN|CONFIGURATION|الإعدادات
Smart starting point|Önerilen başlangıç|Vorgeschlagener Start|Punto inicial sugerido|Point de départ proposé|نقطة بداية مقترحة
(editable)|(düzenlenebilir)|(bearbeitbar)|(editable)|(modifiable)|(قابل للتعديل)
Legacy projects remain available in|Eski projeler burada açılabilir:|Ältere Projekte bleiben verfügbar in|Los proyectos anteriores están disponibles en|Les anciens projets restent disponibles dans|المشاريع السابقة متاحة في
Assistant is ready. Describe what you want to create.|Asistan hazır. Ne oluşturmak istediğini yaz.|Der Assistent ist bereit. Beschreibe dein Vorhaben.|El asistente está listo. Describe lo que deseas crear.|Le service est prêt. Décrivez votre projet.|المساعد جاهز. صف ما تريد إنشاءه.
Corporate Website|Kurumsal website|Unternehmenswebsite|Sitio corporativo|Site institutionnel|موقع شركة
Service Business Website|Hizmet işletmesi sitesi|Dienstleistungswebsite|Sitio de servicios|Site de services|موقع خدمات
Portfolio Website|Portfolyo sitesi|Portfolio-Website|Sitio de portafolio|Site portfolio|موقع أعمال
Blog|Blog|Blog|Blog|Blog|مدونة
Other|Diğer|Andere|Otro|Autre|أخرى
You decide for me|Benim için sen seç|Entscheide für mich|Decide por mí|Choisissez pour moi|اختر نيابة عني
Website outputs|Website çıktıları|Website-Ergebnisse|Resultados web|Résultats du site|مخرجات الموقع
Scope|Kapsam|Umfang|Alcance|Périmètre|النطاق
Public static website|Herkese açık statik website|Öffentliche statische Website|Sitio estático público|Site statique public|موقع ثابت عام
Plan status|Plan durumu|Planstatus|Estado del plan|État du plan|حالة الخطة
- Entry page:|- Başlangıç sayfası:|- Startseite:|- Página inicial:|- Page initiale:|- صفحة البداية:
Planned pages|Planlanan sayfalar|Geplante Seiten|Páginas previstas|Pages prévues|الصفحات المخططة
. Features:|. Özellikler:|. Funktionen:|. Funciones:|. Fonctionnalités :|. الخصائص:
Features|Özellikler|Funktionen|Funciones|Fonctionnalités|الخصائص
None specified|Belirtilmedi|Nicht angegeben|Sin especificar|Non précisé|غير محدد
Open preview|Önizlemeyi aç|Vorschau öffnen|Abrir vista previa|Ouvrir la prévisualisation|فتح المعاينة
Download ZIP/source|ZIP / kaynak indir|ZIP / Quellcode herunterladen|Descargar ZIP / código|Télécharger ZIP / sources|تنزيل ZIP والمصدر
Source guide|Kaynak rehberi|Quellcode-Anleitung|Guía del código|Guide des sources|دليل المصدر
Sandboxed website preview|Güvenli website önizlemesi|Isolierte Website-Vorschau|Vista previa aislada|Aperçu isolé du site|معاينة موقع معزولة
Close preview|Önizlemeyi kapat|Vorschau schließen|Cerrar vista previa|Fermer la prévisualisation|إغلاق المعاينة
Website preview|Website önizlemesi|Website-Vorschau|Vista previa del sitio|Aperçu du site|معاينة الموقع
Revise with natural language|Yazarak revize et|Mit natürlicher Sprache überarbeiten|Revisar con lenguaje natural|Réviser en langage naturel|التعديل باللغة الطبيعية
Applying...|Uygulanıyor...|Wird angewendet...|Aplicando...|Application en cours...|جارٍ التطبيق...
Apply revision|Revizyonu uygula|Änderung anwenden|Aplicar revisión|Appliquer la révision|تطبيق التعديل
Edit website content|Website içeriğini düzenle|Website-Inhalt bearbeiten|Editar contenido del sitio|Modifier le contenu du site|تعديل محتوى الموقع
Hero title|Ana başlık|Haupttitel|Título principal|Titre principal|العنوان الرئيسي
Hero text|Ana açıklama|Haupttext|Texto principal|Texte principal|النص الرئيسي
Primary button|Ana düğme|Hauptschaltfläche|Botón principal|Bouton principal|الزر الرئيسي
Site title|Site başlığı|Website-Titel|Título del sitio|Titre du site|عنوان الموقع
Tagline|Slogan|Slogan|Eslogan|Slogan|الشعار
About title|Hakkımızda başlığı|Über-uns-Titel|Título de nosotros|Titre à propos|عنوان من نحن
About text|Hakkımızda metni|Über-uns-Text|Texto de nosotros|Texte à propos|نص من نحن
Contact title|İletişim başlığı|Kontakttitel|Título de contacto|Titre de contact|عنوان التواصل
Contact text|İletişim metni|Kontakttext|Texto de contacto|Texte de contact|نص التواصل
Contact email|İletişim e-postası|Kontakt-E-Mail|Correo de contacto|E-mail de contact|بريد التواصل
Feature titles|Özellik başlıkları|Funktionstitel|Títulos de funciones|Titres des fonctions|عناوين الخصائص
Feature descriptions|Özellik açıklamaları|Funktionsbeschreibungen|Descripciones de funciones|Descriptions des fonctions|أوصاف الخصائص
Plan titles|Plan başlıkları|Tariftitel|Títulos de planes|Titres des offres|عناوين الخطط
Plan descriptions|Plan açıklamaları|Tarifbeschreibungen|Descripciones de planes|Descriptions des offres|أوصاف الخطط
Workflow step titles|İş akışı adım başlıkları|Arbeitsschritt-Titel|Títulos de pasos|Titres des étapes|عناوين خطوات العمل
Workflow step descriptions|İş akışı adım açıklamaları|Arbeitsschritt-Beschreibungen|Descripciones de pasos|Descriptions des étapes|أوصاف خطوات العمل
Menu labels|Menü etiketleri|Menütexte|Etiquetas del menú|Libellés du menu|تسميات القائمة
(one per line)|(her satıra bir tane)|(eine pro Zeile)|(uno por línea)|(un par ligne)|(واحد في كل سطر)
Footer text|Altbilgi metni|Fußzeilentext|Texto del pie|Texte du pied de page|نص التذييل
SEO description|SEO açıklaması|SEO-Beschreibung|Descripción SEO|Description SEO|وصف محركات البحث
Brand images|Marka görselleri|Markenbilder|Imágenes de marca|Images de marque|صور العلامة
Logo HTTPS URL|Logo HTTPS bağlantısı|Logo-HTTPS-Link|URL HTTPS del logo|URL HTTPS du logo|رابط HTTPS للشعار
Hero image HTTPS URL|Ana görsel HTTPS bağlantısı|Hauptbild-HTTPS-Link|URL HTTPS de imagen principal|URL HTTPS principale|رابط HTTPS للصورة الرئيسية
Frequently asked questions|Sık sorulan sorular|Häufige Fragen|Preguntas frecuentes|Questions fréquentes|الأسئلة الشائعة
FAQ|SSS|FAQ|Preguntas frecuentes|FAQ|الأسئلة الشائعة
Question|Soru|Frage|Pregunta|Question|السؤال
Answer|Yanıt|Antwort|Respuesta|Réponse|الإجابة
Move up|Yukarı taşı|Nach oben|Subir|Monter|نقل للأعلى
Move down|Aşağı taşı|Nach unten|Bajar|Descendre|نقل للأسفل
Remove question|Soruyu kaldır|Frage entfernen|Eliminar pregunta|Supprimer la question|حذف السؤال
Add question|Soru ekle|Frage hinzufügen|Añadir pregunta|Ajouter une question|إضافة سؤال
Contact delivery and publishing|İletişim ve yayınlama|Kontakt und Veröffentlichung|Contacto y publicación|Contact et publication|التواصل والنشر
Verified Formspree endpoint|Doğrulanmış Formspree adresi|Verifizierter Formspree-Endpunkt|Dirección Formspree verificada|Point Formspree vérifié|عنوان Formspree موثق
Target domain|Hedef alan adı|Zieldomain|Dominio de destino|Domaine cible|النطاق المستهدف
Formspree forms|Formspree formları|Formspree-Formulare|Formularios Formspree|Formulaires Formspree|نماذج Formspree
Create a hosting project|Hosting projesi oluştur|Hosting-Projekt erstellen|Crear proyecto alojado|Créer un projet hébergé|إنشاء مشروع استضافة
Saving...|Kaydediliyor...|Wird gespeichert...|Guardando...|Enregistrement...|جارٍ الحفظ...
Save content|İçeriği kaydet|Inhalt speichern|Guardar contenido|Enregistrer le contenu|حفظ المحتوى
Version history|Sürüm geçmişi|Versionsverlauf|Historial de versiones|Historique des versions|سجل الإصدارات
Version|Sürüm|Version|Versión|Version|الإصدار
Restore|Geri yükle|Wiederherstellen|Restaurar|Restaurer|استعادة
AI Website Builder|Yapay Zekâ Website Oluşturucu|KI-Website-Builder|Creador web con IA|Créateur de sites IA|منشئ مواقع بالذكاء الاصطناعي
Generate a premium website source package from a brief|Brief ile website kaynak paketi oluştur|Website-Paket aus Briefing erstellen|Generar código web desde un brief|Créer un paquet source depuis un brief|إنشاء حزمة مصدر موقع من المتطلبات
Enter the site type, brand context, target audience, pages, features and visual direction. The output includes renderable HTML/CSS/JS, a preview, a ZIP source bundle and an installation README.|Site türü, marka, hedef kitle, sayfalar, özellikler ve tasarımı belirt. HTML/CSS/JS, önizleme, kaynak ZIP ve kurulum rehberi teslim edilir.|Typ, Marke, Zielgruppe, Seiten, Funktionen und Design angeben. Ausgabe: HTML/CSS/JS, Vorschau, Quell-ZIP und Anleitung.|Indica tipo, marca, público, páginas, funciones y diseño. Incluye HTML/CSS/JS, vista previa, ZIP y guía.|Précisez type, marque, public, pages, fonctions et design. Résultat : HTML/CSS/JS, aperçu, ZIP et guide.|حدد النوع والعلامة والجمهور والصفحات والخصائص والتصميم. تشمل النتائج HTML/CSS/JS ومعاينة وZIP ودليل تثبيت.
Open a saved website|Kayıtlı website aç|Gespeicherte Website öffnen|Abrir sitio guardado|Ouvrir un site enregistré|فتح موقع محفوظ
Saved projects|Kayıtlı projeler|Gespeicherte Projekte|Proyectos guardados|Projets enregistrés|المشاريع المحفوظة
Select a website|Website seç|Website wählen|Seleccionar sitio|Choisir un site|اختر موقعاً
Project ID|Proje kimliği|Projekt-ID|ID de proyecto|Identifiant du projet|معرف المشروع
Existing website production ID|Mevcut website üretim kimliği|Bestehende Website-Produktions-ID|ID de producción existente|Identifiant de production existant|معرف إنتاج الموقع الموجود
Open website|Website aç|Website öffnen|Abrir sitio|Ouvrir le site|فتح الموقع
Website brief|Website brief bilgileri|Website-Briefing|Brief del sitio|Brief du site|متطلبات الموقع
Site scope|Site kapsamı|Website-Umfang|Alcance del sitio|Périmètre du site|نطاق الموقع
Public static website - no admin panel|Herkese açık statik site - yönetim paneli yok|Öffentliche statische Website - ohne Verwaltung|Sitio estático público - sin administración|Site statique public - sans administration|موقع ثابت عام دون لوحة إدارة
Public website + admin panel source starter|Website + yönetim paneli başlangıç kaynağı|Website + Verwaltungs-Quellgerüst|Sitio + código inicial de administración|Site + squelette source de gestion|موقع مع مصدر أولي للوحة إدارة
Public website + admin starter|Website + yönetim başlangıç paketi|Website + Verwaltungsgerüst|Sitio + base de administración|Site + base de gestion|موقع مع إدارة أولية
. Admin files are included only when selected.|. Yönetim dosyaları yalnız seçilirse eklenir.|. Verwaltungsdateien nur bei Auswahl.|. Archivos administrativos solo si se seleccionan.|. Fichiers de gestion uniquement si sélectionnés.|. تضاف ملفات الإدارة عند اختيارها فقط.
Brand / product|Marka / ürün|Marke / Produkt|Marca / producto|Marque / produit|العلامة / المنتج
comma-separated|virgülle ayır|durch Kommas getrennt|separados por comas|séparés par virgules|مفصولة بفواصل
Style / visual direction|Stil / görsel yön|Stil / visuelle Richtung|Estilo / dirección visual|Style / direction visuelle|النمط / الاتجاه البصري
What does it offer, what problem does it solve and what should the user do?|Ne sunuyor, hangi sorunu çözüyor ve kullanıcı ne yapmalı?|Was bietet es, welches Problem löst es und was soll der Nutzer tun?|¿Qué ofrece, qué problema resuelve y qué debe hacer el usuario?|Que propose ce site, quel problème résout-il et que doit faire le visiteur ?|ماذا يقدم وما المشكلة التي يحلها وماذا على المستخدم أن يفعل؟
Example: Change the hero title to Start faster.|Örnek: Ana başlığı Daha hızlı başla olarak değiştir.|Beispiel: Haupttitel zu Schneller starten ändern.|Ejemplo: Cambia el título a Empieza más rápido.|Exemple : Remplacez le titre par Démarrez plus vite.|مثال: غيّر العنوان إلى ابدأ أسرع.
Add, remove or reorder questions. Revision example: SSS 1 soru: Your question|Soruları ekle, kaldır veya sırala. Örnek: SSS 1 soru: Sorunuz|Fragen hinzufügen, entfernen oder sortieren. Beispiel: SSS 1 soru: Ihre Frage|Añade, elimina u ordena preguntas. Ejemplo: SSS 1 soru: Tu pregunta|Ajoutez, supprimez ou triez les questions. Exemple : SSS 1 soru: Votre question|أضف أو احذف أو رتب الأسئلة. مثال: SSS 1 soru: سؤالك
Connect your own verified Formspree form. No API secret is stored in the source. Submission is enabled in the published source only; preview submissions stay blocked.|Kendi doğrulanmış Formspree formunu bağla. Kaynakta API sırrı tutulmaz. Form gönderimi yalnız yayınlanan sitede etkin, önizlemede kapalıdır.|Eigenes verifiziertes Formspree-Formular verbinden. Keine API-Geheimnisse im Quellcode. Versand nur nach Veröffentlichung, nicht in Vorschau.|Conecta tu formulario Formspree verificado. Sin secretos API en el código. Envíos solo en el sitio publicado, no en vista previa.|Connectez votre formulaire Formspree vérifié. Aucun secret API dans le code. Envoi sur le site publié uniquement, pas en aperçu.|اربط نموذج Formspree الموثق. لا تحفظ أسرار API في المصدر. الإرسال للموقع المنشور فقط وليس المعاينة.
Saving a domain does not deploy or change DNS. The ZIP includes PUBLISHING-GUIDE.md with hosting, DNS and HTTPS steps.|Alan adını kaydetmek yayınlama veya DNS değişikliği yapmaz. ZIP içindeki PUBLISHING-GUIDE.md hosting, DNS ve HTTPS adımlarını açıklar.|Domain speichern veröffentlicht nichts und ändert kein DNS. PUBLISHING-GUIDE.md erklärt Hosting, DNS und HTTPS.|Guardar el dominio no publica ni cambia DNS. PUBLISHING-GUIDE.md explica hosting, DNS y HTTPS.|Enregistrer le domaine ne publie rien et ne change pas le DNS. PUBLISHING-GUIDE.md explique hébergement, DNS et HTTPS.|حفظ النطاق لا ينشر الموقع ولا يغير DNS. دليل PUBLISHING-GUIDE.md يوضح الاستضافة وDNS وHTTPS.
Waiting for a production request|Üretim talebi bekleniyor|Produktionsanfrage ausstehend|Esperando solicitud de producción|Demande de production en attente|بانتظار طلب إنتاج
Building...|Oluşturuluyor...|Wird erstellt...|Generando...|Création en cours...|جارٍ الإنشاء...
Generate website package|Website paketini oluştur|Website-Paket erstellen|Generar paquete web|Créer le paquet du site|إنشاء حزمة الموقع
Saved website opened. Latest content and history loaded.|Kayıtlı website açıldı. Son içerik ve geçmiş yüklendi.|Gespeicherte Website geöffnet. Inhalt und Verlauf geladen.|Sitio guardado abierto. Contenido e historial cargados.|Site enregistré ouvert. Contenu et historique chargés.|تم فتح الموقع المحفوظ وتحميل المحتوى والسجل.
Natural-language revision saved.|Yazılı revizyon kaydedildi.|Textrevision gespeichert.|Revisión guardada.|Révision enregistrée.|تم حفظ التعديل.
Website content saved. Preview and downloadable source files now use the latest copy.|İçerik kaydedildi. Önizleme ve kaynak dosyaları güncel içeriği kullanıyor.|Inhalt gespeichert. Vorschau und Quelldateien verwenden den aktuellen Text.|Contenido guardado. Vista previa y archivos usan la versión actual.|Contenu enregistré. Aperçu et sources utilisent la version actuelle.|تم حفظ المحتوى. تستخدم المعاينة وملفات المصدر النسخة الحالية.
Version {version} restored.|Sürüm {version} geri yüklendi.|Version {version} wiederhergestellt.|Versión {version} restaurada.|Version {version} restaurée.|تمت استعادة الإصدار {version}.
Applying natural-language revision...|Yazılı revizyon uygulanıyor...|Textrevision wird angewendet...|Aplicando revisión...|Application de la révision...|جارٍ تطبيق التعديل...
Restoring selected version...|Seçilen sürüm geri yükleniyor...|Ausgewählte Version wiederherstellen...|Restaurando versión...|Restauration de la version...|جارٍ استعادة الإصدار...
Saving website content...|Website içeriği kaydediliyor...|Website-Inhalt speichern...|Guardando contenido...|Enregistrement du contenu...|جارٍ حفظ محتوى الموقع...
draft|taslak|Entwurf|borrador|brouillon|مسودة
approved|onaylandı|freigegeben|aprobado|validé|معتمد
ready|hazır|bereit|listo|prêt|جاهز
{count} saved websites found.|{count} kayıtlı website bulundu.|{count} gespeicherte Websites gefunden.|Se encontraron {count} sitios guardados.|{count} sites enregistrés trouvés.|تم العثور على {count} مواقع محفوظة.
Project list failed.|Proje listesi yüklenemedi.|Projektliste konnte nicht geladen werden.|No se pudo cargar la lista.|Impossible de charger la liste.|تعذر تحميل قائمة المشاريع.
You must sign in to continue.|Devam etmek için giriş yapmalısın.|Zum Fortfahren anmelden.|Inicia sesión para continuar.|Connectez-vous pour continuer.|سجل الدخول للمتابعة.
Project could not be opened.|Proje açılamadı.|Projekt konnte nicht geöffnet werden.|No se pudo abrir el proyecto.|Impossible d’ouvrir le projet.|تعذر فتح المشروع.
Revision failed.|Revizyon uygulanamadı.|Überarbeitung fehlgeschlagen.|Falló la revisión.|La révision a échoué.|فشل التعديل.
Rollback failed.|Sürüm geri yüklenemedi.|Wiederherstellung fehlgeschlagen.|Falló la restauración.|La restauration a échoué.|فشلت الاستعادة.
Website request failed.|Website isteği başarısız.|Website-Anfrage fehlgeschlagen.|Falló la solicitud del sitio.|La demande du site a échoué.|فشل طلب الموقع.
Website content update failed.|Website içeriği güncellenemedi.|Website-Inhalt konnte nicht aktualisiert werden.|No se pudo actualizar el contenido.|Impossible de modifier le contenu.|تعذر تحديث محتوى الموقع.
`;
export const workspaceLanguages = ["en", "tr", "de", "es", "fr", "ar"] as const;
const table = new Map<string, Record<string, string>>();
const reverse = new Map<string, string>();
for (const row of rows.trim().split("\n")) {
  const values = row.split("|"); if (values.length !== 6) throw new Error("Invalid workspace translation: " + values[0]);
  table.set(values[0], Object.fromEntries(workspaceLanguages.map((language, index) => [language, values[index]])));
  for (const value of values) if (!reverse.has(value)) reverse.set(value, values[0]);
}
export const workspaceTranslationSources = [...table.keys()];
export function translateWorkspaceText(value: string, language = "en", variables: Record<string, string | number> = {}) {
  const aliases: Record<string, string> = { "REVISE THIS SCENE / PRODUCTION CONTINUES": "Waiting for a production request", "WAITING FOR ASSISTANT REPLY / NO PRODUCTION OR CREDIT SPEND": "Waiting for assistant response...", "ASSISTANT REPLIED / REVIEW PLAN BEFORE PRODUCTION": "Review the updated plan", "PLAN APPROVED / FINAL PRODUCTION READY": "Plan approved — ready to generate", website_brief_incomplete: "Complete the brief before approval", website_select_static_package: "Select a static website package", website_static_scope_only: "Static scope needs revision", website_plan_changed_review_again: "Review the updated plan", website_package_price_changed_review_again: "Review the updated plan" };
  value = aliases[value] || value;
  const exact = table.has(value) ? value : reverse.get(value);
  const colon = !exact && value.endsWith(":") ? ":" : "";
  const normalized = exact || (colon ? value.slice(0, -1).trim() : value);
  const source = table.has(normalized) ? normalized : reverse.get(normalized) || normalized;
  const translated = table.get(source)?.[language] || table.get(source)?.en || normalized;
  return (translated + colon).replace(/\{(\w+)\}/g, (match, name) => String(variables[name] ?? match));
}
export function websiteWorkspaceStatus(project: { status: string; website: { runtimeDevelopment?: boolean; runtimeAccepted?: boolean; missing: string[]; unsupported: string[]; packId: string; credits: number | null; review?: { ready: boolean; blockers: string[] } } } | null, dirty: boolean, approved: boolean) {
  if (!project) return "Waiting for Website Brief";
  if (project.status === "generating") return "Generating website";
  if (project.status === "awaiting_payment") return "Payment finalization pending";
  if (project.status === "generation_failed") return "Generation failed — retry available";
  if (dirty) return "Review the updated plan";
  if (project.status === "ready") return "Website ready";
  if (project.website.runtimeDevelopment && !project.website.runtimeAccepted && !project.website.missing.length) return "Uygulama planı ve kaynak kabul testi bekleniyor";
  if (!project.website.runtimeDevelopment && project.website.unsupported.length) return "Static scope needs revision";
  if (project.website.missing.length) return "Complete the brief before approval";
  if (!project.website.packId || project.website.credits === null) return "Select a static website package";
  if (project.website.review && !project.website.review.ready) return "Review the updated plan";
  return approved ? "Plan approved — ready to generate" : "Plan ready for approval";
}
