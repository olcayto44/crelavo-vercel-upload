import type { CreamStatus } from "../../lib/cream-status";
import { STATUS_COPY } from "../../lib/cream-status";

export function StatusBanner({
  status = "not_connected",
  message,
}: {
  status?: CreamStatus;
  message?: string;
}) {
  const copy = STATUS_COPY[status];
  return (
    <aside className={`cl-status cl-status-${status}`} data-cream-status={status} role="status">
      <p className="cl-status-kicker">{copy.kicker}</p>
      <strong>{copy.title}</strong>
      <p>{message || copy.body}</p>
    </aside>
  );
}

export function FormStatusBar({ status }: { status: CreamStatus }) {
  return <StatusBanner status={status} />;
}

export function ShellNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="cl-shell-notice">
      {children}
    </p>
  );
}
