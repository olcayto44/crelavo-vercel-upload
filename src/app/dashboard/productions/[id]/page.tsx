import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { ProductionWorkspace } from "@/components/ProductionWorkspace";
import { supabaseAdmin } from "@/lib/supabase";

export default async function ProductionWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let production = null;
  let errorMessage = "";

  try {
    const { data, error } = await supabaseAdmin()
      .from("production_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    production = data;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Production record could not be read.";
  }

  return (
    <DashboardShell>
      {!production ? (
        <div className="card">
          <span className="badge">Production workspace</span>
          <h2>Production not found</h2>
          <p style={{ color: "var(--muted)" }}>{errorMessage || "This production record could not be found or is not accessible yet."}</p>
          <Link className="btn" href="/dashboard/productions">Back to my productions</Link>
        </div>
      ) : (
        <ProductionWorkspace production={production} />
      )}
    </DashboardShell>
  );
}
