import Link from "next/link";
import { apiServiceGroups } from "@/lib/api-services";

export function ToolSideMenu() {
  return (
    <aside className="tool-side-menu" aria-label="Crelavo API services menu">
      <div className="tool-side-menu-head">
        <span className="badge">API services</span>
        <strong>Crelavo integrations</strong>
        <p>Open the active provider map, quality levels and usage notes for each service.</p>
      </div>
      <nav className="tool-side-menu-groups">
        {apiServiceGroups.map((group) => (
          <details key={group.title} open>
            <summary>{group.title}</summary>
            <div>
              {group.services.map((service) => (
                <Link href={`/api-documentation#api-${service.slug}`} key={`${group.title}-${service.slug}`}>
                  {service.name}
                </Link>
              ))}
            </div>
          </details>
        ))}
      </nav>
      <Link className="btn" href="/api-documentation">Open API docs</Link>
      <Link className="btn secondary" href="/dashboard/assistant-workspace">Start production</Link>
    </aside>
  );
}
