import { HardReloadLink } from "@/components/HardReloadLink";

// Dashboard navigation keeps user production, tools and account paths in one place.
const navGroups = [
  {
    title: "Production",
    href: "/dashboard",
    description: "Assistant, production and delivery tracking",
    items: [
      ["Overview Dashboard", "/dashboard"],
      ["AI Assistant Workspace", "/dashboard/assistant-workspace"],
      ["Start Live Production", "/dashboard/create"],
      ["Growth Intelligence", "/dashboard/growth-intelligence"],
      ["Live Sales Control", "/dashboard/live-sales-agent"],
      ["Drone Shoot Panel", "/dashboard/drone-shoot"],
      ["My Productions", "/dashboard/productions"],
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
        <HardReloadLink className="logo" href="/dashboard"><span className="logo-mark">▶</span><span>Crelavo</span></HardReloadLink>
        <p>AI production planning, dashboard delivery, credits and post-launch growth tools.</p>
        <HardReloadLink className="dashboard-primary-action" href="/dashboard/assistant-workspace">Start new production</HardReloadLink>
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
        <nav className="dashboard-topbar button-nav" aria-label="Dashboard quick navigation">
          <HardReloadLink className="btn secondary" href="/">Home</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/categories">Categories</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard/credits">Credits</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard/live-sales-agent">Live Control</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard/drone-shoot">Drone Shoot</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard/assistant-workspace">Assistant</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard/growth-intelligence">Growth Intelligence</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard/productions">Productions</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard/growth">Growth</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard/partners">Partners</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard">Dashboard</HardReloadLink>
          <HardReloadLink className="btn" href="/dashboard/billing">Billing</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/blog">Blog / Content</HardReloadLink>
        </nav>
        {children}
      </section>
    </main>
  );
}
