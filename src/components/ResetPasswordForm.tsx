"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type State = "idle" | "loading" | "success" | "error";

export function ResetPasswordForm() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const passwordConfirm = String(form.get("password_confirm") ?? "");

    if (password !== passwordConfirm) {
      setState("error");
      setMessage("Password and confirmation password must match.");
      return;
    }

    const { error } = await supabaseBrowser().auth.updateUser({ password });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }

    setState("success");
    setMessage("Your password was updated. Redirecting to the sign-in page...");
    setTimeout(() => { window.location.href = "/auth/login"; }, 1200);
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field"><label>New password</label><input name="password" type="password" required minLength={6} placeholder="New password" /></div>
      <div className="field"><label>Confirm new password</label><input name="password_confirm" type="password" required minLength={6} placeholder="Repeat your new password" /></div>
      <button className="btn" disabled={state === "loading"} type="submit">{state === "loading" ? "Updating..." : "Create new password"}</button>
      {message ? <p style={{ color: state === "error" ? "#fca5a5" : "#86efac" }}>{message}</p> : null}
    </form>
  );
}
