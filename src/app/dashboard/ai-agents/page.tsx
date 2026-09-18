import { AiAgentsContentStudio } from "@/components/AiAgentsContentStudio";
import { DashboardToolLayout } from "@/components/DashboardToolLayout";

export default function AiAgentsPage() {
  return (
    <DashboardToolLayout id="ai-agents">
      <span className="badge">AI agents</span>
      <h1>Build a review-ready social content package</h1>
      <p className="lead">Generate platform posts, captions, hooks, calls to action and a content calendar without automatic publishing.</p>
      <div className="btns"><a className="btn btn-out" href="/dashboard/create?type=AI%20Video&category=ai_agent">Plan an AI agent production</a></div>
      <AiAgentsContentStudio />
    </DashboardToolLayout>
  );
}
