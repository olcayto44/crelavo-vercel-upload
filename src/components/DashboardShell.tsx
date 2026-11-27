import {CustomerNav} from "@/components/CustomerDashboard";
import { HardReloadLink } from "@/components/HardReloadLink";
import { SiteBrandLogo } from "@/components/SiteBrandLogo";

// Dashboard navigation keeps user production, tools and account paths in one place.
const navGroups = [
  {
      title: "Work",
    href: "/dashboard/studio",
    description: "Assistant-led planning, production and delivery",
    items: [
      ["Work Home", "/dashboard/studio"],
      ["Overview Dashboard", "/dashboard"],
      ["Start Live Production", "/dashboard/studio"],
      ["Growth Intelligence", "/dashboard/growth-intelligence"],
      ["Live Sales Control", "/dashboard/live-sales-agent"],
      ["Drone Shoot Panel", "/dashboard/drone-shoot"],
      ["My projects", "/dashboard/productions"],
      ["Growth Rewards", "/dashboard/growth"],
      ["Share-to-Earn", "/dashboard/share-to-earn"],
      ["Partner Program", "/dashboard/partners"]
    ]
  },
  {
    title: "Tools",
    href: "/tools",
    description: "Post-launch tools and export planning",
    items: [
      ["Bulk Production", "/dashboard/bulk"],
      ["AI Dubbing", "/dashboard/dubbing"],
      ["Social Export Pack", "/dashboard/social-export"],
      ["TikTok / Shorts Growth", "/dashboard/shorts-growth"],
      ["Ad Management & ROAS", "/dashboard/ads"],
      ["AI Social Agents", "/dashboard/ai-agents"],
       ["Custom Agents", "/dashboard/custom-agents"],
      ["Premium Expansion", "/dashboard/premium-expansion"],
      ["Connect Accounts & Store", "/dashboard/connections"],
      ["Brand Kit", "/dashboard/brand-kit"]
    ]
  },
  {
    title: "Account",
    href: "/dashboard/credits",
    description: "Credits, subscription and settings",
    items: [
      ["Subscription & Credits", "/dashboard/credits"],
      ["Billing", "/dashboard/billing"],
      ["Contact", "/dashboard/contact"],
      ["Settings", "/dashboard/settings"]
    ]
  }
];

export function DashboardShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const shellClassName = ["container section dashboard-shell-layout", className].filter(Boolean).join(" ");

  return (
    <main className={shellClassName}>
      <aside className="dashboard-sidebar-card">
        <HardReloadLink className="logo" href="/dashboard"><SiteBrandLogo /></HardReloadLink>
        <p>AI production planning, dashboard delivery, credits and post-launch growth tools.</p>
        <HardReloadLink className="dashboard-primary-action" href="/categories">Create</HardReloadLink>
        <nav className="dashboard-nav-groups" aria-label="Dashboard menu">
          {navGroups.map((group) => (
            <section className="dashboard-nav-group" key={group.title}>
              <HardReloadLink className="dashboard-nav-group-head" href={group.href}>
                <strong>{group.title}</strong>
                <small>{group.description}</small>
              </HardReloadLink>
              <div className="dashboard-nav-group-links">
                {group.items.map(([label, href]) => <HardReloadLink className="dashboard-nav-link" key={`${group.title}-${href}-${label}`} href={href}>{label}</HardReloadLink>)}
              </div>
            </section>
          ))}
        </nav>
        <HardReloadLink className="dashboard-home-link" href="/">Back to main site</HardReloadLink>
      </aside>
      <section className="dashboard-workspace">
        <CustomerNav/>
        {children}
      </section>
    </main>
  );
}
