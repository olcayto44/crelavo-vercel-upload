"use client";

import Link from "next/link";
import { Bot, CircleDollarSign, Contact, Cpu, Drone, Gift, Home, LayoutGrid, Newspaper, RadioTower, Rocket, Sparkles, WandSparkles, Wrench } from "lucide-react";
import { usePathname } from "next/navigation";

const publicRailItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Categories", href: "/categories", icon: LayoutGrid },
  { label: "Tools", href: "/tools", icon: Wrench },
  { label: "Feature Paths", href: "/tools#feature-paths", icon: WandSparkles },
  { label: "Free Tools", href: "/free-tools", icon: Gift },
  { label: "Pricing / Credits", href: "/pricing", icon: CircleDollarSign },
  { label: "Start production", href: "/dashboard/create", icon: Sparkles },
  { label: "Growth Intelligence", href: "/growth-intelligence", icon: Rocket },
  { label: "Live Sales Plans", href: "/live-sales-credits", icon: RadioTower },
  { label: "Drone Plans", href: "/drone-credits", icon: Drone },
  { label: "Affiliate", href: "/affiliate", icon: Bot },
  { label: "Blog / Content", href: "/blog", icon: Newspaper },
  { label: "Contact", href: "/contact", icon: Contact },
  { label: "AI Ecosystem", href: "/ai-video-generator", icon: Cpu }
];

function shouldHideRail(pathname: string | null) {
  if (!pathname) return true;
  return Boolean(
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/productions") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/wp-admin")
  );
}

export function PublicSideRail() {
  const pathname = usePathname();
  if (shouldHideRail(pathname)) return null;

  return (
    <nav className="public-side-rail" aria-label="Crelavo quick navigation">
      {publicRailItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
        return (
          <Link className={`public-side-rail-link ${active ? "active" : ""}`} href={item.href} key={item.href} aria-label={item.label}>
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
