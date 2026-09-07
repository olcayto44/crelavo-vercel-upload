"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

const conversionId = "AW-18425668664";
const conversionLabel = "X2QhCJeArfAcELjIhdJE";

export function GoogleAdsTag() {
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${conversionId}`} />
      <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config','${conversionId}');` }} />
    </>
  );
}

type TrialCtaLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

export function TrialCtaLink({ href, children, onClick, ...props }: TrialCtaLinkProps) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank") return;
        event.preventDefault();
        const go = () => window.location.assign(href);
        if (typeof window.gtag !== "function") {
          go();
          return;
        }
        let navigated = false;
        const navigateOnce = () => {
          if (navigated) return;
          navigated = true;
          go();
        };
        window.gtag("event", "conversion", { send_to: `${conversionId}/${conversionLabel}`, event_callback: navigateOnce });
        window.setTimeout(navigateOnce, 700);
      }}
    >
      {children}
    </a>
  );
}
