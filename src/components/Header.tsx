import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { HeaderCreditPill } from "@/components/HeaderCreditPill";
import { LocalizedNavLink } from "@/components/LocalizedNavLink";
import { UserInfoPill } from "@/components/UserInfoPill";
import { localizedEuropePages } from "@/lib/localized-europe-pages";
import { footerGroups } from "@/lib/site-content";
import { defaultPublicNavLinks, type PublicNavLink } from "@/lib/site-content-config";

type HeaderProps = {
  navLinks?: PublicNavLink[];
  languageOverride?: string;
};

const canonicalNavLabels: Record<string, string> = {
  ev: "Home",
  home: "Home",
  kategoriler: "Categories",
  categories: "Categories",
  aletler: "Tools",
  tools: "Tools",
  krediler: "Credits",
  credits: "Credits",
  asistan: "Assistant",
  assistant: "Assistant",
  baslangic: "Start",
  başlangıç: "Start",
  start: "Start",
  produksiyonlar: "Productions",
  prodüksiyonlar: "Productions",
  productions: "Productions",
  "kontrol paneli": "Dashboard",
  dashboard: "Dashboard",
  "odeme / iptal": "Billing / Cancel",
  "ödeme / iptal": "Billing / Cancel",
  "abonelik / iptal": "Billing / Cancel",
  "billing / cancel": "Billing / Cancel",
  "temas etmek": "Contact",
  contact: "Contact",
  "blog / icerik": "Blog / Content",
  "blog / içerik": "Blog / Content",
  "blog / content": "Blog / Content"
};

function normalizeNavLabel(label: string) {
  const key = label.trim().toLocaleLowerCase("tr-TR");
  return canonicalNavLabels[key] ?? label;
}

export function Header({ navLinks = defaultPublicNavLinks, languageOverride }: HeaderProps) {
  const activeNavLinks = navLinks
    .filter((item) => item.active)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({ ...item, label: normalizeNavLabel(item.label) }));
  return (
    <header className="container nav site-main-nav">
      <Link className="logo" href="/">
        <span className="logo-mark"><Clapperboard size={18} /></span>
        <span>Crelavo</span>
      </Link>
      <nav className="nav-links primary-nav-links">
        {activeNavLinks.map((item) => item.label === "Tools" ? (
          <div className="tools-mega-wrap" key={`${item.href}-${item.label}`}>
            <LocalizedNavLink className="tools-mega-trigger" href="/tools" label="Tools" languageOverride={languageOverride} />
            <div className="tools-mega-menu">
              {footerGroups.slice(0, 3).map((group) => (
                <div className="tools-mega-group" key={group.title}>
                  <strong>{group.title}</strong>
                  {group.links.slice(0, 4).map((link) => <Link href={link.href} key={`${group.title}-${link.label}`}>{link.label}</Link>)}
                </div>
              ))}
            </div>
          </div>
        ) : <LocalizedNavLink href={item.href} key={`${item.href}-${item.label}`} label={item.label} languageOverride={languageOverride} />)}
      </nav>
      <div className="nav-session-bar" aria-label="Account and credits">
        <div className="header-language-links" aria-label="Language pages">
          {localizedEuropePages.map((page) => <Link href={page.path} key={page.path}>{page.locale.toUpperCase()}</Link>)}
        </div>
        <HeaderCreditPill />
        <UserInfoPill />
      </div>
    </header>
  );
}
