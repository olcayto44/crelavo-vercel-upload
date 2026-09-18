import { DubbingPanel } from "@/components/DubbingPanel";
import { DashboardToolLayout } from "@/components/DashboardToolLayout";

export default function DubbingPage() {
  return (
    <DashboardToolLayout id="dubbing">
      <span className="badge">Dubbing workspace</span>
      <h1>Dubbing and lip-sync workflow planning</h1>
      <p className="lead">Prepare source video, language pair, voice direction and delivery notes for production review.</p>
      <div className="btns"><a className="btn btn-out" href="/dashboard/create?type=AI%20Video&category=lip_sync">Start dubbing production</a></div>
      <DubbingPanel />
    </DashboardToolLayout>
  );
}
