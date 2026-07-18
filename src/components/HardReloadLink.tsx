"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

type HardReloadLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
};

export function HardReloadLink({ href, children, onClick, ...props }: HardReloadLinkProps) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank") return;
        event.preventDefault();
        window.location.assign(href);
      }}
    >
      {children}
    </a>
  );
}
