import { SiteFooter } from "@/components/SiteFooter";

type FooterLocale = "de" | "fr" | "tr";

export function LocalizedSiteFooter({ locale }: { locale: FooterLocale }) {
  void locale;
  return <SiteFooter />;
}
