import { AdminAssistantConversationsViewer } from "@/components/AdminAssistantConversationsViewer";
import { AdminShell } from "@/components/AdminShell";

export default function AdminAssistantPage() {
  return (
    <AdminShell
      title="Assistant Conversations"
      description="Review user conversations with Crelavo's assistant, inspect context handoff and identify where customers need support."
    >
      <section className="card admin-wide-card">
        <span className="badge">Assistant operations</span>
        <h2>Conversation history viewer</h2>
        <p style={{ color: "var(--muted)" }}>Load recent assistant conversations, open a thread and review user/assistant messages for support, routing and production handoff quality.</p>
        <AdminAssistantConversationsViewer />
      </section>
    </AdminShell>
  );
}
