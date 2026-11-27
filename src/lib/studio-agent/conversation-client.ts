export const studioConversationClientScript=String.raw`(()=>{
const $=selector=>document.querySelector(selector);
let session=null,project=null,mockState='',mode=window.__studioB2?.mockAllowed?'mock':'real',epoch=0,busy=false,pending=null,status=null,walletCache=null,uiError='';
let liveProductionBalance=null;
let activeVideoSelection=null;
let serverPlanning=null;let canvasState='empty',selectedProduction=null,websiteData=null,device='desktop',activeView='canvas',referenceFile=null,previewEpoch=0;
const availableStudioLanguages=['en','tr','de','es','fr','ar'];
let storedStudioLanguage='en',siteLanguageExplicit=false;
try{const saved=localStorage.getItem('clipora_language');siteLanguageExplicit=Boolean(saved);storedStudioLanguage=saved||'en'}catch(_error){}
// Explicit uiLang always wins. Otherwise inherit the homepage choice.
const requestedStudioLanguage=new URLSearchParams(parent.location.search).get('uiLang');
let language=availableStudioLanguages.includes(requestedStudioLanguage)?requestedStudioLanguage:
 (siteLanguageExplicit?storedStudioLanguage:'en');
if(!availableStudioLanguages.includes(language))language='en';
const words={
tr:['Konuşma','Yeni sohbet projesi','Mesaj gönder','Dosya seç','Proje bağlamı','Önce oturum açın.','Bir mesaj yazın…','Mock demo: Yanıtlar ve bakiyeler simülasyondur. Hafıza tarayıcıda imzalı demo kaydıdır; gerçek AI/DB değildir.','Gerçek AI yalnızca atomik muhasebe ve sunucu tarifesi etkinse çalışır.','Dosya yalnızca seçildi; yükleme ve modele aktarım henüz bağlı değil.','Üretim ve revizyon araçları henüz bağlı değil.','Varsayılanları kullan','Kayıtlı Website projeleri','Salt okunur önizleme','İşlem tamamlanamadı. Otomatik tekrar yapılmadı.','Gönderiliyor…','Bu kategori için projenizi konuşarak hazırlayalım.','Kayıtlı sohbetler'],
en:['Conversation','New chat project','Send message','Choose file','Project context','Sign in first.','Write a message…','Mock demo: replies and balances are simulated. Memory is a signed browser demo, not real AI/database storage.','Real AI requires enabled atomic accounting and a server tariff.','File selected only; upload and model attachment are not connected yet.','Production and revision tools are not connected yet.','Use defaults','Saved Website projects','Read-only preview','The request failed. It was not retried automatically.','Sending…','Let’s prepare your project through conversation.','Saved conversations'],
de:['Gespräch','Neues Chat-Projekt','Nachricht senden','Datei auswählen','Projektkontext','Bitte zuerst anmelden.','Nachricht schreiben…','Mock-Demo: Antworten und Guthaben sind simuliert. Signierter Browser-Speicher, keine echte KI/Datenbank.','Echte KI benötigt atomare Abrechnung und einen Servertarif.','Datei nur ausgewählt; Upload und Modell-Anhang sind noch nicht verbunden.','Produktion und Überarbeitung sind noch nicht verbunden.','Standardwerte verwenden','Gespeicherte Websites','Schreibgeschützte Vorschau','Anfrage fehlgeschlagen. Keine automatische Wiederholung.','Wird gesendet…','Besprechen wir Ihr Projekt.','Gespeicherte Gespräche'],
es:['Conversación','Nuevo proyecto','Enviar mensaje','Elegir archivo','Contexto del proyecto','Inicia sesión primero.','Escribe un mensaje…','Demo mock: respuestas y saldos simulados. Memoria firmada en el navegador, no IA/base de datos real.','La IA real requiere contabilidad atómica y tarifa del servidor.','Archivo seleccionado; la carga y el adjunto al modelo aún no están conectados.','Producción y revisión aún no están conectadas.','Usar valores predeterminados','Sitios guardados','Vista de solo lectura','Falló la solicitud. No hubo reintento automático.','Enviando…','Preparemos tu proyecto conversando.','Conversaciones guardadas'],
fr:['Conversation','Nouveau projet','Envoyer','Choisir un fichier','Contexte du projet','Connectez-vous d’abord.','Écrivez un message…','Démo mock : réponses et soldes simulés. Mémoire signée du navigateur, pas une vraie IA/base de données.','L’IA réelle exige une comptabilité atomique et un tarif serveur.','Fichier sélectionné seulement ; téléversement et pièce jointe non connectés.','Production et révision non connectées.','Utiliser les valeurs par défaut','Sites enregistrés','Aperçu en lecture seule','La demande a échoué, sans nouvelle tentative automatique.','Envoi…','Préparons votre projet par la conversation.','Conversations enregistrées'],
ar:['المحادثة','مشروع محادثة جديد','إرسال رسالة','اختيار ملف','سياق المشروع','سجل الدخول أولاً.','اكتب رسالة…','عرض تجريبي: الردود والأرصدة محاكاة. ذاكرة موقعة في المتصفح وليست ذكاءً أو قاعدة بيانات حقيقية.','الذكاء الحقيقي يتطلب محاسبة ذرية وتسعير الخادم.','تم اختيار الملف فقط؛ الرفع وإرفاقه بالنموذج غير متصلين.','أدوات الإنتاج والمراجعة غير متصلة.','استخدام الإعدادات الافتراضية','المواقع المحفوظة','معاينة للقراءة فقط','فشل الطلب دون إعادة محاولة تلقائية.','جارٍ الإرسال…','لنجهز مشروعك عبر المحادثة.','المحادثات المحفوظة']};
if(!words[language])language='en';const t=index=>words[language][index];
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const studioUiTranslations=[["Oluştur, düzenle ve üret","Create, edit and produce","Erstellen, bearbeiten und produzieren","Crea, edita y produce","Créer, modifier et produire","أنشئ وعدّل وأنتج"],["Kategoriler","Categories","Kategorien","Categorías","Catégories","الفئات"],["Assistant","Assistant","Assistent","Asistente","Assistant","المساعد"],["Projelerim","My projects","Meine Projekte","Mis proyectos","Mes projets","مشاريعي"],["Sohbet projeleri","Chat projects","Chatprojekte","Proyectos de chat","Projets de discussion","مشاريع المحادثة"],["Kayıtlı sohbetler","Saved chats","Gespeicherte Chats","Chats guardados","Discussions enregistrées","محادثات محفوظة"],["Projelerin için ortak çalışma alanı.","One workspace for all your projects.","Ein Arbeitsbereich für alle Projekte.","Un espacio para tus proyectos.","Un espace pour tous vos projets.","مساحة عمل لجميع مشاريعك"],["Üretim bu aşamada kapalı.","Production is not enabled for all tools.","Produktion ist nicht für alle Tools aktiviert.","La producción no está activa para todas las herramientas.","La production n'est pas activée pour tous les outils.","الإنتاج غير متاح لجميع الأدوات"],["Yeni proje","New project","Neues Projekt","Nuevo proyecto","Nouveau projet","مشروع جديد"],["Website çalışma alanı","Website workspace","Website-Arbeitsbereich","Espacio de sitios web","Espace de site web","مساحة عمل الموقع"],["Referanslar","References","Referenzen","Referencias","Références","المراجع"],["Henüz çıktı yok","No output yet","Noch keine Ausgabe","Sin resultados todavía","Aucun résultat","لا توجد نتائج"],["Website projen için boş bir Canvas","Your website Canvas is empty","Deine Website-Arbeitsfläche ist leer","El lienzo de tu sitio está vacío","Votre espace web est vide","مساحة موقعك فارغة"],["İstediğin siteyi sağdaki asistanla konuşarak hazırlayabilir veya kayıtlı bir Website projesini açabilirsin.","Describe your website to the assistant or open a saved project.","Beschreibe deine Website dem Assistenten oder öffne ein Projekt.","Describe tu web al asistente o abre un proyecto.","Décrivez votre site à l'assistant ou ouvrez un projet.","صف موقعك للمساعد أو افتح مشروعًا محفوظًا"],["Asistanla başla","Start with assistant","Mit Assistent starten","Empezar con asistente","Démarrer avec l'assistant","ابدأ مع المساعد"],["Proje aç","Open project","Projekt öffnen","Abrir proyecto","Ouvrir le projet","افتح المشروع"],["Mevcut Website kaynağı · salt okunur","Existing website · read only","Bestehende Website · schreibgeschützt","Sitio existente · solo lectura","Site existant · lecture seule","موقع موجود · قراءة فقط"],["Website sayfası","Website page","Website-Seite","Página web","Page du site","صفحة الموقع"],["Masaüstü","Desktop","Desktop","Escritorio","Ordinateur","سطح المكتب"],["Tablet","Tablet","Tablet","Tableta","Tablette","جهاز لوحي"],["Mobil","Mobile","Mobil","Móvil","Mobile","الهاتف"],["Crelavo AI Assistant","Crelavo AI Assistant","Crelavo KI-Assistent","Asistente IA de Crelavo","Assistant IA Crelavo","مساعد كريلافو الذكي"],["Yaratıcı çalışma arkadaşın","Your creative partner","Dein kreativer Partner","Tu socio creativo","Votre partenaire créatif","شريكك الإبداعي"],["Sohbet ayarları","Chat settings","Chat-Einstellungen","Ajustes del chat","Paramètres du chat","إعدادات المحادثة"],["Konuşma dili","Conversation language","Gesprächssprache","Idioma de conversación","Langue de conversation","لغة المحادثة"],["Çalışma modu","Workspace mode","Arbeitsmodus","Modo de trabajo","Mode de travail","وضع العمل"],["Yeni sohbet projesi","New chat project","Neues Chatprojekt","Nuevo proyecto de chat","Nouveau projet de chat","مشروع محادثة جديد"],["Proje bağlamı","Project context","Projektkontext","Contexto del proyecto","Contexte du projet","سياق المشروع"],["Varsayılanları kullan","Use defaults","Standardwerte nutzen","Usar valores predeterminados","Utiliser les paramètres par défaut","استخدم الإعدادات الافتراضية"],["Bir mesaj yazın…","Write a message…","Nachricht schreiben…","Escribe un mensaje…","Écrire un message…","اكتب رسالة…"],["Mesaj gönder ↗","Send message ↗","Nachricht senden ↗","Enviar mensaje ↗","Envoyer le message ↗","إرسال ↗"],["＋ Dosya","＋ File","＋ Datei","＋ Archivo","＋ Fichier","＋ ملف"],["Sohbet çıktısı, üretilmiş medya veya Website değildir.","A chat response is not a generated file or website.","Eine Chatantwort ist keine erstellte Datei oder Website.","Una respuesta de chat no es un archivo ni sitio generado.","Une réponse n'est pas un fichier ou un site généré.","رد المحادثة ليس ملفاً أو موقعاً مُنشأً"],["Website üretim planı","Website production plan","Website-Produktionsplan","Plan de producción web","Plan de production web","خطة إنشاء الموقع"],["Website oluştur","Create website","Website erstellen","Crear sitio web","Créer un site web","إنشاء موقع"],["Canvas önizleme","Canvas preview","Canvas-Vorschau","Vista previa","Aperçu du Canvas","معاينة اللوحة"],["ZIP indir","Download ZIP","ZIP herunterladen","Descargar ZIP","Télécharger ZIP","تنزيل ZIP"],["Planı Canvas'ta incele","Review plan in Canvas","Plan im Canvas prüfen","Revisar plan en Canvas","Voir le plan dans Canvas","راجع الخطة"],["Brief hazır · plan kontrolü bekleniyor","Brief ready · review plan","Brief bereit · Plan prüfen","Brief listo · revisar plan","Brief prêt · revoir le plan","الموجز جاهز · راجع الخطة"],["İşletme adını ve istediğin web sitesini anlat","Describe your business and website","Beschreibe Unternehmen und Website","Describe tu empresa y sitio","Décrivez votre entreprise et votre site","صف عملك والموقع المطلوب"],["Plan onaylandı","Plan approved","Plan bestätigt","Plan aprobado","Plan approuvé","تمت الموافقة على الخطة"],["Brief hazırlanıyor · eksik bilgileri tamamlayın","Preparing brief · add missing details","Brief vorbereiten · Angaben ergänzen","Preparando brief · completa datos","Préparation du brief · complétez","جارٍ إعداد الموجز"],["Henüz referans seçilmedi. Dosya seçimi sunucuya yükleme veya üretim başlatmaz.","No reference selected. Selecting a file does not upload it or start production.","Keine Referenz ausgewählt.","No hay referencia seleccionada.","Aucune référence sélectionnée.","لم يتم اختيار مرجع"]];
studioUiTranslations.push(...[["Sayfa yok","No pages","Keine Seiten","Sin páginas","Aucune page","لا توجد صفحات"],["Bu projede görüntülenebilir Website çıktısı yok","No website output to preview","Keine Website-Vorschau vorhanden","Sin sitio para previsualizar","Aucun site à prévisualiser","لا يوجد موقع للمعاينة"],["Kayıtlı proje ve mevcut site kaynağı kontrol ediliyor.","Loading saved project and existing website files.","Gespeichertes Projekt wird geladen.","Cargando proyecto guardado.","Chargement du projet enregistré.","جارٍ تحميل المشروع"],["Henüz kayıtlı Website yok.","No saved websites yet.","Noch keine Websites gespeichert.","No hay sitios guardados.","Aucun site enregistré.","لا توجد مواقع محفوظة"],["Kaydedilmiş proje","Saved project","Gespeichertes Projekt","Proyecto guardado","Projet enregistré","مشروع محفوظ"],["Güncel planı kontrol et","Review current plan","Aktuellen Plan prüfen","Revisar plan actual","Vérifier le plan actuel","راجع الخطة الحالية"],["Website üretimi henüz yayına açık değil.","Paid website production is not available yet.","Kostenpflichtige Website-Produktion ist noch nicht verfügbar.","La producción web de pago aún no está disponible.","La production web payante n'est pas encore disponible.","إنتاج المواقع المدفوع غير متاح بعد"],["İşlem tamamlanamadı. Otomatik tekrar yapılmadı.","The request failed. It was not retried automatically.","Anfrage fehlgeschlagen. Kein automatischer Versuch.","La solicitud falló sin reintento automático.","La demande a échoué sans nouvel essai.","فشل الطلب دون إعادة المحاولة"],["Website Builder taslağı oluştur","Create Website Builder draft","Website-Entwurf erstellen","Crear borrador web","Créer un brouillon web","إنشاء مسودة الموقع"],["Website üretim kontrolü","Website production review","Website-Produktion prüfen","Revisión de producción web","Vérification de production web","مراجعة إنشاء الموقع"],["Planı ve ","Review and approve ","Plan und ","Revisar y aprobar ","Vérifier et approuver ","مراجعة واعتماد "],["Durum: ","Status: ","Status: ","Estado: ","Statut : ","الحالة: "],["Paket: ","Package: ","Paket: ","Paquete: ","Forfait : ","الباقة: "],["Ücret: ","Cost: ","Kosten: ","Costo: ","Coût : ","التكلفة: "]]);
studioUiTranslations.push(...[["Website projesi","Website project","Website-Projekt","Proyecto web","Projet web","مشروع الموقع"],["Website Preview - Doğrulanmış kaynak, salt okunur","Website preview · Verified source · Read-only","Website-Vorschau · Nur lesen","Vista previa · Solo lectura","Aperçu du site · Lecture seule","معاينة الموقع · قراءة فقط"],["Website Preview · Doğrulanmış kaynak, salt okunur","Website preview · Verified source · Read-only","Website-Vorschau · Nur lesen","Vista previa · Solo lectura","Aperçu du site · Lecture seule","معاينة الموقع · قراءة فقط"],["Sayfalar / Cihaz / Tasarım","Pages / Device / Design","Seiten / Gerät / Design","Páginas / Dispositivo / Diseño","Pages / Appareil / Design","الصفحات / الجهاز / التصميم"],["Yenile","Refresh","Aktualisieren","Actualizar","Actualiser","تحديث"],["Tasarımı düzenle","Edit design","Design bearbeiten","Editar diseño","Modifier le design","تعديل التصميم"],["Revizyon","Revision","Überarbeitung","Revisión","Révision","مراجعة"],["Kaynak dışa aktar","Export source","Quellcode exportieren","Exportar código","Exporter le code","تصدير المصدر"],["Kaydet","Save","Speichern","Guardar","Enregistrer","حفظ"],["Sayfayı düzenle","Edit page","Seite bearbeiten","Editar página","Modifier la page","تعديل الصفحة"],["Yeniden boyutlandır","Resize","Größe ändern","Cambiar tamaño","Redimensionner","تغيير الحجم"],["Pages & Responsive Preview","Pages & Responsive Preview","Seiten & Vorschau","Páginas y vista previa","Pages et aperçu","الصفحات والمعاينة"],["Gerçek sohbet","Live chat","Live-Chat","Chat real","Discussion en direct","محادثة مباشرة"],["Bu kategori için projeni konuşarak hazırlayalım.","Describe your project to get started.","Beschreibe dein Projekt.","Describe tu proyecto.","Décrivez votre projet.","صف مشروعك للبدء"],["İşletme adını ve istediğin web sitesini anlat","Tell us about your business and website","Erzähle von Unternehmen und Website","Cuéntanos sobre tu empresa y sitio","Décrivez votre entreprise et votre site","أخبرنا عن عملك وموقعك"],["Proje oluştur","Create project","Projekt erstellen","Crear proyecto","Créer un projet","إنشاء مشروع"],["Kayıtlı Website projeleri","Saved website projects","Gespeicherte Website-Projekte","Proyectos web guardados","Projets web enregistrés","مشاريع المواقع المحفوظة"],["Kayıtlı Website yok.","No saved websites.","Keine gespeicherten Websites.","No hay sitios guardados.","Aucun site enregistré.","لا توجد مواقع محفوظة"],["Website Builder taslağı ve seçilen paket kaydedildi.","Website draft and selected package saved.","Website-Entwurf und Paket gespeichert.","Borrador y paquete guardados.","Brouillon et forfait enregistrés.","تم حفظ المسودة والباقة"],["Üretim başlatılmadı, kredi harcanmadı.","Production has not started. No credits spent.","Produktion nicht gestartet. Keine Credits verbraucht.","Producción no iniciada. Sin créditos gastados.","Production non lancée. Aucun crédit dépensé.","لم يبدأ الإنتاج ولم تُخصم أرصدة"],["Plan oluşturulmadı","No plan yet","Noch kein Plan","Sin plan aún","Aucun plan","لا توجد خطة"],["Üretim kapalı","Production disabled","Produktion deaktiviert","Producción desactivada","Production désactivée","الإنتاج معطل"],["Bilgi toplanıyor","Gathering requirements","Anforderungen sammeln","Recopilando requisitos","Collecte des besoins","جمع المتطلبات"],["Brief sürümü","Brief version","Brief-Version","Versión del brief","Version du brief","إصدار الموجز"],["Kategori planı · sohbet taslağı","Category plan · Draft","Kategorieplan · Entwurf","Plan de categoría · Borrador","Plan de catégorie · Brouillon","خطة الفئة · مسودة"],["Sohbet taslağı · üretim henüz başlatılmadı · kredi tahsil edilmedi","Draft chat · No production or credit charge","Entwurf · Keine Produktion oder Abbuchung","Borrador · Sin producción ni cobro","Brouillon · Pas de production ni débit","مسودة · دون إنتاج أو خصم"],["Brief & Plan","Brief & Plan","Briefing & Plan","Brief y plan","Brief et plan","الموجز والخطة"],["Website oluşturma, önizleme, revizyon ve ZIP","Website creation, preview, revisions and ZIP","Website-Erstellung, Vorschau und ZIP","Crear web, vista previa y ZIP","Créer, prévisualiser et exporter","إنشاء الموقع والمعاينة والتنزيل"],["Website üretim planı","Website production plan","Website-Produktionsplan","Plan de producción web","Plan de production web","خطة إنتاج الموقع"],["Üretim ve kredi tahsilatı başlatılmaz; sohbet yalnız bu tarayıcı sekmesinde saklanır.","This chat stays in this browser tab and does not start paid production.","Dieser Chat bleibt in diesem Browser-Tab.","Este chat permanece en esta pestaña.","Cette discussion reste dans cet onglet.","تبقى المحادثة في علامة التبويب هذه"]]);
studioUiTranslations.push(...[["Sahneler / Timeline","Scenes / Timeline","Szenen / Zeitleiste","Escenas / Cronología","Scènes / Chronologie","المشاهد / المخطط الزمني"],["0 klip","0 clips","0 Clips","0 clips","0 clips","٠ مقاطع"],["0 çıktı","0 outputs","0 Ausgaben","0 resultados","0 résultats","٠ نتائج"],["Süre henüz yok","Duration not available","Dauer nicht verfügbar","Duración no disponible","Durée indisponible","المدة غير متاحة"],["Henüz medya veya varyasyon yok. Sahte çıktı gösterilmez.","No media or variants yet. No simulated results are shown.","Noch keine Medien oder Varianten.","Aún no hay medios ni variantes.","Pas encore de médias ou de variantes.","لا توجد وسائط أو نسخ بعد"],["Asistanı odakla","Focus assistant","Assistent fokussieren","Ir al asistente","Afficher l'assistant","الانتقال إلى المساعد"],["Metin düzenleme henüz bağlı değil.","Text editing is not available yet.","Textbearbeitung noch nicht verfügbar.","La edición de texto aún no está disponible.","Modification du texte non disponible.","تحرير النص غير متاح"],["Katman düzenleme henüz bağlı değil.","Layer editing is not available yet.","Ebenenbearbeitung noch nicht verfügbar.","La edición de capas aún no está disponible.","Modification des calques indisponible.","تحرير الطبقات غير متاح"],["Görsel düzenleme henüz bağlı değil.","Image editing is not available yet.","Bildbearbeitung noch nicht verfügbar.","La edición de imágenes aún no está disponible.","Retouche d'image indisponible.","تحرير الصورة غير متاح"],["Referans dosyası seç","Choose reference file","Referenzdatei auswählen","Elegir archivo de referencia","Choisir un fichier de référence","اختر ملفًا مرجعيًا"],["16:9 önizleme · Video çıktısı yok","16:9 preview · No rendered video","16:9-Vorschau · Kein Video","Vista previa 16:9 · Sin vídeo","Aperçu 16:9 · Aucune vidéo","معاينة ١٦:٩ · لا يوجد فيديو"],["Karakter Canvas · Kimlik ve poz referansları","Character Canvas · Identity and poses","Charakter-Canvas · Identität und Posen","Lienzo de personaje · Identidad y poses","Canvas personnage · Identité et poses","لوحة الشخصية · الهوية والوضعيات"],["Görsel Canvas · Henüz varyasyon yok","Image Canvas · No variants yet","Bild-Canvas · Noch keine Varianten","Lienzo de imagen · Sin variantes","Canvas image · Aucune variante","لوحة الصورة · لا توجد نسخ"],["AI Character · Referanslar ve tutarlılık","AI Character · References and consistency","KI-Charakter · Referenzen und Konsistenz","Personaje IA · Referencias y coherencia","Personnage IA · Références et cohérence","شخصية AI · المراجع والاتساق"],["Henüz referans yok","No references yet","Noch keine Referenzen","Sin referencias todavía","Aucune référence","لا توجد مراجع"],["Henüz görsel veya varyasyon yok. Katman düzenleme bağlı değil.","No images or variants yet. Layer editing is unavailable.","Noch keine Bilder oder Varianten. Ebenenbearbeitung nicht verfügbar.","Sin imágenes ni variantes. La edición de capas no está disponible.","Aucune image ni variante. L'édition des calques est indisponible.","لا توجد صور أو نسخ. تحرير الطبقات غير متاح"],["Henüz doğrulanmış bir Website kaynağı veya sayfa yok. Sayfa üretilmedi.","No verified website source or pages yet.","Noch keine verifizierten Website-Dateien oder Seiten.","Aún no hay archivos ni páginas web verificados.","Aucune page ni source web vérifiée.","لا يوجد مصدر موقع أو صفحات تم التحقق منها"],["Henüz video veya ses klibi yok. Kaynak içe aktarma, klip ekleme ve düzenleme araçları bağlı değil.","No video or audio clips yet. Import and editing are unavailable.","Noch keine Video- oder Audioclips. Import und Bearbeitung sind nicht verfügbar.","Sin clips de vídeo ni audio. Importación y edición no disponibles.","Aucun clip vidéo ou audio. Import et montage indisponibles.","لا توجد مقاطع فيديو أو صوت. الاستيراد والتحرير غير متاحين"],["Henüz üretilmiş varyasyon yok. Örnek görsel veya video gösterilmez.","No generated variants yet. Sample media is not shown.","Noch keine Varianten. Keine Beispielmedien.","Sin variantes generadas. No se muestran ejemplos.","Aucune variante générée. Aucun média fictif.","لا توجد نسخ منتجة. لا تظهر عينات وهمية"],["Proje bilgileri","Project details","Projektdetails","Detalles del proyecto","Détails du projet","تفاصيل المشروع"],["Proje bilgileri henüz oluşturulmadı. Asistanla konuşarak brief hazırlayabilirsin.","No project details yet. Describe your brief to the assistant.","Noch keine Projektdaten. Beschreibe dein Projekt.","Aún no hay detalles. Describe tu idea al asistente.","Pas de détails du projet. Décrivez votre brief.","لا توجد تفاصيل بعد. صف فكرتك للمساعد"],["Bu alan brief bilgisidir; üretilmiş çıktı veya üretim onayı değildir.","This is brief information, not a generated output or approval.","Dies sind Briefing-Daten, keine Produktion.","Son datos del brief, no una producción aprobada.","Il s'agit du brief, pas d'un résultat produit.","هذه معلومات الموجز وليست إنتاجًا أو موافقة"],["Bu düzenleme işlevi henüz bağlı değil.","This editing feature is not available yet.","Diese Bearbeitungsfunktion ist noch nicht verfügbar.","Esta función de edición aún no está disponible.","Cette fonction d'édition n'est pas disponible.","وظيفة التحرير هذه غير متاحة"],["Bu işlev henüz bağlı değil.","This feature is not available yet.","Diese Funktion ist noch nicht verfügbar.","Esta función aún no está disponible.","Cette fonctionnalité n'est pas disponible.","هذه الوظيفة غير متاحة"],["Bu düzenleme aracı henüz bağlı değil; üretim veya kredi işlemi yapılmaz.","This editing tool is unavailable; no production or credits are used.","Bearbeitung nicht verfügbar; keine Credits.","Herramienta no disponible; sin cargos.","Outil indisponible ; aucun crédit débité.","الأداة غير متاحة ولا يتم خصم رصيد"],["Sahneyi düzenle","Edit scene","Szene bearbeiten","Editar escena","Modifier la scène","تحرير المشهد"],["Sayfayı düzenle","Edit page","Seite bearbeiten","Editar página","Modifier la page","تحرير الصفحة"],["Yeniden boyutlandır","Resize","Größe ändern","Cambiar tamaño","Redimensionner","تغيير الحجم"],["Düzenle","Edit","Bearbeiten","Editar","Modifier","تحرير"],["İşaretle","Mark","Markieren","Marcar","Marquer","تحديد"],["Timeline görünümü","Timeline view","Zeitleistenansicht","Ver cronología","Afficher la chronologie","عرض المخطط الزمني"],["Varyasyon oluştur","Generate variation","Variante erzeugen","Crear variante","Créer une variante","إنشاء نسخة"],["Henüz görüntülenebilir çıktı yok","No preview available yet","Noch keine Vorschau verfügbar","Aún no hay vista previa","Aucun aperçu disponible","لا توجد معاينة بعد"],["İşaretle","Mark","Markieren","Marcar","Marquer","تحديد"],["Not selected","Not selected","Nicht ausgewählt","No seleccionado","Non sélectionné","لم يتم الاختيار"],["Scenes / Timeline","Scenes / Timeline","Szenen / Zeitleiste","Escenas / Cronología","Scènes / Chronologie","المشاهد / المخطط الزمني"],["Versions & revisions","Versions & revisions","Versionen und Änderungen","Versiones y revisiones","Versions et révisions","الإصدارات والتعديلات"],["Edit content","Edit content","Inhalt bearbeiten","Editar contenido","Modifier le contenu","تحرير المحتوى"],["Download ZIP","Download ZIP","ZIP herunterladen","Descargar ZIP","Télécharger ZIP","تنزيل ZIP"],["Saved video outputs","Saved video outputs","Gespeicherte Videos","Vídeos guardados","Vidéos enregistrées","مقاطع الفيديو المحفوظة"],["Video production plan","Video production plan","Video-Produktionsplan","Plan de producción de vídeo","Plan de production vidéo","خطة إنتاج الفيديو"],["Video model","Video model","Videomodell","Modelo de vídeo","Modèle vidéo","نموذج الفيديو"],["Duration","Duration","Dauer","Duración","Durée","المدة"],["Aspect ratio","Aspect ratio","Seitenverhältnis","Relación de aspecto","Format d'image","نسبة العرض إلى الارتفاع"],["Quality","Quality","Qualität","Calidad","Qualité","الجودة"],["Saved output","Saved output","Gespeicherte Ausgabe","Resultado guardado","Sortie enregistrée","نتيجة محفوظة"],["Scenes / clips","Scenes / clips","Szenen / Clips","Escenas / clips","Scènes / clips","المشاهد / المقاطع"],["Open scenes","Open scenes","Szenen öffnen","Abrir escenas","Ouvrir les scènes","افتح المشاهد"],["Review plan","Review plan","Plan prüfen","Revisar plan","Vérifier le plan","راجع الخطة"],["Not specified","Not specified","Nicht angegeben","No especificado","Non précisé","غير محدد"]]);
const studioUiLookup=new Map();
for(const row of studioUiTranslations){
 for(const value of row){if(value&&!studioUiLookup.has(value))studioUiLookup.set(value,row)}
}
const localizedUi=value=>{
 if(typeof value!=='string')return value;
 const row=studioUiLookup.get(value);
 return row?(row[({en:1,tr:0,de:2,es:3,fr:4,ar:5}[language]??1)]||row[1]):value;
};
function updateStudioLanguage(){
 document.documentElement.lang=language;
 document.documentElement.dir=language==='ar'?'rtl':'ltr';
 const selector=$('#studio-ui-language');if(selector)selector.value=language;
 const label=$('#studio-language-label');if(label){const nextLabel=({en:'Language',tr:'Dil',de:'Sprache',es:'Idioma',fr:'Langue',ar:'اللغة'})[language]||'Language';if(label.textContent!==nextLabel)label.textContent=nextLabel;}
 const scan=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 let item;
 while((item=scan.nextNode())){
  const parentNode=item.parentElement;
  if(!parentNode||parentNode.closest('script,style,textarea,option,.message,[data-user-content="true"],#b2-context,#studio-ui-language'))continue;
  const original=item.textContent||'';
  const trimmed=original.trim();
  if(!trimmed)continue;
  const translated=localizedUi(trimmed);
  if(translated!==trimmed)item.textContent=original.replace(trimmed,translated);
 }
 for(const element of document.querySelectorAll('[title],[aria-label],[placeholder]')){
  if(element.closest('textarea,.message,[data-user-content="true"],#b2-context'))continue;
  for(const attr of ['title','aria-label','placeholder']){
   const value=element.getAttribute(attr);
   if(value){const next=localizedUi(value);if(next!==value)element.setAttribute(attr,next);}
  }
 }
 const composer=$('#prompt');if(composer)composer.placeholder=localizedUi('Bir mesaj yazın…');
}
function setStudioLanguage(next){
 if(!availableStudioLanguages.includes(next))return;
 language=next;
 try{localStorage.setItem('clipora_language',next);parent.dispatchEvent(new Event('clipora-language-change'))}catch(_error){}
 try{const url=new URL(parent.location.href);url.searchParams.set('uiLang',next);parent.history.replaceState(null,'',url)}catch(_error){}
 updateStudioLanguage();
 draw();
}
const key=()=> 'crelavo-studio-b2:'+session?.userId+':'+mode+':'+current.id;
async function request(path,body){if(!session?.accessToken)throw Error(t(5));const r=await fetch(path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+session.accessToken,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,credentials:'include',redirect:'error',cache:'no-store'});if(!/application\/(?:[\w.-]+\+)?json/i.test(r.headers.get('content-type')||''))throw Error(t(14));const data=await r.json();if(r.status===402){const required=Number(data.required??data.need),balance=Number(data.balance);const amounts=Number.isFinite(required)&&Number.isFinite(balance)?(language==='tr'?' Gereken: '+required+' · Kullanılabilir: '+balance+'.':' Required: '+required+' · Available: '+balance+'.'):'';const message=(language==='tr'?'Yetersiz kredi. Üretim başlatılmadı. Kredi yükleyin.':'Insufficient credits. Production did not start. Add credits.')+amounts;if(window.confirm(message+(language==='tr'?' Kredi yükleme sayfasına geçilsin mi?':' Open the credit purchase page?')))window.open('/dashboard/payment','_blank','noopener,noreferrer');throw Error(message);}if(!r.ok||data.ok===false)throw Error(t(14)+' ('+(data.code||data.error||r.status)+')');return data;}
const api=body=>request('/api/studio/conversation',{mode,categoryId:current.id,uiLanguage:language,...body});
const valueNames={service_business_website:"Hizmet işletmesi sitesi",corporate_website:"Kurumsal web sitesi",landing_page:"Tanıtım sayfası",portfolio_website:"Portfolyo sitesi",turkish:"Türkçe",english:"İngilizce",german:"Almanca",french:"Fransızca",spanish:"İspanyolca",arabic:"Arapça",preview_first:"Yalnızca önizleme",preview_source_files:"Önizleme ve kaynak dosyaları",prompt_to_video:"Metinden video",image_to_video:"Görselden video",voice_to_video:"Sesten video",instrumental_bgm:"Enstrümantal müzik",ai_voice_over:"Seslendirme",no_music:"Müziksiz","8_seconds":"8 saniye","15_seconds":"15 saniye","16x9":"16:9 yatay","9x16":"9:16 dikey","1x1":"1:1 kare"};
 const valueLabel=(id,value)=>Array.isArray(value)?value.join(", "):valueNames[value]||current.fields?.find(f=>f.id===id)?.options?.find(o=>o.id===value)?.label||value;
 const fieldNames={brief:"Proje fikri",business_name:"İşletme adı",site_type:"Site türü",language:"İçerik dili",stack:"Teslim biçimi",aspect:"En-boy oranı",duration:"Süre",sound:"Ses tercihi",input:"Başlangıç kaynağı"};
 const fieldLabel=id=>fieldNames[id]||(window.__studioB2?.requirements?.[current.id]||[]).find(f=>f.id===id)?.label||id.replace(/_/g,' ');
window.studioBriefPresentation={label:fieldLabel,value:valueLabel,openPlan:()=>showAux("brief")};
function remember(data){project=data.project;serverPlanning=data.planning&&project?{...data.planning,projectId:project.id,categoryId:project.categoryId}:null;mockState=data.mockState||'';if(project&&session){try{sessionStorage.setItem(key(),JSON.stringify({projectId:project.id,mockState}));}catch(_error){/* Storage can be unavailable in private or restricted browser contexts. */}}if(project){try{const url=new URL(parent.location.href);url.searchParams.set('chatProject',project.id);url.searchParams.set('category',current.id);parent.history.replaceState(null,'',url);}catch(_error){/* A restricted embed may deny parent navigation; keep the conversation usable. */}}draw(data.wallets);}
function planning(){if(project&&serverPlanning?.projectId===project.id&&serverPlanning.categoryId===current.id&&serverPlanning.briefRevision===project.snapshot.revision)return {revision:serverPlanning.briefRevision,missing:serverPlanning.missingFields.map(fieldId=>({fieldId})),state:serverPlanning.state,advanced:serverPlanning.advanced};const fields=project?.snapshot.fields||{},missing=(window.__studioB2?.requirements?.[current.id]||[]).filter(f=>f.required&&!Object.prototype.hasOwnProperty.call(fields,f.id));return {revision:project?.snapshot.revision||0,missing,state:missing.length?"collecting":"draft_ready"};} function draw(wallets){
 if(wallets)walletCache=wallets;if($('#advanced-open-plan'))$('#advanced-open-plan').disabled=busy||!project;
 const messages=$('#messages');messages.replaceChildren();(project?.messages||[]).forEach(message=>{const item=node('div',message.content,'message'+(message.role==='user'?' user':''));item.dataset.userContent='true';item.dataset.b2Role=message.role;messages.appendChild(item)});
 if(!project?.messages.length)messages.appendChild(node('div',session?t(16):t(5),'message'));
 if(busy&&$('#prompt').value.trim()){const draft=node('div',$('#prompt').value.trim(),'message user');draft.dataset.b2Role='pending';draft.dataset.userContent='true';messages.append(draft,node('div',t(15),'message'));}
 if(uiError)messages.appendChild(node('div',uiError,'message error'));
 if(current.id==='website'&&mode==='real'&&session){
  const progress=node('section',null,'studio-website-progress');
  progress.setAttribute('aria-label','Website proje durumu');
  progress.style.cssText='margin:8px 0;padding:11px;border:1px solid #342740;border-radius:10px;background:#1a1526;display:grid;gap:7px';
  const w=websiteData?.website;
  const fields=project?.snapshot?.fields||{};
  progress.appendChild(node('strong','Website üretim planı'));
  const hasBrief=Boolean(fields.brief&&fields.business_name);
  const planLine=w?.approvedHash&&w.approvedHash===w.planHash?'Plan onaylandı':
    w?.review?.ready?'Brief hazır · plan kontrolü bekleniyor':
    hasBrief?'Brief hazırlanıyor · eksik bilgileri tamamlayın':
    'İşletme adını ve istediğin web sitesini anlat';
  progress.appendChild(node('div',planLine));
  if(w?.packId&&Number.isSafeInteger(w.credits)&&w.credits>0)
    progress.appendChild(node('small','Paket: '+w.packId+' · '+w.credits+' Production Credits'));
  if(Array.isArray(w?.missing)&&w.missing.length)
    progress.appendChild(node('small','Eksik bilgiler: '+w.missing.slice(0,5).join(', ')));
  const actions=node('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:6px';
  if(selectedProduction&&canvasState==='ready'){
   const readyId=selectedProduction;
   const editor=node('button',language==='tr'?'Siteyi incele ve düzenle':'Review and edit website');editor.type='button';editor.disabled=busy;editor.onclick=()=>window.open('/dashboard/website-draft?projectId='+encodeURIComponent(readyId),'_blank','noopener,noreferrer');actions.appendChild(editor);
   const legacy=node('details');legacy.appendChild(node('summary',language==='tr'?'Diğer teslimat seçenekleri':'Other delivery options'));
   const preview=node('button','Canvas önizleme');preview.type='button';preview.disabled=busy;preview.onclick=()=>previewWebsite(readyId);legacy.appendChild(preview);
   const zip=node('button','ZIP indir');zip.type='button';zip.disabled=busy;zip.onclick=()=>downloadWebsiteZip(readyId);legacy.appendChild(zip);actions.appendChild(legacy);
  }else{
   const brief=node('button','Brief & Plan');brief.type='button';brief.disabled=busy;brief.onclick=()=>showAux('brief');actions.appendChild(brief);
   const builder=node('button',language==='tr'?'Üretim planını incele':'Review production plan');builder.type='button';builder.disabled=busy;builder.onclick=openFunctionalWebsiteBuilder;actions.appendChild(builder);
  }
  progress.appendChild(actions);
  messages.appendChild(progress);
 }else if(current.id!=='website'&&mode==='real'&&project?.messages?.length){
  const card=node('section',undefined,'studio-category-plan');
  card.setAttribute('aria-label','Kategori planlama taslağı');
  card.style.cssText='margin:10px 0;padding:12px;border:1px solid #594071;border-radius:10px;background:#24162f;display:grid;gap:7px';
  card.appendChild(node('strong',current.label+' · plan taslağı'));
  card.appendChild(node('small','Sohbet taslağı · üretim henüz başlatılmadı · kredi tahsil edilmedi'));
  const button=node('button','Planı Canvas\'ta incele');button.type='button';button.disabled=busy;
  button.onclick=()=>showAux('brief');card.appendChild(button);
  messages.appendChild(card);
 }
 if(['video','clips','video_edit','series','avatar','localization'].includes(current.kind)&&mode==='real'){
  const panel=node('section',undefined,'studio-video-plan');
  panel.setAttribute('aria-label','Video production plan');
  panel.style.cssText='margin:10px 0;padding:13px;border:1px solid #594071;border-radius:12px;background:#1b1327;display:grid;gap:8px';
  panel.appendChild(node('strong',language==='tr'?'Video üretim planı':'Video production plan'));
  const request=[...(project?.messages||[])].reverse().find(item=>item.role==='user')?.content||'';
  const model=request.match(/\b(runway|kling|veo|pika|minimax|fal[.]ai)\b/i);
  const duration=request.match(/\b(\d{1,3})\s*(?:saniye|seconds?|secs?|sn)\b/i);
  const ratio=request.match(/\b(16:9|9:16|1:1|4:5)\b/);
  const quality=request.match(/\b(4k|1080p|720p)\b/i);
  const row=(label,value)=>{const line=node('div');line.style.cssText='display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #382944;padding:5px 0;font-size:12px';
   const head=node('span',label);head.style.color='#ad9dbf';line.append(head,node('strong',value));panel.append(line);};
  const unset=language==='tr'?'Belirtilmedi':'Not specified';
  const specs=activeVideoSelection?.specs||{};
  const seconds=Number(specs.durationSeconds);
  row(language==='tr'?'Video modeli':'Video model',specs.model||model?.[1]||unset);
  if(specs.provider)row(language==='tr'?'Sağlayıcı':'Provider',specs.provider);
  row(language==='tr'?'Süre':'Duration',Number.isFinite(seconds)&&seconds>0?seconds+'s':duration?duration[1]+'s':unset);
  row(language==='tr'?'Oran':'Aspect ratio',specs.aspectRatio||ratio?.[1]||unset);
  row(language==='tr'?'Kalite':'Quality',specs.quality||quality?.[1]||unset);
  if(activeVideoSelection){
   row(language==='tr'?'Kayıtlı çıktı':'Saved output',activeVideoSelection.title);
   row(language==='tr'?'Sahne / klip':'Scenes / clips',String(activeVideoSelection.scenes));
  }
  const controls=node('div');controls.style.cssText='display:flex;gap:7px;flex-wrap:wrap';
  const review=node('button',language==='tr'?'Planı görüntüle':'Review plan');review.onclick=()=>showAux('brief');controls.append(review);
  if(activeVideoSelection){
   const timeline=node('button',language==='tr'?'Sahneleri aç':'Open scenes');timeline.onclick=()=>showAux('timeline');controls.append(timeline);
  }
  panel.append(controls);
  const status=node('small',language==='tr'?'Üretimi başlatmak için uygun model, fiyat ve açık onay gerekir. Bu ekranda video üretimi başlatılmaz.':'Production requires an available model, verified price and explicit approval. This view cannot start a new render.');
  status.style.color='#a99bb4';panel.append(status);
  messages.append(panel);
 }

 $('#category-title').textContent=current.label+({en:' workspace',tr:' çalışma alanı',de:' Arbeitsbereich',es:' espacio de trabajo',fr:' espace de travail',ar:' مساحة العمل'}[language]||' workspace');
 const fields=Object.entries(project?.snapshot.fields||{});$('#b2-context').textContent=project?project.title+'\n'+fields.map(([k,v])=>fieldLabel(k)+': '+valueLabel(k,v)).join('\n'):current.label;$('#b2-context').dataset.userContent='true';
 const title=activeVideoSelection?.title||websiteData?.title||(
 project?.title&&!/ (brief|projesi|project)$/i.test(project.title)?project.title:
 current.label+({tr:' projesi',en:' project',de:' Projekt',es:' proyecto',fr:' projet',ar:' مشروع'}[language]||' project'));
 $('#project-title').textContent=title;
 for(const account of ['assistant','production'])$('#b2-'+account+'-balance').textContent=(account==='assistant'?'Assistant':'Production')+' Credits: '+(walletCache?walletCache[account].available:(account==='production'&&Number.isFinite(liveProductionBalance)?liveProductionBalance:'—'))+(mode==='mock'?' (mock)':'');
 $('#mode-badge').textContent=mode==='mock'?'Demo · simülasyon':'Gerçek sohbet';$('#b2-mode-note').textContent=current.id==='website'&&mode==='real'&&!status?.realEnabled
 ?'Website brief sohbeti etkin. Site üretimi için Canvas üzerindeki Website oluştur aracını kullanın; otomatik kredi tahsilatı kapalı.'
 :mode==='real'&&!status?.realEnabled?'Planlama sohbeti mevcut asistan API ile çalışır. Üretim ve kredi tahsilatı başlatılmaz; sohbet yalnız bu tarayıcı sekmesinde saklanır.'
 :mode==='mock'?(project?.advanced?.memory==='isolated_postgres'?(language==='tr'?'Yerel PostgreSQL hafızası · Yanıtlar ve bakiyeler Mock simülasyondur. Gerçek AI kapalı.':'Isolated local PostgreSQL memory · Replies and balances are Mock simulations. Real AI disabled.'):t(7)):t(8);
 const choices=$('#b2-choices');choices.replaceChildren();if(project){const missing=(window.__studioB2?.requirements?.[current.id]||[]).find(f=>f.required&&!Object.prototype.hasOwnProperty.call(project.snapshot.fields,f.id)&&!f.serverOnly);missing?.options.slice(0,5).forEach(value=>{const b=node('button',valueLabel(missing.id,value));b.disabled=busy;b.onclick=()=>{$('#prompt').value=valueLabel(missing.id,value);sendMessage()};choices.appendChild(b)});}
 $('#send').disabled=busy||!session||(mode==='mock'&&!status?.mockAllowed);$('#send').textContent=busy?t(15):t(2)+' ↗';$('#send').setAttribute('aria-busy',String(busy));$('#prompt').disabled=busy||!session;$('#prompt').placeholder=t(6);$('#b2-new-project').disabled=busy||!session;$('#b2-defaults').disabled=busy||!session;$('.assistant').setAttribute('dir',language==='ar'?'rtl':'ltr');
 if(project){const p=planning();$('#b2-context').textContent+='\n'+planSummary(p);if(p.advanced)$('#b2-context').textContent+='\n'+p.advanced.decisions.length+' '+(language==='tr'?'kayıtlı karar':'saved decisions');$('.canvas').dataset.planState=p.state;$('.canvas').dataset.briefRevision=String(p.revision);}else{delete $('.canvas').dataset.planState;delete $('.canvas').dataset.briefRevision;} if(activeView==='brief')showAux('brief');window.studioWorkspace?.refresh(project,websiteData,referenceFile);if(project){const p=planning(),caption=$('#canvas-caption');caption.textContent=caption.textContent.split(' · Brief r')[0]+' · Brief r'+p.revision+' · '+planSummary(p);} $('.chat').scrollTop=$('.chat').scrollHeight;
}
function resetProjectNav(){$('#saved-websites').replaceChildren();$('#saved-websites').hidden=true;$('#b2-projects').replaceChildren(node('option',t(17)));}
function clearCanvas(){previewEpoch++;selectedProduction=null;websiteData=null;canvasState='empty';$('#site-wrapper').replaceChildren();$('#website-pages').replaceChildren(node('option','Sayfa yok'));$('#website-pages').disabled=true;$('#preview-scale').textContent='';showCanvas('empty');}
function showCanvas(state,reason){
 canvasState=state;$('.canvas').dataset.state=state;
 $('#empty').hidden=state==='ready';$('#site-stage').hidden=state!=='ready';
 $('#canvas-source').hidden=state!=='ready';$('#website-controls').hidden=current.id!=='website';
 const locales={
  en:{ready:'Existing site · read-only',loading:'Loading…',none:'No output yet',project:'Loading saved project…',noPreview:'No website output to preview',noSource:'No verified website source is available. No additional production or charge was made.',notReady:'This project is not ready for preview.',site:'Your website Canvas is empty',other:' Canvas is empty',siteHint:'Describe your website to the assistant or open a saved project.',otherHint:'Describe the work you want to create to the assistant. No generated output is available yet.'},
  tr:{ready:'Mevcut site · salt okunur',loading:'Yükleniyor…',none:'Henüz çıktı yok',project:'Kayıtlı proje yükleniyor…',noPreview:'Bu projede görüntülenebilir Website çıktısı yok',noSource:'Doğrulanmış site kaynağı bulunamadı. Yeni üretim veya kredi tahsilatı yapılmadı.',notReady:'Proje henüz önizlemeye hazır değil.',site:'Website projen için boş bir Canvas',other:' için boş bir Canvas',siteHint:'İstediğin siteyi sağdaki asistanla konuşarak hazırlayabilir veya kayıtlı bir Website projesini açabilirsin.',otherHint:'İstediğin üretimi asistanla planlayabilirsin. Henüz bir çıktı oluşturulmadı.'}
 };
 const local=locales[language]||locales.en;
 $('#view-status').textContent=state==='ready'?local.ready:state==='loading'?local.loading:local.none;
 $('#empty-title').textContent=state==='loading'?local.project:state==='unavailable'?local.noPreview:current.id==='website'?local.site:current.label+local.other;
 $('#empty-description').textContent=state==='loading'?local.project:state==='unavailable'?(reason==='output_not_ready'?local.notReady:local.noSource):current.id==='website'?local.siteHint:local.otherHint;
 $('#start-conversation').hidden=state==='loading';
 $('#open-projects').hidden=state==='loading'||current.id!=='website';
}
// Native Assets panel avoids navigating a full dashboard inside a srcDoc iframe.
// It uses the same owner-keyed IndexedDB records as the standalone Elements tool.
async function studioElementsDb(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open('crelavo-studio-local-elements-v1',1);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains('elements')){
    const store=db.createObjectStore('elements',{keyPath:'key'});
    store.createIndex('owner','owner',{unique:false});
   }
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}
async function studioElementsOperation(operation,record,key){
 const db=await studioElementsDb();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction('elements',operation==='list'?'readonly':'readwrite');
  const store=tx.objectStore('elements');
  const req=operation==='list'?store.index('owner').getAll(session.userId):
   operation==='get'?store.get(key):operation==='save'?store.put(record):store.delete(key);
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 })}finally{db.close()}
}
async function showStudioElements(){
 const root=$('#aux-panel');root.hidden=false;root.style.padding='16px';root.style.overflow='auto';root.replaceChildren();
 const heading=node('h2',language==='tr'?'Elements · Referans Kütüphanesi':'Elements · Reference Library');
 const help=node('p',language==='tr'?'Karakter, ürün, mekân ve ses referanslarını bu tarayıcıda kaydedin. AI üretimine dosya gönderilmez.':'Save character, product, location and voice references in this browser. Media is not sent to AI production.');
 root.append(heading,help);
 if(!session?.userId){root.append(node('p','Sign in to access your library.'));return;}
 const kinds=['character','product','location','wardrobe','voice','style','reference'];
 const controls=node('div');controls.className='studio-elements-controls';
 controls.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:14px;margin:18px 0;align-items:end;padding:16px;border-radius:13px;background:#21172f;border:1px solid #49345a;max-width:100%;box-sizing:border-box';
 const category=node('select');kinds.forEach(k=>{const option=node('option',k);option.value=k;category.append(option)});
 const name=node('input');name.placeholder=language==='tr'?'Referans adı':'Reference name';name.maxLength=100;
 const description=node('input');description.placeholder=language==='tr'?'Görünüm ve tutarlılık notları':'Appearance and consistency notes';description.maxLength=500;
 const file=node('input');file.type='file';file.accept='image/*,audio/*,video/*';
 const consentWrap=node('label');const consent=node('input');consent.type='checkbox';consentWrap.append(consent,node('span',language==='tr'?'Yüz veya ses için kullanım iznim var':'I have permission to use this face or voice'));
 const save=node('button',language==='tr'?'Referansı kaydet':'Save reference');save.type='button';
 const note=node('p','');note.style.color='#bca7d2';
 const field=(title,input)=>{
  const label=node('label');label.style.cssText='display:flex;flex-direction:column;gap:7px;font-size:12px;color:#d5c9e6;min-width:0';
  label.append(node('span',title),input);
  input.style.cssText='display:block;min-width:0;max-width:100%;width:100%;box-sizing:border-box;background:#130e21;color:#f4edff;border:1px solid #614675;border-radius:8px;padding:10px;min-height:38px;font:inherit';
  return label;
 };
 file.style.height='auto';file.style.padding='8px';
 consentWrap.style.cssText='display:flex;gap:9px;align-items:center;min-height:38px;font-size:12px;color:#cbb9dc';
 save.style.cssText='background:#7433bd;border:1px solid #9555d5;color:white;padding:11px 14px;border-radius:9px;font-weight:700;min-height:40px;cursor:pointer';
 controls.append(field(language==='tr'?'Tür':'Reference type',category),
 field(language==='tr'?'Referans adı':'Reference name',name),
 field(language==='tr'?'Açıklama ve tutarlılık notları':'Description / consistency notes',description),
 field(language==='tr'?'Resim, video veya ses dosyası':'Image, video or audio file',file),consentWrap,save);
 const listing=node('div');listing.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,190px),1fr));gap:12px;min-width:0';
 root.append(controls,note,listing);
 const feedback=message=>note.textContent=message;
 const render=async()=>{
  listing.replaceChildren();
  try{
   const records=await studioElementsOperation('list');
   if(!root.isConnected)return;
   const items=Array.isArray(records)?records.filter(item=>item&&item.owner===session.userId).slice(-80).reverse():[];
   if(!items.length){listing.append(node('p',language==='tr'?'Henüz kayıtlı referans yok':'No references saved yet'));return;}
   for(const item of items){
    const card=node('div');card.style.cssText='padding:11px;border:1px solid #503363;border-radius:10px;background:#1b1528;min-width:0';
    const label=node('strong',String(item.name||'Reference').slice(0,100));label.style.cssText='display:block;overflow-wrap:anywhere;margin:8px 0 3px';
    if(typeof item.mime==='string'&&item.mime.startsWith('image/')&&item.blob instanceof Blob){
      const image=node('img');image.alt=String(item.name||'Reference').slice(0,80);
      image.style.cssText='display:block;width:100%;aspect-ratio:4/3;object-fit:contain;background:#100c18;border-radius:8px';
      const localUrl=URL.createObjectURL(item.blob);image.src=localUrl;
      image.addEventListener('load',()=>URL.revokeObjectURL(localUrl),{once:true});
      image.addEventListener('error',()=>URL.revokeObjectURL(localUrl),{once:true});
      card.append(image);
    }
    card.append(label,node('small',String(item.kind||'reference')));
    const use=node('button',language==='tr'?'Brief\'te kullan':'Use in brief');use.type='button';
    use.onclick=()=>{
     const message='Reference ('+String(item.kind).slice(0,30)+'): '+String(item.name).slice(0,100)+
      (item.description?' — '+String(item.description).slice(0,400):'')+
      '\\nLocal reference notes only; file is not attached to the AI.';
     $('#prompt').value=($('#prompt').value.trim()?$('#prompt').value.trim()+'\\n':'')+message;
     showAux('canvas');$('#prompt').focus();
    };
    const remove=node('button',language==='tr'?'Sil':'Delete');remove.type='button';
    remove.onclick=async()=>{
     if(!confirm(language==='tr'?'Bu referans silinsin mi?':'Delete this reference?'))return;
     try{await studioElementsOperation('delete',null,item.key);await render()}catch(_error){feedback('Could not remove this reference.')}
    };
    const controls=node('div');controls.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-top:10px';
    for(const button of [use,remove])button.style.cssText='font-size:11px;padding:8px;border:1px solid #67477d;border-radius:7px;background:#30233e;color:#fff;cursor:pointer';
    controls.append(use,remove);card.append(controls);listing.append(card);
   }
  }catch(_error){feedback(language==='tr'?'Yerel kütüphane kullanılamıyor. Tarayıcı depolamasını kontrol edin.':'Local storage unavailable. Check your browser storage settings.')}
 };
 save.onclick=async()=>{
  const media=file.files?.[0],label=name.value.trim();
  if(!media||!label){feedback('Choose a file and enter a reference name.');return;}
  if(media.size>25_000_000||!['image/','audio/','video/'].some(prefix=>media.type.startsWith(prefix))){feedback('Use an image, audio or video file smaller than 25 MB.');return;}
  if(['character','voice'].includes(category.value)&&!consent.checked){feedback('Please confirm face or voice usage permission.');return;}
  try{
   const records=await studioElementsOperation('list');
   if(Array.isArray(records)&&records.length>=80){feedback('Maximum 80 saved references.');return;}
   await studioElementsOperation('save',{
    key:session.userId+':'+crypto.randomUUID(),owner:session.userId,
    name:label.slice(0,100),description:description.value.trim().slice(0,500),
    kind:category.value,mime:media.type,size:media.size,createdAt:Date.now(),
    blob:media,permission:consent.checked
   });
   name.value='';description.value='';file.value='';consent.checked=false;
   feedback(language==='tr'?'Referans kaydedildi (yalnızca bu tarayıcı).':'Reference saved in this browser.');
   await render();
  }catch(_error){feedback('Could not save file in this browser.')}
 };
 await render();
}
function showAux(view){activeView=view;window.studioWorkspace?.setView(view);document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#aux-panel').hidden=view==='canvas';if(view==='canvas')return;
 if(view==='assets'){void showStudioElements();return;}if(!['brief','assets'].includes(view)){window.studioWorkspace?.showView(view);return;}
 const root=$('#aux-panel');root.replaceChildren(node('h2',view==='brief'?'Brief & Plan':'Referanslar'));
 if(view==='brief'){const p=planning();root.appendChild(node('p',planSummary(p)));
  if(current.id!=='website'&&!status?.realEnabled&&mode==='real'&&project?.messages?.length){
   const title=node('h3','Kategori planı · sohbet taslağı');root.appendChild(title);
   const latest=[...project.messages].reverse().find(item=>item.role==='assistant');
   if(latest){const detail=node('p',latest.content);detail.style.whiteSpace='pre-wrap';root.appendChild(detail);}
   root.appendChild(node('p','Bu plan görüşme taslağıdır. Henüz onaylanmış üretim, kredi hesaplaması, dosya veya medya çıktısı yoktur.'));
  }if(current.id==='website'){const packs=window.__studioB2?.websitePacks||[];if(packs.length){const pricing=node('section');pricing.appendChild(node('h3','Website Builder paketleri'));for(const pack of packs){const option=node('button',pack.label+' — '+pack.credits+' Production Credits'+(pack.id==='website_basic_admin'?' (bağımsız sunuculu paket; canlı ödeme dahil değil)':/admin|commerce|checkout/i.test(pack.label)?' (desteklenmiyor)':''));option.type='button';option.disabled=busy||(/admin|commerce|checkout/i.test(pack.label)&&pack.id!=='website_basic_admin');option.setAttribute('aria-pressed',String(websiteSelectedPackId===pack.id));option.onclick=()=>{if(websiteSelectedPackId!==pack.id){websiteSelectedPackId=pack.id;}showAux('brief');};pricing.appendChild(option);}pricing.appendChild(node('p','Seçilen paket: '+(packs.find(pack=>pack.id===websiteSelectedPackId)?.label||'Henüz seçilmedi')));pricing.appendChild(node('p','Paket seçimi taslak için kullanılır. Açık onay ayrıca alınır; bu ekranda otomatik kredi tahsilatı yapılmaz. Production Credits bakiyesi üst bölümde gösterilir.'));root.appendChild(pricing);}}if(current.id==='website'&&mode==='real'&&project&&!status?.isolatedPreview){const handoff=node('button',selectedProduction?'Website taslağını güncelle':'Website Builder taslağı oluştur');handoff.type='button';handoff.disabled=busy;handoff.onclick=()=>handoffWebsiteDraft();root.appendChild(handoff);root.appendChild(node('p','Taslak kaydı üretim başlatmaz ve kredi harcamaz. Paket seçimi ve açık onay ayrıca gereklidir.'));if(project.productionId){const review=node('button','Website taslağının onay durumunu kontrol et');review.type='button';review.disabled=busy;review.onclick=()=>reviewWebsiteDraft();root.appendChild(review);if(websiteData?.productionId===project.productionId&&websiteData.website){const w=websiteData.website;const summary=node('section');summary.appendChild(node('h3','Website üretim kontrolü'));summary.appendChild(node('p','Durum: '+String(websiteData.status||'bilinmiyor')));summary.appendChild(node('p','Paket: '+String(w.packId||'seçilmedi')+' · Ücret: '+(Number.isFinite(w.credits)?w.credits+' Production Credits':'belirlenmedi')));summary.appendChild(node('p','Onaya hazır: '+(w.review?.ready?'Evet':'Hayır')));if(Array.isArray(w.review?.blockers)&&w.review.blockers.length)summary.appendChild(node('p','Engeller: '+w.review.blockers.join(', ')));summary.appendChild(node('p','Kontrol işlemi salt okunurdur; kredi tahsilatı yapmaz.'));if(w.approvedHash===w.planHash&&w.planHash){summary.appendChild(node('p','Plan onaylandı. Ücretli üretim yalnız ayrıca başlatılır.'));if(websiteData.status==='ready'){summary.appendChild(node('p','Site hazır. Kaydedilen dosyaları açabilir veya ZIP paketini indirebilirsiniz.'));const view=node('button','Site önizlemesini aç');view.type='button';view.disabled=busy;view.onclick=()=>previewWebsite(project.productionId);summary.appendChild(view);const zip=node('button','Kaynak ZIP dosyasını indir');zip.type='button';zip.disabled=busy;zip.onclick=()=>downloadWebsiteZip(project.productionId);summary.appendChild(zip);}else{const render=node('button','Üretim fiyatını ve bağlantısını kontrol et');render.type='button';render.disabled=busy;render.onclick=()=>renderApprovedWebsite();summary.appendChild(render);const state=node('button','Üretim ve kredi durumunu kontrol et');state.type='button';state.disabled=busy;state.onclick=()=>checkCentralWebsiteStatus();summary.appendChild(state);summary.appendChild(node('p','Fiyat kontrolü kredi harcamaz. Üretim yalnız sunucu izin verirse ve ayrıca onaylanırsa başlar.'));}}else if(w.review?.ready&&w.planHash&&Number.isSafeInteger(w.credits)&&w.credits>0){const approve=node('button','Planı ve '+w.credits+' Production Credits tutarını onayla');approve.type='button';approve.disabled=busy;approve.onclick=()=>approveWebsitePlan();summary.appendChild(approve);}root.appendChild(summary);}}}root.dataset.planState=p.state;const fields=Object.entries(project?.snapshot.fields||{});if(!fields.length){root.appendChild(node('p','Brief henüz oluşmadı. Asistanla konuşarak proje bilgilerini ekleyebilirsin.'));return;}const dl=node('dl');fields.forEach(([k,v])=>dl.append(node('dt',fieldLabel(k)),node('dd',valueLabel(k,v))));root.append(dl,node('p',language==='tr'?'Bu bilgiler proje brief’idir; üretim sonucu değildir.':'These are project requirements, not produced artifacts.'));renderAdvancedPlan(root,p);}
 else root.appendChild(node('p',referenceFile?referenceFile.name+' — '+t(9):'Henüz referans seçilmedi. Dosya seçimi sunucuya yükleme veya üretim başlatmaz.'));
}
function planSummary(p){const a=p.advanced;return (p.state==='collecting'?(language==='tr'?'Bilgi toplanıyor · ':'Collecting requirements · ')+p.missing.length+' · ':'')+(language==='tr'?'Brief sürümü ':'Brief version ')+(a?.briefVersion??p.revision)+' · '+(a?.plan?'Plan v'+a.planVersion+' · '+a.planState:(language==='tr'?'Plan oluşturulmadı':'No plan yet'))+' · '+(language==='tr'?'Üretim kapalı':'Production disabled');}
async function planAction(operation,note){if(busy||!project||mode!=='mock')return;const seq=epoch,a=planning().advanced;busy=true;uiError='';draw();try{const data=await api({action:'plan',projectId:project.id,requestId:crypto.randomUUID(),operation,expectedPlanVersion:a?.planVersion??0,expectedPlanHash:a?.planHash??null,...(note?{note}:{}) ,mockState});if(seq!==epoch)return;remember(data);}catch(error){if(seq===epoch)showError(error);}finally{if(seq===epoch){busy=false;draw();}}}
function renderAdvancedPlan(root,p){const a=p.advanced;if(!project||mode!=='mock'||!a){root.appendChild(node('p',language==='tr'?'Gelişmiş planlama yalnız Mock modunda bağlı.':'Advanced planning is connected only in Mock mode.'));return;}
 root.append(node('h3',language==='tr'?'Kategori uzmanlığı':'Category expertise'),node('p',a.expertise));
 root.appendChild(node('p',a.memory==='isolated_postgres'?(language==='tr'?'Deterministik Mock taslak · İzole yerel PostgreSQL hafızası · Gerçek AI kapalı.':'Deterministic Mock draft · Isolated local PostgreSQL memory · Real AI disabled.'):(language==='tr'?'Deterministik taslak · İmzalı tarayıcı hafızası · Gerçek AI/veritabanı değil.':'Deterministic draft · Signed browser memory · Not real AI or durable database storage.')));
 if(a.conflicts.length)root.appendChild(node('p',(language==='tr'?'Çelişkiler: ':'Conflicts: ')+a.conflicts.map(c=>fieldLabel(c.fieldId)+' ('+c.values.join(' / ')+')').join('; ')));
 if(a.plan){const plan=a.plan;root.append(node('h3',plan.title+' · v'+plan.version),node('p',plan.expertise));const steps=node('ol');plan.steps.forEach(step=>{const item=node('li');item.append(node('strong',step.title),node('p',step.detail));steps.appendChild(item)});root.appendChild(steps);
 root.append(node('h4',language==='tr'?'Önerilen çıktılar':'Proposed outputs'),node('p',plan.outputs.join(' · ')),node('h4',language==='tr'?'Kalite kontrolleri':'Quality checks'),node('p',plan.qualityChecks.join(' · ')));
 if(plan.notes)root.appendChild(node('p',(language==='tr'?'Revizyon talebi (kural tabanlı kaydedildi): ':'Revision instructions (stored, not interpreted by a real model): ')+plan.notes));
 if(plan.blockers.length)root.appendChild(node('p',(language==='tr'?'Doğrulama bekleyen alanlar: ':'Unresolved verification: ')+plan.blockers.map(fieldLabel).join(', ')));
 }
 const controls=node('div');const button=(label,operation,disabled,note)=>{const b=node('button',label);b.type='button';b.disabled=busy||disabled;b.dataset.planAction=operation;b.onclick=()=>planAction(operation,note?.());controls.appendChild(b);};
 button(language==='tr'?'Taslak plan oluştur':'Create draft plan','create',!a.canDraft||Boolean(a.plan));button(language==='tr'?'Planı yeniden oluştur':'Rebuild plan','rebuild',!a.canDraft||!a.plan);
 button(language==='tr'?'Bu sürümü Mock olarak onayla':'Approve this version (Mock)','approve',!a.canApprove||a.approved);button(language==='tr'?'Mock onayı kaldır':'Revoke Mock approval','revoke',!a.approved);
 const note=node('textarea');note.id='advanced-plan-note';note.maxLength=1000;note.placeholder=language==='tr'?'Plan revizyon notu…':'Plan revision instructions…';note.setAttribute('aria-label',note.placeholder);note.disabled=busy;root.appendChild(note);
 button(language==='tr'?'Revizyon notuyla güncelle':'Update with revision notes','revise',!a.plan||!a.canDraft,()=>note.value.trim());const fresh=node('button',language==='tr'?'Yeni sohbet projesi':'New chat project');fresh.type='button';fresh.dataset.planAction='new_project';fresh.disabled=busy;fresh.onclick=()=>$('#b2-new-project').click();controls.appendChild(fresh);root.appendChild(controls);
 root.appendChild(node('p',language==='tr'?'Mock onay sürüme bağlıdır; brief/plan değişirse geçersiz olur. Hiçbir üretim aracı veya Production Credit işlemi bağlı değildir.':'Mock approval is tied to this version and invalidated by brief/plan changes. No production adapters or Production Credit operations are connected.'));
}
function resizePreview(){const frame=$('#website-frame');if(!frame)return;const stage=$('#site-stage'),available=Math.max(100,stage.clientWidth-24),width=device==='desktop'?1280:device==='tablet'?768:390,scale=Math.min(1,available/width),height=Math.max(160,(stage.clientHeight-50)/scale);frame.style.cssText='border:0;background:white;width:'+width+'px;height:'+height+'px;transform:scale('+scale+');transform-origin:top left';$('#site-wrapper').style.cssText='width:'+width*scale+'px;height:'+height*scale+'px';$('#preview-scale').textContent=width+'px · '+Math.round(scale*100)+'%';}
function setDevice(value){device=value;document.querySelectorAll('[data-device]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.device===device)));resizePreview();}
function installWebsite(data){websiteData=data;if(data.state!=='ready'||typeof data.html!=='string'){showCanvas('unavailable',data.reason);draw();return;}
 const doc=new DOMParser().parseFromString(data.html,'text/html');doc.querySelectorAll('script,base,iframe,object,embed,meta[http-equiv],link[rel="preload"],link[rel="modulepreload"]').forEach(n=>n.remove());doc.querySelectorAll('*').forEach(n=>{for(const a of [...n.attributes])if(/^on/i.test(a.name)||['srcdoc','formaction'].includes(a.name))n.removeAttribute(a.name)});doc.querySelectorAll('a[href]').forEach(n=>n.removeAttribute('href'));doc.querySelectorAll('form').forEach(n=>n.removeAttribute('action'));const policy=doc.createElement('meta');policy.httpEquiv='Content-Security-Policy';policy.content="default-src 'none'; style-src 'unsafe-inline' https:; img-src data: https:; font-src https:; script-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'";doc.head.prepend(policy);
 const frame=node('iframe');frame.id='website-frame';frame.title='Doğrulanmış Website kaynağı — salt okunur';frame.setAttribute('sandbox','');frame.referrerPolicy='no-referrer';frame.srcdoc='<!doctype html>'+doc.documentElement.outerHTML;$('#site-wrapper').replaceChildren(frame);
 const pages=$('#website-pages');pages.replaceChildren();data.pages.forEach(p=>{const option=node('option',p.label);option.value=p.path;pages.appendChild(option)});pages.disabled=false;pages.value=data.page||'index.html';showCanvas('ready');showAux('canvas');resizePreview();draw();
}
async function previewWebsite(id,page='index.html'){const seq=epoch,load=++previewEpoch;showCanvas('loading');try{const data=await request('/api/studio/website-preview?projectId='+encodeURIComponent(id)+'&page='+encodeURIComponent(page));if(seq!==epoch||load!==previewEpoch||current.id!=='website'||selectedProduction!==id)return;if(data.projectId!==id)throw Error('Önizleme proje eşleşmesi doğrulanamadı.');installWebsite({...data,page});}catch(error){if(seq===epoch&&load===previewEpoch){websiteData=null;showCanvas('unavailable');uiError=error.message;draw();}}}
// Explicit handoff to the existing Website Builder draft API. This does not approve,
// render, spend credits, or silently create a production from a chat message.
async function reviewWebsiteDraft(){
 if(busy||!session||!project||mode!=='real'||current.id!=='website'||status?.isolatedPreview||!project.productionId)return;
 const seq=epoch;busy=true;uiError='';draw();
 try{
  const result=await websiteAssistantRequest({action:'website_open',productionId:project.productionId});
  if(seq!==epoch)return;
  websiteData=result;
  selectedProduction=result.productionId;
  websiteSelectedPackId=result.website?.packId||'';
 }catch(error){if(seq===epoch)showError(error);}finally{if(seq===epoch){busy=false;draw();if(activeView==='brief')showAux('brief');}}
}
async function approveWebsitePlan(){
 if(busy||!session||!project||mode!=='real'||current.id!=='website'||status?.isolatedPreview||!project.productionId)return;
 const w=websiteData?.website;
 if(websiteData?.productionId!==project.productionId||!w?.review?.ready||!w.planHash||!w.packId||!Number.isSafeInteger(w.credits)||w.credits<=0){uiError='Önce güncel Website planını ve fiyatını kontrol edin.';draw();return;}
 const packs=window.__studioB2?.websitePacks||[];
 const pack=packs.find(p=>p.id===w.packId&&p.credits===w.credits&&(!/admin|commerce|checkout/i.test(p.label)||p.id==='website_basic_admin'));
 if(!pack){uiError='Paket veya kredi fiyatı değişmiş. Planı yeniden kontrol edin.';draw();return;}
 const productionId=project.productionId,planHash=w.planHash,credits=w.credits;
 const confirmed=window.confirm(pack.label+' paketini '+credits+' Production Credits tutarıyla onaylıyor musunuz? Bu işlem site üretimini BAŞLATMAZ ve kredi HARCAMAZ.');
 if(!confirmed)return;
 const seq=epoch;busy=true;uiError='';draw();
 try{
  const result=await websiteAssistantRequest({action:'website_approve',productionId,planHash});
  if(seq!==epoch)return;
  if(result.productionId!==productionId||result.website?.approvedHash!==planHash)throw Error('Website onayı doğrulanamadı. Planı yeniden açın.');
  websiteData=result;
  uiError='Website planı onaylandı. Gerçek üretim ve kredi tahsilatı henüz başlatılmadı.';
 }catch(error){if(seq===epoch){websiteData=null;showError(error);}}finally{if(seq===epoch){busy=false;draw();if(activeView==='brief')showAux('brief');}}
}
let websiteSelectedPackId='';
async function downloadWebsiteZip(id){
 if(busy||!session?.accessToken||mode!=='real'||current.id!=='website'||status?.isolatedPreview||id!==selectedProduction)return;
 const seq=epoch;busy=true;uiError='';draw();
 try{
  const response=await fetch('/api/productions/'+encodeURIComponent(id)+'/delivery?file=zip',{method:'GET',headers:{Authorization:'Bearer '+session.accessToken},credentials:'include',redirect:'error',cache:'no-store'});
  if(!response.ok||!/^application\/zip(?:;|$)/i.test(response.headers.get('content-type')||''))throw Error('ZIP paketi henüz teslimata hazır değil ('+response.status+').');
  const file=await response.blob();if(seq!==epoch)return;
  if(file.size===0||file.size>25000000)throw Error('ZIP paket boyutu beklenen aralıkta değil.');
  const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='crelavo-website-'+id+'.zip';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }catch(error){if(seq===epoch)showError(error);}finally{if(seq===epoch){busy=false;draw();}}
}
async function checkCentralWebsiteStatus(){
 if(busy||!session||!project||mode!=='real'||current.id!=='website'||status?.isolatedPreview||!project.productionId)return;
 const seq=epoch,projectId=project.id,productionId=project.productionId;
 busy=true;uiError='';draw();
 try{
  const fresh=await websiteAssistantRequest({action:'website_open',productionId});
  if(seq!==epoch||project?.id!==projectId||project.productionId!==productionId)return;
  if(fresh.productionId!==productionId)throw Error('Website proje bağlantısı doğrulanamadı.');
  websiteData=fresh;selectedProduction=productionId;
  uiError='Üretim durumu: '+String(fresh.status||'bilinmiyor');
  if(fresh.status==='ready')void previewWebsite(productionId);

 }catch(error){if(seq===epoch)showError(error);}
 finally{if(seq===epoch){busy=false;draw();if(activeView==='brief')showAux('brief');}}
}
async function renderApprovedWebsite(){
 if(busy||!session||!project||mode!=='real'||current.id!=='website'||status?.isolatedPreview||!project.productionId)return;
 const w=websiteData?.website;
 if(websiteData?.productionId!==project.productionId||w?.approvedHash!==w?.planHash||!w?.planHash||!Number.isSafeInteger(w.credits)||w.credits<=0){uiError='Güncel plan onayı gerekli.';draw();return;}
 const pack=(window.__studioB2?.websitePacks||[]).find(p=>p.id===w.packId&&p.credits===w.credits&&(!/admin|commerce|checkout/i.test(p.label)||p.id==='website_basic_admin'));
 if(!pack){uiError='Paket fiyatı değişti. Yeniden onaylayın.';draw();return;}
 const seq=epoch,projectId=project.id,productionId=project.productionId,planHash=w.planHash;
 busy=true;uiError='';draw();
 try{
  // Both Website entry points reuse the persisted production plan and prepaid coordinator.
  // The live Website assistant stores its own production ID; no parallel agent database is required.
  if(!window.confirm('Bu web sitesinin üretimi '+w.credits+' kredi. Başlatılsın mı?'))return;
  const result=await request('/api/websites/generate',{user_id:session.userId,action:'generate',productionId,planHash,confirmProduction:true});
  if(seq!==epoch||project?.id!==projectId||project.productionId!==productionId)return;
  if(!['ready','already_ready'].includes(result.state)||result.productionId!==productionId)throw Error('Teslimat henüz doğrulanmadı. Proje durumunu kontrol edin.');
  const fresh=await websiteAssistantRequest({action:'website_open',productionId});
  if(seq!==epoch||project?.id!==projectId||project.productionId!==productionId)return;
  if(fresh.productionId!==productionId||fresh.status!=='ready')throw Error('Website proje bağlantısı doğrulanamadı.');
  websiteData=fresh;selectedProduction=productionId;
  uiError='Web sitesi hazır. Önizleme, görsel editör ve ZIP teslimatı kullanılabilir.';
  void previewWebsite(productionId);

 }catch(error){if(seq===epoch)showError(error);}
 finally{if(seq===epoch){busy=false;draw();if(activeView==='brief')showAux('brief');}}
}

async function handoffWebsiteDraft(){
 if(busy||!session||!project||mode!=='real'||current.id!=='website'||status?.isolatedPreview)return;
 const fields=project.snapshot?.fields||{};
 if(typeof fields.brief!=='string'||!fields.brief.trim()||typeof fields.business_name!=='string'||!fields.business_name.trim()){
  uiError='Önce proje fikrini ve işletme adını tamamlayın.';draw();return;
 }
 const seq=epoch;busy=true;uiError='';draw();
 try{
  const websiteBrief={brand:fields.business_name,brief:fields.brief,...(fields.audience?{audience:String(fields.audience)}:{}),...(fields.site_type?{siteType:String(fields.site_type)}:{}),...(fields.design_style?{style:String(fields.design_style)}:{}),...(fields.pages?{pages:String(fields.pages)}:{}),...(fields.language?{locale:String(fields.language)}:{})};
  if(project.productionId&&selectedProduction!==project.productionId)throw Error('Website proje bağlantısı güncel değil. Taslağı yeniden açıp kontrol edin.');
  const packs=window.__studioB2?.websitePacks||[];
  const chosen=packs.find(pack=>pack.id===websiteSelectedPackId);
  if(!chosen)throw Error('Önce Website paketini seçin.');
  if(/admin|commerce|checkout/i.test(chosen.label)&&chosen.id!=='website_basic_admin')throw Error('Bu paket statik Website üretiminde desteklenmiyor.');
  const result=await websiteAssistantRequest({action:'revise',prompt:fields.brief,packId:chosen.id,websiteBrief,...(project.productionId&&selectedProduction===project.productionId?{productionId:project.productionId}:{})});
  if(seq!==epoch)return;
  if(!result.productionId)throw Error('Website taslağı kimliği alınamadı.');
  if(!status?.realEnabled){applyWebsiteChat(result);}
  else {
    const linked=await api({action:'bind_website',projectId:project.id,productionId:result.productionId});
    if(seq!==epoch)return;
    remember(linked);
  }
  selectedProduction=result.productionId;
  websiteData=result;
  websiteSelectedPackId=result.website?.packId||chosen.id;
  showCanvas('unavailable','output_not_ready');
  uiError='Website Builder taslağı ve seçilen paket kaydedildi. Üretim başlatılmadı, kredi harcanmadı. Güncel planı kontrol ederek ayrıca onaylayın.';
 }catch(error){if(seq===epoch)showError(error);}finally{if(seq===epoch){busy=false;draw();if(activeView==='brief')showAux('brief');}}
}
async function createProject(productionId){const seq=epoch;const data=await api({action:'create',...(productionId?{productionId}:{})});if(seq!==epoch)return;pending=null;remember(data);}
async function restore(){const seq=epoch;try{let saved=null;try{saved=JSON.parse(sessionStorage.getItem(key())||'null');}catch(_error){/* Continue without persisted conversation when browser storage is blocked. */}if(saved){const data=await api({action:'load',projectId:saved.projectId,...(saved.mockState?{mockState:saved.mockState}:{})});if(seq!==epoch)return;remember(data);if(current.id==='website'&&data.project.productionId){selectedProduction=data.project.productionId;await previewWebsite(selectedProduction);}}else await createProject();}catch(error){if(seq===epoch)showError(error)}}
function showError(error){uiError=error.message;draw();}
async function openWebsite(id){
 epoch++;project=null;websiteData=null;mockState='';pending=null;busy=false;uiError='';clearCanvas();selectedProduction=id;showAux('canvas');showCanvas('loading');draw();
 const seq=epoch;const preview=previewWebsite(id);
 try{
  if(current.id==='website'&&!status?.realEnabled){
   const result=await websiteAssistantRequest({action:'website_open',productionId:id});
   if(seq===epoch)applyWebsiteChat(result);
  }else await createProject(id);
 }catch(error){
  if(seq===epoch&&current.id==='website'&&!status?.realEnabled){
   uiError='Eski Website Builder projesi: Canvas önizlemesini ve Website oluştur aracını kullanabilirsiniz.';draw();
  }else if(seq===epoch)showError(error);
 }
 await preview;
}
function applyWebsiteChat(result){
 if(!result||!result.productionId||!result.website)throw Error('Website sohbet projesi doğrulanamadı.');
 const b=result.website.brief||{};
 const fields={};
 const mapping={brief:'brief',brand:'business_name',audience:'audience',siteType:'site_type',style:'design_style',locale:'language'};
 Object.keys(mapping).forEach(key=>{if(typeof b[key]==='string'&&b[key].trim())fields[mapping[key]]=b[key]});
 if(Array.isArray(b.pages)&&b.pages.length)fields.pages=b.pages.join(', ');
 if(Array.isArray(b.features)&&b.features.length)fields.features_and_integrations=b.features.join(', ');
 const messages=Array.isArray(result.website.messages)?result.website.messages
   .filter(item=>item&&['user','assistant'].includes(item.role)&&typeof item.content==='string').slice(-30):[];
 const previous=project?.id===result.productionId?project:null;
 project={id:result.productionId,userId:session.userId,categoryId:'website',title:result.title||'Website projesi',
  productionId:result.productionId,snapshot:{categoryId:'website',revision:(previous?.snapshot?.revision||0)+1,fields},
  messages};
 serverPlanning=null;
 websiteData=result;
 selectedProduction=result.productionId;
 websiteSelectedPackId=result.website.packId||websiteSelectedPackId;
 if(result.status==='ready'){
  void previewWebsite(result.productionId);
 }else{
  // A revised brief is not a published website. Never leave a previous
  // production's preview visible against a new draft.
  if(canvasState==='ready'){
   $('#site-wrapper').replaceChildren();
   $('#website-pages').replaceChildren(node('option','Sayfa yok'));
   $('#website-pages').disabled=true;
   showCanvas('unavailable','output_not_ready');
  }
 }
 draw();
}
function websiteAssistantRequest(payload){
 return request('/api/assistant-work',{category:'website',type:'Website',prompt:'',...payload});
}
function localCategoryKey(){return 'crelavo-studio-category-chat:'+session?.userId+':'+current.id;}
function restoreLocalCategoryChat(){
 if(current.id==='website'||!session||status?.realEnabled)return;
 let saved=[];try{const parsed=JSON.parse(sessionStorage.getItem(localCategoryKey())||'[]');if(Array.isArray(parsed))saved=parsed;}catch(_error){}
 const messages=saved.filter(item=>item&&['user','assistant'].includes(item.role)&&typeof item.content==='string')
  .slice(-24).map(item=>({role:item.role,content:item.content.slice(0,6000)}));
 project={id:crypto.randomUUID(),userId:session.userId,categoryId:current.id,title:current.label,
  productionId:null,snapshot:{categoryId:current.id,revision:messages.length,fields:{}},messages};
 serverPlanning=null;walletCache=null;draw();
}
function saveLocalCategoryChat(){
 if(current.id==='website'||!session||!project)return;
 try{sessionStorage.setItem(localCategoryKey(),JSON.stringify(project.messages.slice(-24)));}catch(_error){}
}
async function sendMessage(defaults=[]){
 const message=$('#prompt').value.trim();if(!message||busy||!session)return;
 const seq=epoch;busy=true;uiError='';draw();
 try{
  if(current.id==='website'&&mode==='real'&&!status?.realEnabled){
   const result=await websiteAssistantRequest({action:'revise',prompt:message,
     ...(websiteSelectedPackId?{packId:websiteSelectedPackId}:{}),...(websiteData?.website&&websiteData.productionId&&websiteData.status!=='ready'?{productionId:websiteData.productionId}:{})});
   if(seq!==epoch)return;
   $('#prompt').value='';pending=null;applyWebsiteChat(result);return;
  }
  if(mode==='real'&&!status?.realEnabled&&current.id!=='website'){
   if(!project||project.categoryId!==current.id)restoreLocalCategoryChat();
   const history=(project?.messages||[]).slice(-12);
   const response=await request('/api/assistant-work',{category:current.id,type:current.label,
     prompt:message,messages:history,render:false});
   if(seq!==epoch)return;
   if(typeof response.reply!=='string'||!response.reply.trim()||response.spend!==false)
     throw Error('Planlama sohbeti yanıtı doğrulanamadı; üretim yapılmadı.');
   project.messages=[...(project.messages||[]),{role:'user',content:message},
     {role:'assistant',content:response.reply.slice(0,6000)}].slice(-24);
   project.snapshot.revision+=1;
   $('#prompt').value='';pending=null;saveLocalCategoryChat();draw();return;
  }
  if(!project)await createProject();
  if(seq!==epoch||!project)return;
  const signature=JSON.stringify([project.id,message,defaults]);
  if(!pending||pending.signature!==signature)pending={signature,requestId:crypto.randomUUID()};
  const data=await api({action:'message',projectId:project.id,requestId:pending.requestId,message,acceptedDefaults:defaults,...(mockState?{mockState}:{})});
  if(seq!==epoch)return;$('#prompt').value='';pending=null;remember(data);
 }catch(error){if(seq===epoch)showError(error)}
 finally{if(seq===epoch){busy=false;draw();}}
}
async function savedConversations(){if(!status?.realEnabled&&mode==='real'&&current.id!=='website'){uiError='Bu kategoride sohbet, mevcut tarayıcı sekmesinde saklanır. Sunucuya kayıtlı sohbet listesi henüz bağlı değil.';draw();return;}if(current.id==='website'&&!status?.realEnabled){await savedWebsites();return;}if(mode==='mock'){await restore();return;}const seq=epoch,data=await api({action:'projects'});if(seq!==epoch)return;const select=$('#b2-projects');select.replaceChildren(node('option',t(17)));for(const p of data.projects||[]){const o=node('option',p.title);o.value=p.id;select.appendChild(o);}}
async function loadReadyVideoCanvas(){
 if(!session||!current||!['video','clips','video_edit','series','avatar','localization'].includes(current.kind))return;
 const startEpoch=epoch;
 const loading=$('#view-status');if(loading)loading.textContent=language==='tr'?'Videolar yükleniyor…':'Loading saved videos…';
 const empty=$('#empty-title');if(empty)empty.textContent=language==='tr'?'Kayıtlı videolar yükleniyor…':'Loading saved video projects…';
 try{
  const results=await request('/api/studio/video-library');
  if(startEpoch!==epoch||!session||current.kind!=='video'&&
    !['clips','video_edit','series','avatar','localization'].includes(current.kind))return;
  window.studioWorkspace?.showVideoLibrary(Array.isArray(results.projects)?results.projects:[]);
  if(results.projects?.length)$('#view-status').textContent=results.projects.length+' saved video outputs';
 }catch(error){
  if(startEpoch!==epoch)return;
  window.studioWorkspace?.showVideoLibrary([]);
  const note=$('#view-status');
  if(note)note.textContent='Video library unavailable';
 }
}
async function savedWebsites(){if(status?.isolatedPreview){uiError='İzole Preview: Production projelerine erişim kapalı; yalnızca demo brief ve plan gösterilir.';draw();return;} if(current.id!=='website'){await savedConversations();return;}const seq=epoch;const root=$('#saved-websites');root.hidden=false;root.replaceChildren(node('span','Projeler yükleniyor…'));const data=await request('/api/websites?user_id='+encodeURIComponent(session.userId));if(seq!==epoch)return;root.replaceChildren();if(!data.websites?.length)root.appendChild(node('span','Henüz kayıtlı Website yok.'));for(const item of data.websites||[]){const button=node('button',item.title||'Website projesi');button.dataset.productionId=item.id;button.onclick=()=>openWebsite(item.id).catch(showError);root.appendChild(button);}}
function tools(){const root=$('#category-tools');root.replaceChildren(node('strong',current.panel.title));current.panel.tools.forEach(name=>{const button=node('button',name);const free=['Responsive preview','Device preview','Platform preview','Review evidence','Review language','Review tasks','Review script'].includes(name);button.disabled=!free;button.dataset.tool=name;button.dataset.requiresProduction=String(!free);button.title=free?'Ücretsiz çalışma alanı görünümü':'Bu araç bu aşamada bağlı değil; üretim veya kredi işlemi yapılmaz.';if(free)button.onclick=()=>showAux(name.includes('preview')?'canvas':name.includes('evidence')?'assets':'brief');root.appendChild(button);});}
function studioWebsiteBrief(){
 const stored=websiteData?.website?.brief||{};
 const fields=project?.snapshot?.fields||{};
 const entries=value=>Array.isArray(value)?value:String(value||'').split(',').map(item=>item.trim()).filter(Boolean);
 return {
  brand:stored.brand||fields.business_name||'',
  brief:stored.brief||fields.brief||'',
  audience:stored.audience||fields.audience||'',
  siteType:stored.siteType||fields.site_type||'',
  style:stored.style||fields.design_style||'',
  pages:entries(stored.pages||fields.pages),
  features:entries(stored.features||fields.features_and_integrations)
 };
}
function openFunctionalWebsiteBuilder(panel='builder'){
 if(current.id!=='website')return;
 activeView='builder';
 document.querySelectorAll('[data-view]').forEach(button=>button.classList.remove('active'));
 const root=$('#aux-panel');
 root.hidden=false;
 root.replaceChildren();
 root.style.padding='0';
 root.style.overflow='hidden';
 const frame=document.createElement('iframe');
 frame.id='studio-website-builder-frame';
 frame.title='Crelavo Website Builder: gerçek üretim, önizleme, revizyon ve ZIP';
 frame.src='/dashboard/website-builder';
 frame.setAttribute('loading','eager');
 frame.style.cssText='display:block;width:100%;height:100%;border:0;background:#0c0914';
 frame.addEventListener('load',()=>{
  if(!frame.isConnected||!frame.contentWindow)return;
  frame.contentWindow.postMessage({type:'crelavo-studio-website-brief',brief:studioWebsiteBrief()},parent.location.origin);
  if(selectedProduction&&canvasState==='ready')
   frame.contentWindow.postMessage({type:'crelavo-studio-website-open',productionId:selectedProduction,panel:typeof panel==='string'?panel:'builder'},parent.location.origin);
 });
 root.appendChild(frame);
}
addEventListener('message',event=>{
 const library=$('#aux-panel iframe[src="/dashboard/studio-elements"]');
 if(!session||!library||event.origin!==parent.location.origin||
     event.source!==library.contentWindow||
     event.data?.type!=='crelavo-studio-asset-reference'||
     event.data.owner!==session.userId)return;
 const name=typeof event.data.name==='string'?event.data.name.trim().slice(0,100):'';
 const kind=typeof event.data.kind==='string'?event.data.kind.trim().slice(0,30):'';
 const description=typeof event.data.description==='string'?event.data.description.trim().slice(0,400):'';
 if(!name||!/^(character|product|location|wardrobe|voice|style|reference)$/.test(kind))return;
 const next='Reference ('+kind+'): '+name+(description?' — '+description:'')+
  '\\nNote: source file is saved locally; file content is not attached to the AI.';
 const composer=$('#prompt');
 composer.value=(composer.value.trim()?composer.value.trim()+'\\n':'')+next;
 composer.focus();
 showAux('canvas');
});
function openStudioImageEditor(){
 if(!session||!['image','character','brand'].includes($('.studio')?.dataset?.kind||''))return;
 activeView='image-editor';
 const root=$('#aux-panel');root.replaceChildren();root.hidden=false;
 root.style.padding='0';root.style.overflow='hidden';
 const frame=node('iframe');frame.id='studio-image-editor-frame';
 frame.title='Crelavo local image editor';frame.src='/dashboard/studio-image-editor';
 frame.setAttribute('loading','eager');
 frame.style.cssText='display:block;width:100%;height:100%;border:0;background:#120e1b';
 root.append(frame);
}
addEventListener('crelavo-studio-open-image-editor',openStudioImageEditor);
function openStudioVideoEditor(){
 if(!session||!['video','clips','video_edit','series','avatar','localization'].includes(current.kind))return;
 activeView='video-editor';
 const root=$('#aux-panel');
 root.replaceChildren();
 root.hidden=false;
 root.style.padding='0';
 root.style.overflow='hidden';
 const frame=node('iframe');
 frame.id='studio-video-editor-frame';
 frame.title='Crelavo local video timeline editor';
 frame.src='/dashboard/studio-video-editor';
 frame.setAttribute('loading','eager');
 frame.style.cssText='display:block;border:0;width:100%;height:100%;background:#110e1b';
 root.append(frame);
}
addEventListener('crelavo-studio-open-video-editor',openStudioVideoEditor);
function studioWebsiteAction(action){
 if(current.id!=='website'||!session)return;
 if(['edit','history','design','create'].includes(action)){openFunctionalWebsiteBuilder(action==='history'?'history':'editor');return;}
 if(action==='zip'&&selectedProduction&&canvasState==='ready'){
  void downloadWebsiteZip(selectedProduction);return;
 }
 if(action==='preview'&&selectedProduction)void previewWebsite(selectedProduction);
}
addEventListener('crelavo-studio-action',event=>{
 const action=event?.detail?.action;
 if(typeof action==='string')studioWebsiteAction(action);
});
function setup(){
 window.studioWorkspace?.configure(current,project,websiteData,referenceFile);
  if(!$('#advanced-open-plan')){const b=node('button','≡');b.id='advanced-open-plan';b.type='button';b.title='Brief & Plan';b.setAttribute('aria-label','Brief & Plan');b.onclick=()=>showAux('brief');$('.canvas-rail').appendChild(b);}
 const studioLang=$('#studio-ui-language');if(studioLang){studioLang.value=language;studioLang.onchange=()=>setStudioLanguage(studioLang.value);}
 updateStudioLanguage();
 const lang=$('#b2-language');lang.replaceChildren();['tr','en','de','es','fr','ar'].forEach(code=>{const o=node('option',code.toUpperCase());o.value=code;lang.appendChild(o)});lang.value=language;lang.onchange=()=>setStudioLanguage(lang.value);
 // Use the original top-toolbar Create action, not an extra button
 // pasted over the reference Canvas artwork.
 const createControl=$('[data-global="create"]');
 if(createControl){
  const stagedImage=window.__studioB2?.stagedImageWorkspace&&['image','brand_kit','visual_clone','virtual_model_studio'].includes(current.id);
  createControl.disabled=current.id!=='website'&&!stagedImage;
  createControl.title=current.id==='website'?'Open Website Builder':stagedImage?'Open staged image production':'Production not enabled for this category';
  createControl.onclick=current.id==='website'?openFunctionalWebsiteBuilder:stagedImage?()=>{
   if(session){try{const brief=(project?.messages||[]).filter(m=>m.role==='user').map(m=>m.content).join('\n').slice(-1000);sessionStorage.setItem('crelavo-stage-draft:'+session.userId+':'+current.id,brief);}catch(_error){}}
   parent.location.href='/dashboard/staged-productions?category='+encodeURIComponent(current.id);
  }:null;
 }
 $('#website-builder-open')?.remove();
 if(current.id==='website'){
  if(!$('#website-builder-rail')){
   const button=node('button','▣');
   button.id='website-builder-rail';button.type='button';button.title='Website Builder';
   button.onclick=openFunctionalWebsiteBuilder;
   $('.canvas-rail').appendChild(button);
  }
 }else $('#website-builder-rail')?.remove();
 const modes=$('#b2-mode');modes.replaceChildren();['mock','real'].forEach(value=>{const o=node('option',value==='mock'?'Mock demo':'Real AI');o.value=value;o.disabled=value==='mock'?!status?.mockAllowed:false;modes.appendChild(o)});modes.value=mode;modes.onchange=()=>{mode=modes.value;epoch++;project=null;mockState='';walletCache=null;pending=null;busy=false;uiError='';resetProjectNav();clearCanvas();setup();if(status?.realEnabled||mode==='mock'&&status?.mockAllowed)restore();else if(current.id!=='website')restoreLocalCategoryChat()};
 $('#b2-new-project').onclick=()=>{epoch++;project=null;websiteData=null;selectedProduction=null;mockState='';pending=null;uiError='';clearCanvas();draw();if(!status?.realEnabled){if(current.id==='website'){$('#prompt').focus();return;}try{sessionStorage.removeItem(localCategoryKey());}catch(_error){}restoreLocalCategoryChat();$('#prompt').focus();return;}createProject().catch(showError)};
 $('#b2-defaults').onclick=()=>{const list=Object.keys(window.__studioB2?.defaults?.[current.id]||{});if(!list.length)return;$('#prompt').value=language==='tr'?'Önerilen varsayılanları kullan.':'Use the proposed defaults.';sendMessage(list)};
 $('#b2-projects').onfocus=()=>savedConversations().catch(showError);$('#b2-projects').onchange=async()=>{const value=$('#b2-projects').value;if(!value)return;epoch++;clearCanvas();const seq=epoch;try{const data=await api({action:'load',projectId:value});if(seq!==epoch)return;remember(data);if(current.id==='website'&&project.productionId){selectedProduction=project.productionId;await previewWebsite(selectedProduction)}}catch(error){if(seq===epoch)showError(error)}};
 $('#send').onclick=()=>sendMessage();$('#prompt').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendMessage()}};
 $('#file').accept=current.panel.accept||'image/*,audio/*,video/*,.pdf,.txt';$('#file').onchange=()=>{referenceFile=$('#file').files?.[0]||null;$('#b2-attachment').textContent=referenceFile?referenceFile.name+' — '+t(9):'';window.studioWorkspace?.refresh(project,websiteData,referenceFile);if(activeView==='assets')showAux('assets')};$('#b2-file-button').onclick=()=>$('#file').click();$('#add-reference').onclick=()=>$('#file').click();
 $('#b2-saved-sites').onclick=()=>savedWebsites().catch(showError);$('#open-projects').onclick=()=>{if(innerWidth<=900)setPanel('categories');savedWebsites().catch(showError)};$('#start-conversation').onclick=()=>{if(innerWidth<=900)setPanel('assistant');$('#prompt').focus()};$('#studio-home').onclick=()=>setPanel('canvas');document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>showAux(b.dataset.view));document.querySelectorAll('[data-device]').forEach(b=>b.onclick=()=>setDevice(b.dataset.device));$('#website-pages').onchange=()=>{if(selectedProduction)previewWebsite(selectedProduction,$('#website-pages').value)};$('#refresh-preview').onclick=()=>{if(selectedProduction)previewWebsite(selectedProduction,$('#website-pages').value||'index.html');else showCanvas('empty')};tools();showCanvas(canvasState);draw();
}
addEventListener('crelavo-studio-video-metadata',event=>{
 const data=event.detail||{};
 if(!activeVideoSelection||activeVideoSelection.id!==data.id)return;
 const specs={...(activeVideoSelection.specs||{})};
 const duration=Number(data.durationSeconds);
 if(!Number.isFinite(Number(specs.durationSeconds))||Number(specs.durationSeconds)<=0)
  if(Number.isFinite(duration)&&duration>0&&duration<=7200)specs.durationSeconds=Math.round(duration*10)/10;
 if(!specs.aspectRatio&&typeof data.aspectRatio==='string'&&data.aspectRatio.length<30)
  specs.aspectRatio=data.aspectRatio;
 activeVideoSelection={...activeVideoSelection,specs};
 draw();
});
addEventListener('crelavo-studio-video-selected',event=>{
 if(!current||!['video','clips','video_edit','series','avatar','localization'].includes(current.kind))return;
 const detail=event.detail||{};
 if(typeof detail.id!=='string'||typeof detail.title!=='string')return;
 activeVideoSelection={id:detail.id,title:detail.title,scenes:Number(detail.scenes)||1,
  specs:detail.specs&&typeof detail.specs==='object'?detail.specs:{}};
 $('#project-title').textContent=detail.title;
 draw();
});
const originalSelect=selectCategory;selectCategory=function(...args){epoch++;activeVideoSelection=null;project=null;mockState='';pending=null;busy=false;uiError='';referenceFile=null;$('#file').value='';$('#b2-attachment').textContent='';resetProjectNav();originalSelect(...args);clearCanvas();showAux('canvas');setup();if(session){
 if(status?.realEnabled||mode==='mock'&&status?.mockAllowed)restore();
 else if(current.id!=='website')restoreLocalCategoryChat();
 void loadReadyVideoCanvas();
}};send=()=>sendMessage();
// Only accept a finished production ID from the currently mounted, same-origin
// Website Builder frame. The preview endpoint independently verifies ownership.
addEventListener('message',event=>{
 const builder=$('#studio-website-builder-frame');
 if(event.origin!==parent.location.origin||!builder||event.source!==builder.contentWindow||
    !['crelavo-studio-website-created','crelavo-studio-website-updated'].includes(event.data?.type))return;
 const id=String(event.data.productionId||'');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return;
 if(current.id!=='website'||!session)return;
 selectedProduction=id;
 websiteData=null;
 showAux('canvas');
 void previewWebsite(id);
});
addEventListener('resize',resizePreview);new ResizeObserver(resizePreview).observe($('.canvas'));
addEventListener('message',async event=>{if(event.source!==parent||event.origin!==parent.location.origin||event.data?.type!=='crelavo-studio-session')return;const incoming=event.data.accessToken&&event.data.userId?{accessToken:event.data.accessToken,userId:event.data.userId}:null;if(session&&incoming&&session.userId===incoming.userId){session=incoming;return;}epoch++;session=incoming;status=null;walletCache=null;liveProductionBalance=null;$('#prompt').value='';$('#file').value='';$('#b2-attachment').textContent='';referenceFile=null;project=null;mockState='';busy=false;pending=null;uiError='';resetProjectNav();clearCanvas();setup();if(!session)return;try{status=await request('/api/studio/conversation');
 try{
  const credits=await request('/api/credits/balance?user_id='+encodeURIComponent(session.userId));
  liveProductionBalance=Number.isFinite(credits.available)?credits.available:null;
 }catch(_error){liveProductionBalance=null;}
 setup();
 if(status.realEnabled||status.mockAllowed){
  await restore();
 }else{
  uiError='';
  if(current.id!=='website')restoreLocalCategoryChat();
  else draw();
  void loadReadyVideoCanvas();
 }}catch(error){showError(error)}});
let localeRefreshPending=false,localeRefreshActive=false;
const localizeObserver=new MutationObserver(()=>{
 if(localeRefreshActive||localeRefreshPending)return;
 localeRefreshPending=true;
 requestAnimationFrame(()=>{
  localeRefreshPending=false;
  localeRefreshActive=true;
  try{updateStudioLanguage()}finally{localeRefreshActive=false}
 });
});
// Only new DOM content is localized. Observing each text mutation caused
// repeated translations and visible flicker during initial loading.
localizeObserver.observe(document.body,{subtree:true,childList:true});
setup();
updateStudioLanguage();
})();`;