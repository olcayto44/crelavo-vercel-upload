import Link from "next/link";
import { studioSurfaces } from "@/lib/studio-surfaces";

export function StudioDiscovery({ privateWorkspace = false }: { privateWorkspace?: boolean }) {
 return <section className={privateWorkspace?"production-hero-card clean-feed-section":"production-hero-card clean-feed-section cr-studio-discovery"} style={{ marginTop: 24 }} aria-label="Crelavo Studio tools">
  <h2>Studio & editing tools</h2>
  <p>Plan a production or work directly with your own media.</p>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(220px,100%),1fr))", gap: 14, marginTop: 16 }}>
   {studioSurfaces.map(surface => <article className="card" key={surface.path} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <h3>{surface.title}</h3><p>{surface.description}</p>
    <Link className="btn" style={{marginTop:"auto"}} href={privateWorkspace ? surface.workspace : surface.path}>{privateWorkspace ? "Open workspace" : "Explore " + surface.title}</Link>
   </article>)}
  </div>
 </section>;
}
