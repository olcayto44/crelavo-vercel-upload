"use client";

import { useMemo, useState } from "react";

const launchSecurityChecks = [
  "Admin, dashboard, auth and API routes stay noindex/nofollow and are excluded from sitemap.",
  "Real .env.local values, payment provider keys, webhook secrets, Supabase service role and provider keys are never exported in backup manifests.",
  "Whop or active payment provider receipts/invoices are verified before manual credit activation.",
  "Backup manifest includes source/config examples only; database and storage exports are downloaded from Supabase/R2 dashboards.",
  "Restore plan includes npm install, secure env setup, Supabase restore, smoke tests, build, domain, active payment provider and Resend DNS reconnection."
];

const launchBackupSequence = [
  { label: "Before final keys", action: "Download manifest/restore plan and keep .env.example only; do not export .env.local." },
  { label: "After payment checkout links", action: "Record which packages have Whop or active payment provider checkout URLs/plan IDs in admin config; keep provider dashboards as billing source." },
  { label: "After provider keys", action: "Create a private encrypted backup of deployment env values outside the repo/chat." },
  { label: "Before public launch", action: "Run security/privacy smoke, final API checklist smoke and production build." }
];

const backupModules = [
  { title: "Full code backup", type: "full_site", note: "src, public, package.json, next config, tsconfig and all project code files.", status: "Ready plan" },
  { title: "Database schema backup", type: "database_schema", note: "Supabase schema, migration SQL files and table structures.", status: "Planned" },
  { title: "Safe env example backup", type: "env_example", note: ".env.example is archived safely; real secret values are not included in plain text.", status: "Safe" },
  { title: "Media and delivery files", type: "media_delivery", note: "Uploaded image/video/ZIP/README delivery files archive area.", status: "Planned" },
  { title: "Restore plan", type: "restore_plan", note: "README and restore steps for rebuilding the project in a new environment.", status: "Ready" },
  { title: "Version history", type: "version_history", note: "Dated snapshot logic after every critical change.", status: "Planned" }
];

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminBackupManager() {
  const [backupName, setBackupName] = useState(`crelavo-full-backup-${new Date().toISOString().slice(0, 10)}`);
  const [backupType, setBackupType] = useState("full_site");
  const [backupNote, setBackupNote] = useState("Manual admin backup checkpoint before launch.");
  const [message, setMessage] = useState("Select a backup module or download the restore plan.");

  const manifest = useMemo(() => `# ${backupName}\n\n## Backup type\n${backupType}\n\n## Note\n${backupNote}\n\n## Included plan\n- Source code folders: src, public, scripts, docs\n- Config examples: package.json, next.config.mjs, tsconfig.json, .env.example\n- Security rule: real .env secrets are never exported in plain text\n- Payment rule: Whop or active payment provider receipts/invoices stay in the provider dashboard; Crelavo stores only receipt/invoice references in credit event notes\n- Database: Supabase schema/export should be downloaded from Supabase dashboard\n- Media: storage buckets should be archived from Supabase Storage\n\n## Restore checklist\n1. Install dependencies with npm install.\n2. Copy .env.example to .env.local and fill real keys securely.\n3. Restore Supabase schema and storage buckets.\n4. Run smoke checks and npm run build.\n5. Reconnect domain, active payment provider webhook/admin reconciliation and Resend DNS.\n`, [backupName, backupType, backupNote]);

  function openModule(moduleType: string) {
    const module = backupModules.find((item) => item.type === moduleType);
    setBackupType(moduleType);
    setBackupNote(module?.note ?? backupNote);
    setMessage(`${module?.title ?? "Backup module"} selected.`);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="production-hero-card admin-overview-hero">
        <span className="badge">Disaster recovery</span>
        <h2>Full backup controls</h2>
        <p>Use this page to prepare backup manifests, restore notes and safe archive instructions. Real secret env values are intentionally excluded.</p>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Launch security checklist</span>
        <h2>What must stay private before launch</h2>
        <div className="admin-info-grid">
          {launchSecurityChecks.map((check) => (
            <div key={check}>
              <span>Check</span>
              <strong>{check}</strong>
              <small>Review before public launch and after final API/env setup.</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card">
        <span className="badge">Backup sequence</span>
        <h2>When to create each backup</h2>
        <div className="admin-info-grid">
          {launchBackupSequence.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.action}</strong>
              <small>Keep secrets outside repo, chat and public files.</small>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-category-grid">
        {backupModules.map((item) => (
          <button className="card admin-category-card admin-select-card" key={item.title} type="button" onClick={() => openModule(item.type)}>
            <span className="badge">{item.status}</span>
            <h2>{item.title}</h2>
            <p>{item.note}</p>
            <span className="btn">Open backup module</span>
          </button>
        ))}
      </section>

      <section className="card selected-billing-card">
        <span className="badge">Backup actions</span>
        <h2>Create backup manifest and restore plan</h2>
        <p style={{ color: "var(--muted)" }}>{message}</p>
        <div className="admin-production-editor">
          <div className="field"><label>Backup name</label><input value={backupName} onChange={(event) => setBackupName(event.target.value)} /></div>
          <div className="field"><label>Backup type</label><select value={backupType} onChange={(event) => setBackupType(event.target.value)}>{backupModules.map((item) => <option value={item.type} key={item.type}>{item.title}</option>)}</select></div>
          <div className="field admin-notes-field"><label>Backup note</label><textarea value={backupNote} onChange={(event) => setBackupNote(event.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={() => downloadText(`${backupName}-manifest.md`, manifest)}>Download backup manifest</button>
          <button className="btn secondary" type="button" onClick={() => downloadText(`${backupName}-restore-plan.md`, manifest)}>Download restore plan</button>
        </div>
      </section>
    </div>
  );
}
