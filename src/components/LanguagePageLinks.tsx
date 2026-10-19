import Link from "next/link";
import { localizedEuropePages } from "@/lib/localized-europe-pages";

// Share the same destinations across the desktop header and both mobile menus.
export function LanguagePageLinks() {
  return <>{localizedEuropePages.map(page => <Link href={page.path} hrefLang={page.hreflang} lang={page.hreflang} title={page.languageName} aria-label={page.languageName} key={page.path}>{page.locale === "zh" ? "ZH (中文)" : page.locale.toUpperCase()}</Link>)}</>;
}
