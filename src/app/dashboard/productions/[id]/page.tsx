import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { ProductionWorkspace } from "@/components/ProductionWorkspace";
import { extractProductionId, productionWorkspacePath } from "@/lib/production-url";
import { supabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Production workspace | Crelavo",
  robots: { index: false, follow: false }
};

export default async function ProductionWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productionId = extractProductionId(id);
  let production = null;
  let errorMessage = "";

  try {
    const { data, error } = await supabaseAdmin()
      .from("production_requests")
      .select("*")
      .eq("id", productionId)
      .maybeSingle();

    if (error) throw error;
    production = data;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Production record could not be read.";
  }

  return (
    <DashboardShell className="dashboard-postlaunch-shell production-detail-shell">
      {!production ? (
        <div className="card">
          <span className="badge">Production workspace</span>
          <h2>Production not found</h2>
          <p style={{ color: "var(--muted)" }}>{errorMessage || "This production record could not be found or is not accessible yet."}</p>
          <Link className="btn" href="/dashboard/productions">Back to my productions</Link>
        </div>
      ) : (
        <>
          {id === productionId ? (
            <div className="production-canonical-url-card">
              <span className="badge">Cleaner workspace URL</span>
              <p>This production also has a readable workspace link for sharing inside the dashboard.</p>
              <Link className="btn secondary" href={productionWorkspacePath(production)}>Open clean URL</Link>
            </div>
          ) : null}
          <ProductionWorkspace production={production} />
        </>
      )}
    </DashboardShell>
  );
}
