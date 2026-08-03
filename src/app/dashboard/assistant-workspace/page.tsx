import { WorkAssistant } from "@/components/WorkAssistant";
import { WorkspaceErrorBoundary } from "@/components/WorkspaceErrorBoundary";

type AssistantWorkspaceSearchParams = {
  idea?: string | string[];
  category?: string | string[];
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AssistantWorkspacePage({ searchParams }: { searchParams?: Promise<AssistantWorkspaceSearchParams> }) {
  const params = await searchParams;
  const idea = firstParam(params?.idea).normalize("NFC");
  const category = firstParam(params?.category).normalize("NFC");
  const initialIdea = idea || category;

  return (
    <main className="omni-work-route">
      <section style={{ margin: "0 auto 16px", maxWidth: 1180, border: "2px solid #7c3aed", borderRadius: 16, padding: "12px 16px", background: "linear-gradient(135deg, rgba(124,58,237,.16), rgba(236,72,153,.10))", color: "#fff" }}>
        <strong>HEYGEN BRIDGE LIVE</strong>
        <span style={{ marginLeft: 10 }}>assistant-workspace route marker · Video Agent native artifacts aktif</span>
      </section>
      <WorkspaceErrorBoundary fallback={
        <section className="omni-fallback">
          <h1>Assistant Workspace</h1>
          <p>The assistant UI could not load in this browser session. Please refresh and try again.</p>
          <a className="btn" href="/dashboard/create">Start production</a>
        </section>
      }>
        <WorkAssistant initialIdea={initialIdea} initialCategory={category} />
      </WorkspaceErrorBoundary>
    </main>
  );
}
