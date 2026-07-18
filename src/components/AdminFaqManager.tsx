"use client";

import { useMemo, useState } from "react";
import { defaultFaqItems, type FaqItem } from "@/lib/site-content";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiHeaders } from "@/lib/admin-client-auth";

function blankFaq(order: number): FaqItem {
  return {
    id: `faq-${Date.now()}`,
    question: "New question",
    answer: "Write the answer here.",
    category: "General",
    order,
    active: true
  };
}

function normalizeId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ]+/gi, "-").replace(/^-+|-+$/g, "") || `faq-${Date.now()}`;
}

export function AdminFaqManager({ initialFaqs = defaultFaqItems }: { initialFaqs?: FaqItem[] }) {
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [selectedId, setSelectedId] = useState(initialFaqs[0]?.id ?? "");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const selectedFaq = useMemo(() => faqs.find((item) => item.id === selectedId) ?? faqs[0], [faqs, selectedId]);

  function updateSelected(updates: Partial<FaqItem>) {
    if (!selectedFaq) return;
    setFaqs((current) => current.map((item) => item.id === selectedFaq.id ? { ...item, ...updates } : item));
  }

  function addFaq() {
    const next = blankFaq(faqs.length + 1);
    setFaqs((current) => [...current, next]);
    setSelectedId(next.id);
  }

  function removeSelected() {
    if (!selectedFaq || faqs.length <= 1) return;
    const nextFaqs = faqs.filter((item) => item.id !== selectedFaq.id).map((item, index) => ({ ...item, order: index + 1 }));
    setFaqs(nextFaqs);
    setSelectedId(nextFaqs[0]?.id ?? "");
  }

  async function loadFaqs() {
    setState("loading");
    setMessage("");
    const response = await fetch("/api/admin/faqs", { headers: adminApiHeaders(adminEmail, adminToken) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "FAQ list could not be loaded.");
      return;
    }
    setFaqs(data.faqs ?? defaultFaqItems);
    setSelectedId((data.faqs ?? defaultFaqItems)[0]?.id ?? "");
    setState("success");
    setMessage(data.fallback ? "Supabase config was not found; default FAQs were loaded." : "FAQ list loaded from the server.");
  }

  async function saveFaqs() {
    setState("loading");
    setMessage("");
    const normalizedFaqs = faqs.map((item, index) => ({ ...item, id: normalizeId(item.id || item.question), order: Number(item.order) || index + 1 }));
    const response = await fetch("/api/admin/faqs", {
      method: "POST",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ faqs: normalizedFaqs })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "FAQs could not be saved.");
      return;
    }
    setFaqs(data.faqs ?? normalizedFaqs);
    setSelectedId((data.faqs ?? normalizedFaqs)[0]?.id ?? "");
    setState("success");
    setMessage("FAQs saved. The homepage FAQ section will use this content.");
  }

  return (
    <div className="admin-faq-manager">
      <aside className="admin-faq-list">
        <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
        <div className="admin-faq-actions">
          <button className="btn secondary" type="button" onClick={loadFaqs} disabled={state === "loading"}>Load from server</button>
          <button className="btn" type="button" onClick={saveFaqs} disabled={state === "loading"}>Save</button>
        </div>
        <button className="btn secondary" type="button" onClick={addFaq}>Add FAQ</button>
        <div className="admin-faq-items">
          {faqs.sort((a, b) => a.order - b.order).map((item) => (
            <button className={`admin-faq-list-item ${selectedFaq?.id === item.id ? "active" : ""}`} key={item.id} type="button" onClick={() => setSelectedId(item.id)}>
              <strong>{item.question}</strong>
              <span>{item.category} · {item.active ? "Active" : "Paused"}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="admin-faq-editor">
        {selectedFaq ? (
          <>
            <div className="brief-two-col">
              <div className="field"><label>ID</label><input value={selectedFaq.id} onChange={(event) => updateSelected({ id: normalizeId(event.target.value) })} /></div>
              <div className="field"><label>Category</label><input value={selectedFaq.category} onChange={(event) => updateSelected({ category: event.target.value })} /></div>
            </div>
            <div className="brief-two-col">
              <div className="field"><label>Order</label><input type="number" value={selectedFaq.order} onChange={(event) => updateSelected({ order: Number(event.target.value) })} /></div>
              <label className={`option-toggle ${selectedFaq.active ? "active" : ""}`}><input type="checkbox" checked={selectedFaq.active} onChange={(event) => updateSelected({ active: event.target.checked })} /><span><strong>Show as active</strong><small>If paused, it will not appear in the homepage FAQ section</small></span></label>
            </div>
            <div className="field"><label>Question</label><input value={selectedFaq.question} onChange={(event) => updateSelected({ question: event.target.value })} /></div>
            <div className="field"><label>Answer</label><textarea value={selectedFaq.answer} onChange={(event) => updateSelected({ answer: event.target.value })} /></div>
            <div className="admin-faq-actions">
              <button className="btn secondary" type="button" onClick={removeSelected} disabled={faqs.length <= 1}>Delete selected FAQ</button>
              <button className="btn" type="button" onClick={saveFaqs} disabled={state === "loading"}>Save changes</button>
            </div>
          </>
        ) : <p>No FAQ selected.</p>}
        {message ? <p className={`form-message ${state}`}>{message}</p> : null}
        <p style={{ color: "var(--muted)", marginBottom: 0 }}>Note: Saving requires the <code>platform_configs</code> table from the Supabase migration file and the correct <code>ADMIN_EMAIL</code>.</p>
      </section>
    </div>
  );
}
