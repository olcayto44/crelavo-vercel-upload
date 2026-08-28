import type { Metadata } from "next";
import { WorkAssistant } from "@/components/WorkAssistant";
import { WorkspaceErrorBoundary } from "@/components/WorkspaceErrorBoundary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Video Agent — Crelavo",
  description: "Create a MiniMax Video Agent production with automatic visual planning and editing.",
  alternates: { canonical: "/ai-video-agent" }
};

export default function VideoAgentPage() {
  return (
    <main className="omni-work-route">
      <WorkspaceErrorBoundary fallback={<section className="omni-fallback"><h1>Video Agent</h1><p>The Video Agent workspace could not load. Please refresh and try again.</p><a className="btn" href="/ai-video-agent">Refresh workspace</a></section>}>
        <WorkAssistant initialIdea="Video Agent" initialCategory="video_agent" />
      </WorkspaceErrorBoundary>
    </main>
  );
}
