"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type AccountUser = { email: string } | null;
type NoticeState = { production: boolean; billing: boolean; product: boolean };
type TeamMember = { email: string; role: "owner" | "member" | "admin" };
type MessageState = Record<string, { text: string; error?: boolean }>;

const SETTINGS_CSS = `
.cdx-settings { margin-top: 16px; }
.cdx-set-auth {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  color: #aeb8cc; font-size: 14px; margin: 0 0 16px;
}
.cdx-set-auth a {
  display: inline-flex; align-items: center; justify-content: center;
  height: 36px; padding: 0 14px; border-radius: 999px;
  border: 1px solid rgba(215,227,245,.18); color: #f8fbff; text-decoration: none;
}
.cdx-set-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;
}
.cdx-set-card {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(215,227,245,.10);
  border-radius: 18px; padding: 20px 22px; margin-bottom: 16px;
}
.cdx-set-card h3 { margin: 0 0 8px; color: #f8fbff; font-size: 18px; }
.cdx-set-card p, .cdx-set-help { margin: 0 0 14px; color: #aeb8cc; font-size: 14px; line-height: 1.45; }
.cdx-set-form { display: grid; gap: 8px; }
.cdx-set-form label { color: #d7e3f5; font-size: 13px; }
.cdx-set-form input, .cdx-set-form select {
  width: 100%; height: 44px; padding: 0 14px; border-radius: 12px;
  background: rgba(8,18,40,.72); color: #f8fbff;
  border: 1px solid rgba(215,227,245,.16); font: inherit;
}
.cdx-btn {
  height: 44px; border: 0; border-radius: 999px; cursor: pointer; font: inherit; font-weight: 600;
  background: #22d3ee; color: #082032;
}
.cdx-set-form .cdx-btn { margin-top: 6px; }
.cdx-set-msg { margin: 4px 0 0; font-size: 13px; color: #d7e3f5; }
.cdx-set-msg.is-err { color: #fca5a5; }
.cdx-set-pill {
  display: inline-flex; align-items: center; height: 28px; padding: 0 10px;
  border-radius: 999px; background: rgba(255,255,255,.06); color: #d7e3f5; font-size: 12px;
}
.cdx-set-pill.is-on { background: rgba(34,211,238,.16); color: #22d3ee; }
.cdx-set-check {
  display: flex; align-items: center; gap: 10px; color: #f8fbff; font-size: 14px;
}
.cdx-set-check input { width: 18px; height: 18px; accent-color: #22d3ee; }
.cdx-set-team-add {
  display: grid; grid-template-columns: 1fr 160px auto; gap: 10px; align-items: end;
}
.cdx-set-team-list { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 8px; }
.cdx-set-team-list li {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,.03);
  color: #f8fbff; font-size: 14px;
}
.cdx-set-team-list button {
  height: 32px; padding: 0 12px; border-radius: 999px; cursor: pointer; font: inherit;
  background: transparent; color: #d7e3f5; border: 1px solid rgba(215,227,245,.16);
}
.cdx-settings.is-guest input,
.cdx-settings.is-guest select { opacity: .7; }
@media (max-width: 900px) {
  .cdx-set-grid, .cdx-set-team-add { grid-template-columns: 1fr; }
}
`;

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function SettingsAccountPanel() {
  const [user, setUser] = useState<AccountUser>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [language, setLanguage] = useState("en");
  const [notices, setNotices] = useState<NoticeState>({ production: true, billing: true, product: false });
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [twoFaOn, setTwoFaOn] = useState(false);
  const [twoFaSetup, setTwoFaSetup] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState("");
  const [messages, setMessages] = useState<MessageState>({});

  const storageKey = (name: string, email = user?.email) => `cdx.settings.${name}.${email || "guest"}`;
  const setMessage = (key: string, text: string, error = false) => setMessages((current) => ({ ...current, [key]: { text, error } }));
  const requireUser = (key: string) => {
    if (user) return true;
    setMessage(key, "Sign in to change this.", true);
    return false;
  };

  useEffect(() => {
    let active = true;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
      setAuthLoaded(true);
      return () => { active = false; };
    }
    supabaseBrowser().auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user?.email ? { email: data.user.email } : null);
      setAuthLoaded(true);
    }).catch(() => {
      if (active) setAuthLoaded(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authLoaded) return;
    setLanguage(readStored(storageKey("lang"), { lang: document.documentElement.lang || "en" }).lang);
    setNotices(readStored(storageKey("notify"), { production: true, billing: true, product: false }));
    setMembers(readStored<{ members: TeamMember[] }>(storageKey("team"), { members: [] }).members || []);
    setTwoFaOn(Boolean(readStored(storageKey("twofa"), { on: false }).on));
  }, [authLoaded, user?.email]);

  async function api(path: string, body: Record<string, unknown>) {
    try {
      const response = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let data: Record<string, unknown> | null = null;
      try { data = await response.json(); } catch {}
      return { ok: response.ok, data };
    } catch {
      return { ok: false, data: null };
    }
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireUser("email")) return;
    const form = new FormData(event.currentTarget);
    const next = String(form.get("email") || "").trim().toLowerCase();
    const confirm = String(form.get("emailConfirm") || "").trim().toLowerCase();
    if (!next || next.indexOf("@") < 1) return setMessage("email", "Enter a valid email.", true);
    if (next !== confirm) return setMessage("email", "Emails do not match.", true);
    const out = await api("/api/account/email", { email: next });
    setMessage("email", out.ok ? "Confirmation sent to the new email." : "Could not start the email change. Use Sign in with the new email after you confirm it.", !out.ok);
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireUser("password")) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("passwordConfirm") || "");
    if (password.length < 8) return setMessage("password", "Use at least 8 characters.", true);
    if (password !== confirm) return setMessage("password", "Passwords do not match.", true);
    const out = await api("/api/account/password", { password });
    event.currentTarget.reset();
    setMessage("password", out.ok ? "Password saved. Google and email-link sign-in still work." : "Password is not on the server yet. Sign-in stays Google or email link.", !out.ok);
  }

  async function submitTwoFa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireUser("2fa")) return;
    if (twoFaOn) {
      const out = await api("/api/account/2fa/disable", {});
      if (!out.ok) return setMessage("2fa", "Could not disable 2FA from this session.", true);
      localStorage.setItem(storageKey("twofa"), JSON.stringify({ on: false }));
      setTwoFaOn(false);
      setTwoFaSetup(false);
      return setMessage("2fa", "2FA is off.");
    }
    const code = String(new FormData(event.currentTarget).get("code") || "").trim();
    if (twoFaSetup && code) {
      const out = await api("/api/account/2fa/verify", { code });
      if (!out.ok) return setMessage("2fa", "That code did not verify.", true);
      localStorage.setItem(storageKey("twofa"), JSON.stringify({ on: true }));
      setTwoFaOn(true);
      setTwoFaSetup(false);
      return setMessage("2fa", "2FA is on.");
    }
    const out = await api("/api/account/2fa/start", {});
    if (!out.ok) return setMessage("2fa", "2FA setup needs a signed-in session on the server. It is not enabled yet.", true);
    setTwoFaSecret(typeof out.data?.secret === "string" ? out.data.secret : "");
    setTwoFaSetup(true);
    setMessage("2fa", "Enter the authenticator code to finish.");
  }

  function saveLanguage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireUser("lang")) return;
    localStorage.setItem(storageKey("lang"), JSON.stringify({ lang: language }));
    document.documentElement.lang = language;
    setMessage("lang", "Language saved.");
  }

  function saveNotices(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireUser("notify")) return;
    localStorage.setItem(storageKey("notify"), JSON.stringify(notices));
    setMessage("notify", "Notifications saved.");
  }

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireUser("team")) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("memberEmail") || "").trim().toLowerCase();
    const role = String(form.get("memberRole") || "member") as "member" | "admin";
    if (!email || email.indexOf("@") < 1) return setMessage("team", "Enter a valid email.", true);
    if (members.some((member) => member.email === email) || user?.email === email) return setMessage("team", "That email is already on the team.", true);
    const next = [...members, { email, role }];
    setMembers(next);
    localStorage.setItem(storageKey("team"), JSON.stringify({ members: next }));
    event.currentTarget.reset();
    setMessage("team", "Member added. They sign in with Google or an email link.");
  }

  function removeMember(email: string) {
    if (!requireUser("team")) return;
    const next = members.filter((member) => member.email !== email);
    setMembers(next);
    localStorage.setItem(storageKey("team"), JSON.stringify({ members: next }));
    setMessage("team", "Member removed.");
  }

  const teamRows: TeamMember[] = user ? [{ email: user.email, role: "owner" }, ...members.filter((member) => member.email !== user.email)] : members;
  const message = (key: string) => <p className={`cdx-set-msg${messages[key]?.error ? " is-err" : ""}`} data-cdx-msg={key} hidden={!messages[key]?.text}>{messages[key]?.text}</p>;

  return (
    <section className={`cdx-settings${authLoaded && !user ? " is-guest" : ""}`} data-cdx="settings-account">
      <style id="cdx-settings-account-css">{SETTINGS_CSS}</style>
      {authLoaded && !user ? <p className="cdx-set-auth" data-cdx-auth-guest>Not signed in? <a href="/join">Sign in</a> to change login, language, notifications or team.</p> : null}

      <div className="cdx-set-grid">
        <article className="cdx-set-card"><h3>Email</h3><p>Dashboard sign-in email. Use the same email as Whop checkout so credits match. A change sends a confirmation link.</p><form id="cdx-set-email" className="cdx-set-form" noValidate onSubmit={submitEmail}><label htmlFor="cdx-set-email-current">Current email</label><input id="cdx-set-email-current" type="email" autoComplete="username" readOnly placeholder="Sign in to see your email" value={user?.email || ""} /><label htmlFor="cdx-set-email-new">New email</label><input id="cdx-set-email-new" name="email" type="email" autoComplete="email" placeholder="you@company.com" /><label htmlFor="cdx-set-email-confirm">Confirm new email</label><input id="cdx-set-email-confirm" name="emailConfirm" type="email" autoComplete="email" placeholder="Repeat new email" /><button className="cdx-btn" type="submit">Send confirmation</button>{message("email")}</form></article>
        <article className="cdx-set-card"><h3>Password</h3><p>Optional backup. Sign-in already works with Google or an email link. Skip this if you do not want a password.</p><form id="cdx-set-password" className="cdx-set-form" noValidate onSubmit={submitPassword}><label htmlFor="cdx-set-pass-new">New password</label><input id="cdx-set-pass-new" name="password" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" /><label htmlFor="cdx-set-pass-confirm">Confirm password</label><input id="cdx-set-pass-confirm" name="passwordConfirm" type="password" autoComplete="new-password" minLength={8} placeholder="Repeat password" /><button className="cdx-btn" type="submit">Save password</button>{message("password")}</form></article>
        <article className="cdx-set-card"><h3>Two-factor authentication</h3><p>Authenticator app for this Crelavo login. Checkout stays on Whop.</p><div className="cdx-set-row"><span className={`cdx-set-pill${twoFaOn ? " is-on" : ""}`} id="cdx-set-2fa-state">{twoFaOn ? "On" : "Off"}</span></div><form id="cdx-set-2fa" className="cdx-set-form" noValidate onSubmit={submitTwoFa}>{twoFaSetup ? <div id="cdx-set-2fa-setup"><p className="cdx-set-help" id="cdx-set-2fa-secret">{twoFaSecret ? `Add this key in your authenticator app: ${twoFaSecret}` : "Add Crelavo in your authenticator app, then enter the 6-digit code."}</p><label htmlFor="cdx-set-2fa-code">Verification code</label><input id="cdx-set-2fa-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} placeholder="6-digit code" /></div> : null}<button className="cdx-btn" id="cdx-set-2fa-btn" type="submit">{twoFaOn ? "Disable 2FA" : twoFaSetup ? "Verify code" : "Enable 2FA"}</button>{message("2fa")}</form></article>
        <article className="cdx-set-card"><h3>Language</h3><p>Preferred language for this account. Matches the public site: English, Deutsch, Français, Türkçe.</p><form id="cdx-set-lang" className="cdx-set-form" onSubmit={saveLanguage}><label htmlFor="cdx-set-lang-select">Language</label><select id="cdx-set-lang-select" value={language} onChange={(event) => setLanguage(event.target.value)}><option value="en">English</option><option value="de">Deutsch</option><option value="fr">Français</option><option value="tr">Türkçe</option></select><button className="cdx-btn" type="submit">Save language</button>{message("lang")}</form></article>
      </div>

      <article className="cdx-set-card"><h3>Notifications</h3><p>Email notices for this dashboard. Production and billing stay on unless you turn them off.</p><form id="cdx-set-notify" className="cdx-set-form" onSubmit={saveNotices}><label className="cdx-set-check"><input id="cdx-set-n-prod" type="checkbox" checked={notices.production} onChange={(event) => setNotices({ ...notices, production: event.target.checked })} /><span>Production status</span></label><label className="cdx-set-check"><input id="cdx-set-n-bill" type="checkbox" checked={notices.billing} onChange={(event) => setNotices({ ...notices, billing: event.target.checked })} /><span>Billing and credits</span></label><label className="cdx-set-check"><input id="cdx-set-n-news" type="checkbox" checked={notices.product} onChange={(event) => setNotices({ ...notices, product: event.target.checked })} /><span>Product updates</span></label><button className="cdx-btn" type="submit">Save notifications</button>{message("notify")}</form></article>

      <article className="cdx-set-card"><h3>Team members</h3><p>People who can open this workspace. Each person signs in with Google or an email link.</p><form id="cdx-set-team" className="cdx-set-form" noValidate onSubmit={addMember}><div className="cdx-set-team-add"><div><label htmlFor="cdx-set-team-email">Member email</label><input id="cdx-set-team-email" name="memberEmail" type="email" autoComplete="off" placeholder="name@company.com" /></div><div><label htmlFor="cdx-set-team-role">Role</label><select id="cdx-set-team-role" name="memberRole" defaultValue="member"><option value="member">Member</option><option value="admin">Admin</option></select></div><button className="cdx-btn" type="submit">Add member</button></div>{message("team")}</form><ul className="cdx-set-team-list" id="cdx-set-team-list">{teamRows.length ? teamRows.map((member) => <li key={`${member.role}:${member.email}`}><span>{member.email} · {member.role}</span>{member.role !== "owner" ? <button type="button" onClick={() => removeMember(member.email)}>Remove</button> : null}</li>) : <li>No members yet. You are the owner after you sign in.</li>}</ul></article>
    </section>
  );
}
