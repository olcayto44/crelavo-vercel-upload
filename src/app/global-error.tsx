"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Crelavo global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="container section" style={{ minHeight: "70vh" }}>
          <div className="card">
            <span className="badge">Page recovery</span>
            <h1>This page needs to reload</h1>
            <p>The browser hit a client-side loading error. Use reload to try again, or open the page with a full refresh.</p>
            <p style={{ color: "var(--muted)" }}>{error?.message ? `Error: ${error.message}` : "No extra error message was provided by the browser."}</p>
            <div className="url-action-center">
              <button className="btn" type="button" onClick={() => reset()}>Reload page</button>
              <a className="btn secondary" href="/">Back to home</a>
              <a className="btn secondary" href="/dashboard/assistant-workspace">Open Assistant Workspace</a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
