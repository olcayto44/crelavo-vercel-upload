"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const yandexMetricaId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID?.trim();
const disabledPathPrefixes = ["/admin", "/api", "/dashboard", "/auth"];

export function YandexMetrica() {
  const pathname = usePathname() || "/";

  if (!yandexMetricaId || disabledPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        a[href*="metrika.yandex"],
        a[href*="metrica.yandex"],
        a[href*="yandex.com.tr/metrika"],
        a[href*="yandex.com/metrica"],
        img[src*="mc.yandex.ru/informer"],
        img[src*="yastatic.net/s3/metrika"],
        .ym-informer,
        .ym-informer-container,
        .yandex-metrica-informer {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          left: -9999px !important;
        }
      `}</style>
      <Script id="yandex-metrica-hide-visible-counter" strategy="afterInteractive">
        {`
          (function(){
            function hideYandexVisibleCounter(){
              var selectors = [
                'a[href*="metrika.yandex"]',
                'a[href*="metrica.yandex"]',
                'a[href*="yandex.com.tr/metrika"]',
                'a[href*="yandex.com/metrica"]',
                'img[src*="mc.yandex.ru/informer"]',
                'img[src*="yastatic.net/s3/metrika"]',
                '.ym-informer',
                '.ym-informer-container',
                '.yandex-metrica-informer'
              ];
              selectors.forEach(function(selector){
                document.querySelectorAll(selector).forEach(function(node){
                  node.style.setProperty('display', 'none', 'important');
                  node.style.setProperty('visibility', 'hidden', 'important');
                  node.style.setProperty('opacity', '0', 'important');
                  node.style.setProperty('pointer-events', 'none', 'important');
                  node.style.setProperty('width', '0', 'important');
                  node.style.setProperty('height', '0', 'important');
                  node.style.setProperty('position', 'absolute', 'important');
                  node.style.setProperty('left', '-9999px', 'important');
                });
              });
            }
            hideYandexVisibleCounter();
            setTimeout(hideYandexVisibleCounter, 500);
            setTimeout(hideYandexVisibleCounter, 1500);
            setTimeout(hideYandexVisibleCounter, 3000);
          })();
        `}
      </Script>
      <Script id="yandex-metrica" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=${yandexMetricaId}', 'ym');

          ym(${JSON.stringify(yandexMetricaId)}, 'init', {
            ssr: true,
            webvisor: true,
            clickmap: true,
            ecommerce: 'dataLayer',
            referrer: document.referrer,
            url: location.href,
            accurateTrackBounce: true,
            trackLinks: true
          });
        `}
      </Script>
      <noscript>
        <div>
          {/* Invisible counter: no visible badge or logo is rendered. */}
          <img src={`https://mc.yandex.ru/watch/${yandexMetricaId}`} style={{ position: "absolute", left: "-9999px" }} alt="" />
        </div>
      </noscript>
    </>
  );
}
