import { AssistantWorkspace } from "@/components/AssistantWorkspace";
import { HardReloadLink } from "@/components/HardReloadLink";
import { UserInfoPill } from "@/components/UserInfoPill";
import { WorkspaceErrorBoundary } from "@/components/WorkspaceErrorBoundary";

type AssistantWorkspaceSearchParams = {
  idea?: string | string[];
  category?: string | string[];
  mode?: string | string[];
  providerTest?: string | string[];
  source?: string | string[];
  tool?: string | string[];
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AssistantWorkspacePage({ searchParams }: { searchParams?: Promise<AssistantWorkspaceSearchParams> }) {
  const params = await searchParams;
  const idea = firstParam(params?.idea).normalize("NFC");
  const category = firstParam(params?.category).normalize("NFC");
  const mode = firstParam(params?.mode).normalize("NFC");
  const source = firstParam(params?.source).normalize("NFC");
  const tool = firstParam(params?.tool).normalize("NFC");
  const initialIdea = idea || category;
  const providerTestValue = firstParam(params?.providerTest);
  const providerTest = providerTestValue === "1" || providerTestValue === "true";
  const fromFreeTool = source === "free-tool";

  return (
    <main className="container section assistant-full-page assistant-production-page">
      <div className="assistant-workspace-topbar">
        <div className="assistant-brand-row">
          <HardReloadLink className="logo" href="/"><span className="logo-mark">▶</span><span>Crelavo</span></HardReloadLink>
          <UserInfoPill />
        </div>
        <nav className="assistant-top-nav button-nav">
          <HardReloadLink className="btn secondary" href="/">Home</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/categories">Categories</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard/credits">Credits</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard/assistant-workspace">Assistant</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard/create">Start</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard/productions">Productions</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/dashboard">Dashboard</HardReloadLink>
          <HardReloadLink className="btn secondary" href="/blog">Blog / Content</HardReloadLink>
        </nav>
      </div>

      {fromFreeTool ? (
        <section className="card admin-wide-card" style={{ marginBottom: 18 }}>
          <span className="badge">Free tool result imported</span>
          <h2>Ready to turn this result into a production request</h2>
          <p style={{ color: "var(--muted)" }}>Your selected {tool ? tool.replace(/-/g, " ") : "free tool"} result is already loaded below. Review the prompt, adjust delivery options and start a production package when ready.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <HardReloadLink className="btn secondary" href="/free-tools">Back to free tools</HardReloadLink>
            <HardReloadLink className="btn secondary" href="/dashboard/credits">Check credits</HardReloadLink>
          </div>
        </section>
      ) : null}

      <WorkspaceErrorBoundary fallback={
        <section className="assistant-live-stage">
          <div className="assistant-stage-head">
            <span className="badge">Assistant recovery mode</span>
            <h1>Assistant Workspace</h1>
            <p>The full assistant UI could not load in this browser session, but you can still start from the main production paths below.</p>
          </div>
          <div className="grid">
            <div className="card">
              <h2>Start production</h2>
              <p>Open the Production Studio first, then continue into the Assistant Workspace with options and credit estimate visible.</p>
              <HardReloadLink className="btn" href="/dashboard/create">Start production</HardReloadLink>
            </div>
            <div className="card">
              <h2>Open categories</h2>
              <p>Choose a public category first, then return to the production workspace when ready.</p>
              <HardReloadLink className="btn secondary" href="/categories">Open category catalog</HardReloadLink>
            </div>
            <div className="card">
              <h2>Credit packages</h2>
              <p>Review credit packages before starting production.</p>
              <HardReloadLink className="btn secondary" href="/dashboard/credits">Credit Packages</HardReloadLink>
            </div>
          </div>
        </section>
      }>
        <AssistantWorkspace initialIdea={initialIdea} initialCategory={category} initialMode={mode} providerTestPreset={providerTest} />
      </WorkspaceErrorBoundary>
    </main>
  );
}
