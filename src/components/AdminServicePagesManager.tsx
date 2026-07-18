"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { servicePages, type ServicePage } from "@/lib/service-pages";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiHeaders } from "@/lib/admin-client-auth";

function normalizeId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `service-${Date.now()}`;
}

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function sectionsToText(sections: ServicePage["sections"]) {
  return sections.map((section) => `${section.title}\n${section.text}`).join("\n---\n");
}

function textToSections(value: string) {
  return value.split("\n---\n").map((block) => {
    const [title, ...rest] = block.split("\n");
    return { title: title?.trim() || "Service section", text: rest.join("\n").trim() || "Section text." };
  }).filter((section) => section.title && section.text);
}

function faqToText(items: ServicePage["faqItems"] = []) {
  return items.map((item) => `${item.question}\n${item.answer}`).join("\n---\n");
}

function textToFaq(value: string) {
  return value.split("\n---\n").map((block) => {
    const [question, ...rest] = block.split("\n");
    return { question: question?.trim() || "Question", answer: rest.join("\n").trim() || "Answer." };
  }).filter((item) => item.question && item.answer);
}

function linksToText(items: ServicePage["internalLinks"] = []) {
  return items.map((item) => `${item.label}|${item.href}`).join("\n");
}

function textToLinks(value: string) {
  return value.split("\n").map((line) => {
    const [label, href] = line.split("|");
    return { label: label?.trim() || "", href: href?.trim() || "" };
  }).filter((item) => item.label && item.href);
}

function launchChecks(page: ServicePage) {
  return [
    { label: "Published status", ok: (page.status ?? "published") === "published" },
    { label: "Meta summary length", ok: page.summary.length >= 90 && page.summary.length <= 180 },
    { label: "Assistant CTA", ok: page.primaryCtaHref.includes("/dashboard/assistant-workspace") || page.primaryCtaHref.startsWith("/dashboard") },
    { label: "Delivery items", ok: page.delivery.length >= 3 },
    { label: "Article sections", ok: page.sections.length >= 2 },
    { label: "Internal links", ok: (page.internalLinks?.length ?? 0) >= 2 },
    { label: "FAQ items", ok: (page.faqItems?.length ?? 0) >= 2 },
    { label: "Sitemap allowed", ok: page.includeInSitemap !== false && page.status !== "draft" }
  ];
}

function addCustomPage(length: number): ServicePage {
  return {
    slug: `custom-ai-service-${Date.now()}`,
    title: "Custom AI Service Page",
    turkishTitle: "Özel Yapay Zeka Hizmet Sayfası",
    badge: "Custom service",
    keyword: "AI Service",
    summary: "Custom editable AI service page managed from the admin panel.",
    primaryCtaLabel: "Start request",
    primaryCtaHref: "/dashboard/assistant-workspace",
    secondaryCtaHref: "/pricing",
    bestFor: "Custom production requests",
    inputs: ["Project brief"],
    outputs: ["Delivery package"],
    delivery: ["Preview", "Final ZIP", "README", "Revision path"],
    sections: [{ title: "Custom service workflow", text: "Use this page to describe a custom public AI service and route users into the right production flow." }],
    examples: ["Custom service package"],
    status: "draft",
    seoPriority: "low",
    includeInSitemap: false,
    faqItems: [],
    internalLinks: []
  };
}

export function AdminServicePagesManager({ initialPages = servicePages }: { initialPages?: ServicePage[] }) {
  const [pages, setPages] = useState<ServicePage[]>(initialPages);
  const [selectedSlug, setSelectedSlug] = useState(initialPages[0]?.slug ?? "");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const defaultSlugs = useMemo(() => new Set(servicePages.map((page) => page.slug)), []);
  const selectedPage = pages.find((page) => page.slug === selectedSlug) ?? pages[0];
  const selectedLaunchChecks = selectedPage ? launchChecks(selectedPage) : [];
  const selectedReadyCount = selectedLaunchChecks.filter((check) => check.ok).length;

  useEffect(() => {
    async function loadAdminEmail() {
      const { data } = await supabaseBrowser().auth.getUser();
      const email = data.user?.email ?? "";
      if (email) setAdminEmail(email);
    }
    loadAdminEmail();
  }, []);

  function updatePage(updates: Partial<ServicePage>) {
    setPages((current) => current.map((page) => page.slug === selectedPage.slug ? { ...page, ...updates } : page));
    if (updates.slug) setSelectedSlug(updates.slug);
  }

  async function loadPages() {
    setState("loading");
    setMessage("");
    const response = await fetch("/api/admin/service-pages", { headers: adminApiHeaders(adminEmail, adminToken) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "Service pages could not be loaded.");
      return;
    }
    setPages(data.servicePages ?? servicePages);
    setSelectedSlug((data.servicePages ?? servicePages)[0]?.slug ?? "");
    setState("success");
    setMessage(data.fallback ? "Default service pages loaded." : "Service pages loaded from admin config.");
  }

  async function savePages() {
    setState("loading");
    setMessage("");
    const response = await fetch("/api/admin/service-pages", {
      method: "POST",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ servicePages: pages })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "Service pages could not be saved.");
      return;
    }
    setPages(data.servicePages ?? pages);
    setState("success");
    setMessage("Service pages saved. Public SEO pages now read admin-managed titles, copy and redirect links.");
  }

  function addPage() {
    const page = addCustomPage(pages.length);
    setPages((current) => [...current, page]);
    setSelectedSlug(page.slug);
  }

  function removeSelectedPage() {
    if (!selectedPage || defaultSlugs.has(selectedPage.slug)) {
      setMessage("Default service pages cannot be deleted, but all copy and redirect fields can be edited.");
      setState("error");
      return;
    }
    setPages((current) => current.filter((page) => page.slug !== selectedPage.slug));
    setSelectedSlug(pages[0]?.slug ?? servicePages[0]?.slug ?? "");
  }

  return (
    <div className="admin-faq-manager admin-service-pages-manager">
      <aside className="admin-faq-list">
        <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
        <div className="admin-faq-actions"><button className="btn secondary" type="button" onClick={loadPages} disabled={state === "loading"}>Load</button><button className="btn" type="button" onClick={savePages} disabled={state === "loading"}>Save</button></div>
        <div className="admin-faq-actions"><button className="btn secondary" type="button" onClick={addPage}>Add service page</button><button className="btn danger" type="button" onClick={removeSelectedPage}>Delete custom page</button></div>
        <div className="admin-config-stack">
          {pages.map((page) => <button className={`admin-inline-select ${page.slug === selectedPage?.slug ? "active" : ""}`} type="button" onClick={() => setSelectedSlug(page.slug)} key={page.slug}><b>{page.title}</b><small>/{page.slug} · {page.status ?? "published"} · {page.seoPriority ?? "medium"}</small></button>)}
        </div>
        <p style={{ color: "var(--muted)", margin: 0 }}>Edit SEO/service page copy and all redirect links from admin. Primary CTA controls where the page sends users.</p>
        {message ? <p className={`form-message ${state}`}>{message}</p> : null}
      </aside>

      {selectedPage ? (
        <section className="admin-faq-editor admin-service-pages-editor">
          <div className="admin-config-card">
            <span className="badge">Publish controls</span>
            <div className="brief-two-col">
              <div className="field"><label>Status</label><select value={selectedPage.status ?? "published"} onChange={(event) => updatePage({ status: event.target.value as ServicePage["status"] })}><option value="published">Published</option><option value="noindex">Published but noindex</option><option value="draft">Draft / hidden</option></select></div>
              <div className="field"><label>SEO priority</label><select value={selectedPage.seoPriority ?? "medium"} onChange={(event) => updatePage({ seoPriority: event.target.value as ServicePage["seoPriority"] })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)" }}><input type="checkbox" checked={selectedPage.includeInSitemap !== false} onChange={(event) => updatePage({ includeInSitemap: event.target.checked })} /> Include in sitemap when published</label>
            <div className="admin-info-grid" style={{ marginTop: 12 }}>
              <div><span>Launch score</span><strong>{selectedReadyCount}/{selectedLaunchChecks.length}</strong><small>SEO/service readiness checks</small></div>
              <div><span>Meta length</span><strong>{selectedPage.summary.length}</strong><small>Target: 90-180 characters</small></div>
              <div><span>FAQ items</span><strong>{selectedPage.faqItems?.length ?? 0}</strong><small>Target: at least 2</small></div>
              <div><span>Internal links</span><strong>{selectedPage.internalLinks?.length ?? 0}</strong><small>Target: at least 2</small></div>
            </div>
            <div className="admin-category-grid" style={{ marginTop: 12 }}>
              {selectedLaunchChecks.map((check) => <div className="card admin-category-card" key={check.label}><span className="badge">{check.ok ? "Ready" : "Needs work"}</span><p>{check.label}</p></div>)}
            </div>
          </div>

          <div className="admin-config-card">
            <span className="badge">SEO identity</span>
            <div className="brief-two-col"><div className="field"><label>Slug</label><input value={selectedPage.slug} onChange={(event) => updatePage({ slug: normalizeId(event.target.value) })} /></div><div className="field"><label>Keyword</label><input value={selectedPage.keyword} onChange={(event) => updatePage({ keyword: event.target.value })} /></div></div>
            <div className="brief-two-col"><div className="field"><label>Title / H1</label><input value={selectedPage.title} onChange={(event) => updatePage({ title: event.target.value })} /></div><div className="field"><label>Turkish title</label><input value={selectedPage.turkishTitle} onChange={(event) => updatePage({ turkishTitle: event.target.value })} /></div></div>
            <div className="field"><label>Summary / meta description</label><textarea value={selectedPage.summary} onChange={(event) => updatePage({ summary: event.target.value })} /></div>
            <div className="field"><label>Best for</label><textarea value={selectedPage.bestFor} onChange={(event) => updatePage({ bestFor: event.target.value })} /></div>
          </div>

          <div className="admin-config-card">
            <span className="badge">Admin-controlled redirects</span>
            <div className="brief-two-col"><div className="field"><label>Primary CTA label</label><input value={selectedPage.primaryCtaLabel} onChange={(event) => updatePage({ primaryCtaLabel: event.target.value })} /></div><div className="field"><label>Primary CTA href / redirect</label><input value={selectedPage.primaryCtaHref} onChange={(event) => updatePage({ primaryCtaHref: event.target.value })} /></div></div>
            <div className="field"><label>Secondary CTA href / redirect</label><input value={selectedPage.secondaryCtaHref ?? ""} onChange={(event) => updatePage({ secondaryCtaHref: event.target.value })} /></div>
            <p style={{ color: "var(--muted)", margin: 0 }}>Use these fields to send users to Assistant Workspace presets, pricing, dashboard pages, external URLs or any future route.</p>
          </div>

          <div className="admin-config-card">
            <span className="badge">Editable lists</span>
            <div className="brief-two-col"><div className="field"><label>Inputs, one per line</label><textarea value={selectedPage.inputs.join("\n")} onChange={(event) => updatePage({ inputs: lines(event.target.value) })} /></div><div className="field"><label>Outputs, one per line</label><textarea value={selectedPage.outputs.join("\n")} onChange={(event) => updatePage({ outputs: lines(event.target.value) })} /></div></div>
            <div className="brief-two-col"><div className="field"><label>Delivery items, one per line</label><textarea value={selectedPage.delivery.join("\n")} onChange={(event) => updatePage({ delivery: lines(event.target.value) })} /></div><div className="field"><label>Examples, one per line</label><textarea value={selectedPage.examples.join("\n")} onChange={(event) => updatePage({ examples: lines(event.target.value) })} /></div></div>
          </div>

          <div className="admin-config-card">
            <span className="badge">SEO article sections</span>
            <p style={{ color: "var(--muted)", marginTop: 0 }}>Separate sections with a line containing only --- . First line is H2, remaining lines are body text.</p>
            <div className="field"><label>Sections</label><textarea value={sectionsToText(selectedPage.sections)} onChange={(event) => updatePage({ sections: textToSections(event.target.value) })} rows={12} /></div>
          </div>

          <div className="admin-config-card">
            <span className="badge">FAQ and internal links</span>
            <p style={{ color: "var(--muted)", marginTop: 0 }}>FAQ blocks use question on first line, answer below, separated by --- . Internal links use Label|/href, one per line.</p>
            <div className="brief-two-col">
              <div className="field"><label>FAQ items</label><textarea value={faqToText(selectedPage.faqItems)} onChange={(event) => updatePage({ faqItems: textToFaq(event.target.value) })} rows={10} /></div>
              <div className="field"><label>Internal links</label><textarea value={linksToText(selectedPage.internalLinks)} onChange={(event) => updatePage({ internalLinks: textToLinks(event.target.value) })} rows={10} placeholder={"AI Website Builder|/ai-website-builder\nPricing|/pricing"} /></div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
