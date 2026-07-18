import { AdminShell } from "@/components/AdminShell";

export default function AdminDubbingPage() {
  return (
    <AdminShell title="AI Dubbing / Lip-Sync Backlog" description="Phase-2 planning for future HeyGen, ElevenLabs or voice/video translation jobs. Real provider execution requires final voice/video API setup.">
      <div className="grid">
        <div className="card">
          <span className="badge">Future providers</span>
          <h3>HeyGen / ElevenLabs planning</h3>
          <p>The future lip_sync_jobs table can track provider job id, target language, source video and output URL after final provider API setup.</p>
        </div>
        <div className="card">
          <span className="badge">Quality planning</span>
          <h3>Face clarity warning</h3>
          <p>Dark videos or unclear faces can reduce lip-sync quality; upload warnings should be shown before this feature becomes live.</p>
        </div>
        <div className="card">
          <span className="badge">Credit policy</span>
          <h3>Premium operation</h3>
          <p>Lip-sync is a high-cost API feature and should remain tied to extra credits or higher packages before launch.</p>
        </div>
      </div>
    </AdminShell>
  );
}
