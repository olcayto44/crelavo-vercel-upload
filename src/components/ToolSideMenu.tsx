import Link from "next/link";
import { footerGroups } from "@/lib/site-content";

export function ToolSideMenu() {
  return (
    <aside className="tool-side-menu" aria-label="Crelavo product and tool menu">
      <div className="tool-side-menu-head">
        <span className="badge">Tool menu</span>
        <strong>Crelavo AI Tools</strong>
        <p>Production for video, music, voice, visuals, brand, documents and digital products.</p>
      </div>
      <nav className="tool-side-menu-groups">
        {footerGroups.slice(0, 4).map((group) => (
          <details key={group.title} open={group.title === "Products" || group.title === "Video Tools"}>
            <summary>{group.title}</summary>
            <div>
              {group.links.map((link) => <Link href={link.href} key={`${group.title}-${link.label}`}>{link.label}</Link>)}
            </div>
          </details>
        ))}
      </nav>
      <Link className="btn" href="/dashboard/assistant-workspace">Start production</Link>
      <Link className="btn secondary" href="/blog">Blog / Content</Link>
    </aside>
  );
}
