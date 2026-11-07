import { createPublicKey, verify } from "node:crypto";
const repository = "olcayto44/crelavo-acceptance-worker";
const workflow = repository + "/.github/workflows/project-acceptance.yml@refs/heads/main";
let keys: { expires: number; values: any[] } | undefined;
export function actionsPreviewOrigin() {
  if (process.env.VERCEL_ENV !== "preview" || process.env.WEBSITE_RUNTIME_ENABLED !== "1") throw new Error("runtime_actions_preview_only");
  const host = process.env.VERCEL_URL;
  if (!host || !/^[a-z0-9-]+\.vercel\.app$/.test(host)) throw new Error("runtime_actions_preview_origin_missing");
  // Bind this branch to its stable alias; other branches retain deployment isolation.
  if (process.env.VERCEL_GIT_COMMIT_REF === "feature/website-production-manager") return "https://crelavo-git-feature-website-production-manager-olcaytoo44.vercel.app";
  return "https://" + host;
}
export async function verifyActionsIdentity(token: string, audience: string) {
  if (token.length > 20000) throw new Error("actions_identity_invalid");
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) throw new Error("actions_identity_invalid");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString()), claims = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("actions_identity_invalid");
  if (!keys || keys.expires < Date.now()) {
    const response = await fetch("https://token.actions.githubusercontent.com/.well-known/jwks", { redirect: "error", signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (!response.ok) throw new Error("actions_identity_keys_unavailable");
    const data = await response.json();
    if (!Array.isArray(data.keys) || data.keys.length > 20) throw new Error("actions_identity_keys_invalid");
    keys = { values: data.keys, expires: Date.now() + 300000 };
  }
  const key = keys.values.find(key => key.kid === header.kid && key.kty === "RSA" && key.use === "sig" && key.alg === "RS256");
  if (!key || !verify("RSA-SHA256", Buffer.from(parts[0] + "." + parts[1]), createPublicKey({ key, format: "jwk" }), Buffer.from(parts[2], "base64url"))) throw new Error("actions_identity_invalid");
  const now = Math.floor(Date.now() / 1000);
  if (claims.iss !== "https://token.actions.githubusercontent.com") throw new Error("actions_identity_issuer_invalid");
  if (claims.aud !== audience) throw new Error("actions_identity_audience_invalid");
  if (!Number.isFinite(claims.exp) || !Number.isFinite(claims.iat) || claims.exp <= now || claims.iat > now + 30 || claims.exp - claims.iat > 600 || (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now + 30))) throw new Error("actions_identity_expired");
  if (claims.repository !== repository || claims.repository_owner !== "olcayto44") throw new Error("actions_identity_repository_invalid");
  if (claims.repository_visibility !== "private") throw new Error("actions_identity_visibility_invalid");
  if (claims.workflow_ref !== workflow || claims.ref !== "refs/heads/main") throw new Error("actions_identity_workflow_invalid");
  if (claims.event_name !== "workflow_dispatch") throw new Error("actions_identity_event_invalid");
  if (claims.runner_environment !== "github-hosted") throw new Error("actions_identity_runner_invalid");
  if (claims.sub !== "repo:" + repository + ":ref:refs/heads/main") throw new Error("actions_identity_subject_invalid");
  if (!/^\d+$/.test(claims.run_id) || !/^\d+$/.test(claims.run_attempt)) throw new Error("actions_identity_run_invalid");
  return { runId: String(claims.run_id), attempt: String(claims.run_attempt) };
}
export async function verifyActionsRun(runId: string, jobId: string) {
  const token = process.env.WEBSITE_RUNTIME_GITHUB_TOKEN;
  if (!token) throw new Error("runtime_actions_not_configured");
  const response = await fetch("https://api.github.com/repos/" + repository + "/actions/runs/" + runId, { redirect: "error", signal: AbortSignal.timeout(10000), headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }, cache: "no-store" });
  if (response.status === 401) throw new Error("actions_run_auth_failed");
  if (response.status === 403) throw new Error("actions_run_access_denied");
  if (response.status === 404) throw new Error("actions_run_not_found");
  if (!response.ok) throw new Error("actions_run_unavailable");
  const run = await response.json();
  if (run.path !== ".github/workflows/project-acceptance.yml" || run.event !== "workflow_dispatch" || run.head_branch !== "main" || run.display_title !== "Acceptance " + jobId || run.repository?.full_name !== repository) throw new Error("actions_run_job_mismatch");
}
