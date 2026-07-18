"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { defaultLanguage, getStoredLanguage } from "@/lib/i18n";

type LanguageMap = Record<string, string>;
type TranslationRecord = Record<string, LanguageMap>;

const pageTranslations: TranslationRecord = {
  "Open workspace directly": { tr: "Workspace'i direkt aç", de: "Workspace direkt öffnen", es: "Abrir workspace directamente", fr: "Ouvrir l'espace directement", ar: "فتح مساحة العمل مباشرة" },
  "My live productions": { tr: "Canlı üretimlerim", de: "Meine laufenden Produktionen", es: "Mis producciones activas", fr: "Mes productions en cours", ar: "إنتاجاتي النشطة" },
  "Sample video outputs": { tr: "Örnek video çıktıları", de: "Beispiel-Videoausgaben", es: "Ejemplos de video", fr: "Exemples de vidéos", ar: "نماذج مخرجات الفيديو" },
  "Managed AI production, not just generation": { tr: "Sadece üretim değil, yönetilen AI prodüksiyon", de: "Verwaltete KI-Produktion, nicht nur Generierung", es: "Producción IA gestionada, no solo generación", fr: "Production IA gérée, pas seulement génération", ar: "إنتاج ذكاء اصطناعي مُدار وليس مجرد توليد" },
  "Explore Crelavo": { tr: "Crelavo'yu keşfet", de: "Crelavo entdecken", es: "Explora Crelavo", fr: "Explorer Crelavo", ar: "استكشف Crelavo" },
  "Live Production Workspace": { tr: "Canlı Üretim Workspace", de: "Live-Produktions-Workspace", es: "Workspace de producción en vivo", fr: "Espace de production en direct", ar: "مساحة الإنتاج المباشر" },
  "Categories": { tr: "Kategoriler", de: "Kategorien", es: "Categorías", fr: "Catégories", ar: "الفئات" },
  "Pricing & credits": { tr: "Fiyatlandırma ve krediler", de: "Preise & Credits", es: "Precios y créditos", fr: "Tarifs et crédits", ar: "الأسعار والأرصدة" },
  "Blog / Content": { tr: "Blog / İçerik", de: "Blog / Inhalte", es: "Blog / Contenido", fr: "Blog / Contenu", ar: "المدونة / المحتوى" },
  "Open workspace": { tr: "Workspace'i aç", de: "Workspace öffnen", es: "Abrir workspace", fr: "Ouvrir l'espace", ar: "فتح مساحة العمل" },
  "Open category catalog": { tr: "Kategori kataloğunu aç", de: "Kategoriekatalog öffnen", es: "Abrir catálogo de categorías", fr: "Ouvrir le catalogue", ar: "فتح كتالوج الفئات" },
  "Open pricing page": { tr: "Fiyat sayfasını aç", de: "Preisseite öffnen", es: "Abrir precios", fr: "Ouvrir les tarifs", ar: "فتح صفحة الأسعار" },
  "Open blog article": { tr: "Blog yazısını aç", de: "Blogartikel öffnen", es: "Abrir artículo", fr: "Ouvrir l'article", ar: "فتح المقال" },
  "Production categories": { tr: "Üretim kategorileri", de: "Produktionskategorien", es: "Categorías de producción", fr: "Catégories de production", ar: "فئات الإنتاج" },
  "Choose what you want Crelavo to produce": { tr: "Crelavo'nın ne üretmesini istediğini seç", de: "Wähle, was Crelavo produzieren soll", es: "Elige qué quieres que produzca Crelavo", fr: "Choisis ce que Crelavo doit produire", ar: "اختر ما تريد أن تنتجه Crelavo" },
  "Category-based delivery template": { tr: "Kategori bazlı teslimat şablonu", de: "Kategoriebasierte Lieferstruktur", es: "Plantilla de entrega por categoría", fr: "Modèle de livraison par catégorie", ar: "قالب تسليم حسب الفئة" },
  "Choose the production type first, then track delivery files from the panel": { tr: "Önce üretim tipini seç, sonra teslim dosyalarını panelden takip et", de: "Wähle zuerst den Produktionstyp und verfolge dann Dateien im Panel", es: "Elige primero el tipo de producción y sigue los archivos desde el panel", fr: "Choisis d'abord le type de production puis suis les fichiers depuis le panneau", ar: "اختر نوع الإنتاج أولاً ثم تابع ملفات التسليم من اللوحة" },
  "1. Choose a category": { tr: "1. Kategori seç", de: "1. Kategorie wählen", es: "1. Elige una categoría", fr: "1. Choisir une catégorie", ar: "١. اختر فئة" },
  "2. Submit the request": { tr: "2. Talebi gönder", de: "2. Anfrage senden", es: "2. Envía la solicitud", fr: "2. Envoyer la demande", ar: "٢. أرسل الطلب" },
  "3. Receive the files": { tr: "3. Dosyaları al", de: "3. Dateien erhalten", es: "3. Recibe los archivos", fr: "3. Recevoir les fichiers", ar: "٣. استلم الملفات" },
  "Start a request": { tr: "Talep başlat", de: "Anfrage starten", es: "Iniciar solicitud", fr: "Démarrer une demande", ar: "بدء طلب" },
  "AI Assistant Workspace": { tr: "AI Asistan Workspace", de: "KI-Assistent Workspace", es: "Workspace del Asistente IA", fr: "Espace Assistant IA", ar: "مساحة مساعد الذكاء الاصطناعي" },
  "Start new production": { tr: "Yeni üretim başlat", de: "Neue Produktion starten", es: "Iniciar nueva producción", fr: "Démarrer une production", ar: "بدء إنتاج جديد" },
  "Assistant": { tr: "Asistan", de: "Assistent", es: "Asistente", fr: "Assistant", ar: "المساعد" },
  "Start": { tr: "Başla", de: "Start", es: "Empezar", fr: "Démarrer", ar: "ابدأ" },
  "Productions": { tr: "Üretimler", de: "Produktionen", es: "Producciones", fr: "Productions", ar: "الإنتاجات" },
  "Dashboard": { tr: "Panel", de: "Dashboard", es: "Panel", fr: "Tableau", ar: "لوحة التحكم" },
  "Billing / Cancel": { tr: "Ödeme / İptal", de: "Zahlung / Kündigung", es: "Pago / Cancelar", fr: "Paiement / Annuler", ar: "الدفع / الإلغاء" },
  "Home": { tr: "Ana sayfa", de: "Startseite", es: "Inicio", fr: "Accueil", ar: "الرئيسية" },
  "Credits": { tr: "Krediler", de: "Credits", es: "Créditos", fr: "Crédits", ar: "الأرصدة" },
  "Tools": { tr: "Araçlar", de: "Tools", es: "Herramientas", fr: "Outils", ar: "الأدوات" },
  "Contact": { tr: "İletişim", de: "Kontakt", es: "Contacto", fr: "Contact", ar: "اتصال" },
  "START": { tr: "BAŞLA", de: "START", es: "EMPEZAR", fr: "DÉMARRER", ar: "ابدأ" },
  "Credit Packages": { tr: "Kredi Paketleri", de: "Credit-Pakete", es: "Paquetes de créditos", fr: "Packs de crédits", ar: "باقات الأرصدة" },
  "What Crelavo covers": { tr: "Crelavo neleri kapsar", de: "Was Crelavo abdeckt", es: "Qué cubre Crelavo", fr: "Ce que couvre Crelavo", ar: "ما الذي يغطيه Crelavo" },
  "Production coverage": { tr: "Üretim kapsamı", de: "Produktionsumfang", es: "Cobertura de producción", fr: "Couverture de production", ar: "نطاق الإنتاج" }
};

const reverseLookup = new Map<string, string>();
for (const [source, translations] of Object.entries(pageTranslations)) {
  reverseLookup.set(source, source);
  Object.values(translations).forEach((translated) => reverseLookup.set(translated, source));
}

function translatePlainText(value: string, language: string) {
  if (language === defaultLanguage) return reverseLookup.get(value) ?? value;
  const source = reverseLookup.get(value) ?? value;
  return pageTranslations[source]?.[language] ?? value;
}

function translateTextNode(node: Text, language: string) {
  const current = node.nodeValue ?? "";
  const trimmed = current.trim();
  if (!trimmed) return;
  const translated = translatePlainText(trimmed, language);
  if (translated === trimmed) return;
  node.nodeValue = current.replace(trimmed, translated);
}

function shouldSkipElement(element: Element) {
  const tag = element.tagName.toLowerCase();
  if (["script", "style", "noscript", "svg", "path", "code", "pre"].includes(tag)) return true;
  return Boolean(element.closest("[data-no-translate]"));
}

function applyTranslations(language: string) {
  try {
    if (typeof document === "undefined" || !document.body || typeof NodeFilter === "undefined") return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    nodes.forEach((node) => {
      try {
        if (node.parentElement && !shouldSkipElement(node.parentElement)) translateTextNode(node, language);
      } catch {
        // Ignore a single stale text node during browser navigation/hydration.
      }
    });

    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[placeholder], textarea[placeholder]").forEach((element) => {
      if (shouldSkipElement(element)) return;
      const current = element.getAttribute("placeholder") ?? "";
      element.setAttribute("placeholder", translatePlainText(current, language));
    });
  } catch (error) {
    console.warn("Crelavo translation skipped", error);
  }
}

export function GlobalLanguageTranslator() {
  const pathname = usePathname();

  useEffect(() => {
    const language = getStoredLanguage();
    window.requestAnimationFrame(() => applyTranslations(language));

    function handleLanguageChange(event: Event) {
      const nextLanguage = (event as CustomEvent<string>).detail || getStoredLanguage();
      window.requestAnimationFrame(() => applyTranslations(nextLanguage));
    }

    window.addEventListener("clipora-language-change", handleLanguageChange);
    return () => window.removeEventListener("clipora-language-change", handleLanguageChange);
  }, [pathname]);

  return null;
}
