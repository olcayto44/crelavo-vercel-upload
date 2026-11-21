import type { Metadata } from "next";
import type { ReactNode } from "react";
export const metadata: Metadata = {title:"Crelavo AI Studio",robots:{index:false,follow:false}};
export default function StudioLayout({children}:{children:ReactNode}) {
  // AuthProvider and RequireFreeAccount remain inherited; no legacy assistant is mounted here.
  return <main className="cv2-layout" aria-label="Crelavo AI Studio">{children}</main>;
}
