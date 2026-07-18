import { DashboardShell } from "@/components/DashboardShell";
import { RequestsTable } from "@/components/RequestsTable";

export default function MyVideosPage() {
  return (
    <DashboardShell>
      <div className="card">
        <h2>My videos</h2>
        <p style={{ color: "var(--muted)" }}>Teslim edilen videolar, indirme linkleri, caption ve hashtagler burada gorunecek.</p>
        <RequestsTable />
      </div>
    </DashboardShell>
  );
}
