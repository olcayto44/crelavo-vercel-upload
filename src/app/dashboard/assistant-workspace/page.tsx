import { HeyGenVideoAgentWorkspace } from "@/components/HeyGenVideoAgentWorkspace";
import { WorkAssistant } from "@/components/WorkAssistant";
import { WorkspaceErrorBoundary } from "@/components/WorkspaceErrorBoundary";

type AssistantWorkspaceSearchParams = {
  idea?: string | string[];
  category?: string | string[];
  legacy?: string | string[];
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AssistantWorkspacePage({ searchParams }: { searchParams?: Promise<AssistantWorkspaceSearchParams> }) {
  const params = await searchParams;
  const idea = firstParam(params?.idea).normalize("NFC");
  const category = firstParam(params?.category).normalize("NFC");
  const initialIdea = idea || category;
  const legacyMode = firstParam(params?.legacy) === "1";

  return (
    <main className="omni-work-route">
      <WorkspaceErrorBoundary fallback={
        <section className="omni-fallback">
          <h1>Assistant Workspace</h1>
          <p>The assistant UI could not load in this browser session. Please refresh and try again.</p>
          <a className="btn" href="/dashboard/create">Start production</a>
        </section>
      }>
        {legacyMode ? <WorkAssistant initialIdea={initialIdea} initialCategory={category} /> : <HeyGenVideoAgentWorkspace initialIdea={initialIdea} />}
      </WorkspaceErrorBoundary>
    </main>
  );
}
