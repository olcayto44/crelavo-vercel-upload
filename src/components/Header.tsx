import Link from "next/link";
import { SiteBrandLogo } from "@/components/SiteBrandLogo";
import { HeaderCreditPill } from "@/components/HeaderCreditPill";
import {PublicMegaMenu} from "@/components/PublicMegaMenu";
import { LocalizedNavLink } from "@/components/LocalizedNavLink";
import { AuthHeaderControls } from "@/components/auth/AuthHeaderControls";
import { LanguagePageLinks } from "@/components/LanguagePageLinks";
import { footerGroups } from "@/lib/site-content";
import { defaultPublicNavLinks, type PublicNavLink } from "@/lib/site-content-config";

type HeaderProps = {
  navLinks?: PublicNavLink[];
  languageOverride?: string;
  premium?: boolean;
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

const createGroups = [
  { title: "Build", links: [{ label: "Website Builder", href: "/ai-website-builder" }, { label: "SaaS & App Builder", href: "/ai-app-builder" }, { label: "E-commerce Builder", href: "/ai-ecommerce-builder" }] },
  { title: "Create Media", links: [{ label: "AI Video", href: "/ai-video-generator" }, { label: "Product Ad Video", href: "/ai-product-video-generator" }, { label: "AI Image", href: "/products/image" }] },
  { title: "Grow", links: [{ label: "Brand Kit", href: "/ai-brand-kit-builder" }, { label: "Ad Performance", href: "/ai-ad-performance-score-checker" }, { label: "Growth Intelligence", href: "/growth-intelligence" }, { label: "Live Sales", href: "/live-sales-credits" }, { label: "Drone", href: "/drone-credits" }] }
];

export function Header({ navLinks = defaultPublicNavLinks, languageOverride, premium = true }: HeaderProps) {
  const activeNavLinks = navLinks
    .filter((item) => item.active)
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      const label = normalizeNavLabel(item.label);
      if (label === "Assistant") return { ...item, label, href: "/dashboard/studio" };
      if (label === "Dashboard") return { ...item, label, href: "/dashboard" };
      if (label === "Credits") return { ...item, label: "Pricing", href: "/pricing" };
      if (label === "Live Sales Plans") return { ...item, label: "Live Sales Avatar", href: "/live-sales-credits" };
      if (label === "Drone Plans") return { ...item, label: "Drone Packages", href: "/drone-credits" };
      return { ...item, label };
    })
    .filter((item, index, items) => ["Tools", "Pricing", "Assistant", "Dashboard"].includes(item.label) && items.findIndex((candidate) => candidate.label === item.label) === index);
  return (
    <header className={"container nav site-main-nav"+(premium?" cr-premium-nav":"")}>
      <Link className="logo" href="/">
        <SiteBrandLogo />
      </Link>
      <nav className="cr-primary-nav" aria-label="Primary navigation">
        <PublicMegaMenu id="create" label="Create" href="/categories" groups={[...createGroups,{title:"Studio & editors",links:[{label:"Crelavo Studio",href:"/studio"},{label:"Video Editor",href:"/tools/video-editor"},{label:"Image Editor",href:"/tools/image-editor"},{label:"Media Library",href:"/tools/media-library"},{label:"My projects",href:"/dashboard/productions"}]}]}/>
        <PublicMegaMenu id="models" label="AI Models" href="/models" groups={[{title:"Video models",links:[{label:"MAGI-2",href:"/models/magi-2"}]},{title:"Explore",links:[{label:"All AI models",href:"/models"}]}]}/>
        {activeNavLinks.map(item=>item.label==="Tools"?<PublicMegaMenu key="tools" id="tools" label="Tools" href="/tools" groups={[{title:"Studio tools",links:[{label:"Crelavo Studio",href:"/studio"},{label:"Video Editor",href:"/tools/video-editor"},{label:"Image Editor",href:"/tools/image-editor"},{label:"Media Library",href:"/tools/media-library"}]},...footerGroups.slice(0,3).map(g=>({title:g.title,links:g.links.slice(0,4)}))]}/>:<LocalizedNavLink href={item.href} key={item.href+"-"+item.label} label={item.label} languageOverride={languageOverride}/>)}
      </nav>
      <div className="nav-session-bar" aria-label="Account and credits">
        <div className="header-language-links" aria-label="Language pages">
          <LanguagePageLinks dropdown />
        </div>
        <HeaderCreditPill />
        <AuthHeaderControls premium={premium} />
      </div>
    </header>
  );
}
