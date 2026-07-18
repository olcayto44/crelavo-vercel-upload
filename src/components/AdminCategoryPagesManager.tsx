"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiHeaders } from "@/lib/admin-client-auth";
import { defaultCategoryPages, type CategoryPage } from "@/lib/category-pages";
import { supabaseBrowser } from "@/lib/supabase";

function normalizeId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `category-${Date.now()}`;
}

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function linksToText(items: CategoryPage["internalLinks"] = []) {
  return items.map((item) => `${item.label}|${item.href}`).join("\n");
}

function textToLinks(value: string) {
  return value.split("\n").map((line) => {
    const [label, href] = line.split("|");
    return { label: label?.trim() || "", href: href?.trim() || "" };
  }).filter((item) => item.label && item.href);
}

function sectionsToText(sections: CategoryPage["sections"]) {
  return sections.map((section) => `${section.title}\n${section.text}`).join("\n---\n");
}

function textToSections(value: string) {
  return value.split("\n---\n").map((block) => {
    const [title, ...rest] = block.split("\n");
    return { title: title?.trim() || "Category section", text: rest.join("\n").trim() || "Section text." };
  }).filter((item) => item.title && item.text);
}

function addCustomPage(): CategoryPage {
  return {
    slug: `custom-category-${Date.now()}`,
    title: "Custom SEO Category Page",
    turkishTitle: "Özel SEO Kategori Sayfası",
    badge: "Custom category",
    keyword: "SEO Category",
    summary: "Custom editable SEO category page managed from the admin panel.",
    primaryCtaLabel: "Start request",
    primaryCtaHref: "/dashboard/assistant-workspace",
    secondaryCtaHref: "/categories",
    bestFor: "Custom production categories",
    inputs: ["Project brief"],
    outputs: ["Delivery package"],
    delivery: ["Preview", "Final ZIP", "README", "Revision path"],
    sections: [{ title: "Custom category workflow", text: "Use this page to describe a custom public SEO category and route users into the right production flow." }],
    examples: ["Custom category package"],
    status: "draft",
    seoPriority: "low",
    includeInSitemap: false,
    faqItems: [],
    internalLinks: []
  };
}

export function AdminCategoryPagesManager({ initialPages = defaultCategoryPages }: { initialPages?: CategoryPage[] }) {
  const [pages, setPages] = useState<CategoryPage[]>(initialPages);
  const [selectedSlug, setSelectedSlug] = useState(initialPages[0]?.slug ?? "");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const defaultSlugs = useMemo(() => new Set(defaultCategoryPages.map((page) => page.slug)), []);
  const selectedPage = pages.find((page) => page.slug === selectedSlug) ?? pages[0];

  useEffect(() => {
    async function loadAdminEmail() {
      const { data } = await supabaseBrowser().auth.getUser();
      const email = data.user?.email ?? "";
      if (email) setAdminEmail(email);
    }
    loadAdminEmail();
  }, []);

  function updatePage(updates: Partial<CategoryPage>) {
    setPages((current) => current.map((page) => page.slug === selectedPage.slug ? { ...page, ...updates } : page));
    if (updates.slug) setSelectedSlug(updates.slug);
  }

  async function loadPages() {
    setState("loading");
    setMessage("");
    const response = await fetch("/api/admin/category-pages", { headers: adminApiHeaders(adminEmail, adminToken) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "Category pages could not be loaded.");
      return;
    }
    setPages(data.categoryPages ?? defaultCategoryPages);
    setSelectedSlug((data.categoryPages ?? defaultCategoryPages)[0]?.slug ?? "");
    setState("success");
    setMessage(data.fallback ? "Default category pages loaded." : "Category pages loaded from admin config.");
  }

  async function savePages() {
    setState("loading");
    setMessage("");
    const response = await fetch("/api/admin/category-pages", {
      method: "POST",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ categoryPages: pages })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "Category pages could not be saved.");
      return;
    }
    setPages(data.categoryPages ?? pages);
    setState("success");
    setMessage("Category pages saved.");
  }

  function addPage() {
    const page = addCustomPage();
    setPages((current) => [...current, page]);
    setSelectedSlug(page.slug);
  }

  function deletePage() {
    if (!selectedPage) return;
    if (defaultSlugs.has(selectedPage.slug)) {
      setState("error");
      setMessage("Default category pages cannot be deleted. Set status to Draft / hidden instead.");
      return;
    }
    const next = pages.filter((page) => page.slug !== selectedPage.slug);
    setPages(next);
    setSelectedSlug(next[0]?.slug ?? "");
  }

  if (!selectedPage) return null;

  return (
    <div className="admin-faq-manager admin-service-pages-manager">
      <aside className="admin-faq-list">
        <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
        <div className="admin-faq-actions"><button className="btn secondary" type="button" onClick={loadPages} disabled={state === "loading"}>Load</button><button className="btn" type="button" onClick={savePages} disabled={state === "loading"}>Save</button></div>
        <div className="admin-faq-actions"><button className="btn secondary" type="button" onClick={addPage}>Add category page</button><button className="btn danger" type="button" onClick={deletePage}>Delete custom page</button></div>
        <div className="admin-config-stack">
          {pages.map((page) => <button className={`admin-inline-select ${page.slug === selectedPage.slug ? "active" : ""}`} key={page.slug} type="button" onClick={() => setSelectedSlug(page.slug)}><b>{page.title}</b><small>/categories/{page.slug} · {page.status ?? "published"}</small></button>)}
        </div>
        {message ? <p className={`form-message ${state}`}>{message}</p> : null}
      </aside>

      <section className="admin-faq-editor admin-service-pages-editor">
        <div className="admin-config-card">
          <span className="badge">Publish controls</span>
          <div className="brief-two-col">
            <div className="field"><label>Status</label><select value={selectedPage.status ?? "published"} onChange={(event) => updatePage({ status: event.target.value as CategoryPage["status"] })}><option value="published">Published</option><option value="noindex">Published but noindex</option><option value="draft">Draft / hidden</option></select></div>
            <div className="field"><label>SEO priority</label><select value={selectedPage.seoPriority ?? "medium"} onChange={(event) => updatePage({ seoPriority: event.target.value as CategoryPage["seoPriority"] })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)" }}><input type="checkbox" checked={selectedPage.includeInSitemap !== false} onChange={(event) => updatePage({ includeInSitemap: event.target.checked })} /> Include in sitemap when published</label>
        </div>

        <div className="admin-config-card">
          <span className="badge">SEO identity</span>
          <div className="brief-two-col"><div className="field"><label>Slug</label><input value={selectedPage.slug} onChange={(event) => updatePage({ slug: normalizeId(event.target.value) })} /></div><div className="field"><label>Keyword</label><input value={selectedPage.keyword} onChange={(event) => updatePage({ keyword: event.target.value })} /></div></div>
          <div className="brief-two-col"><div className="field"><label>Title / H1</label><input value={selectedPage.title} onChange={(event) => updatePage({ title: event.target.value })} /></div><div className="field"><label>Turkish title</label><input value={selectedPage.turkishTitle} onChange={(event) => updatePage({ turkishTitle: event.target.value })} /></div></div>
          <div className="field"><label>Summary / meta description</label><textarea value={selectedPage.summary} onChange={(event) => updatePage({ summary: event.target.value })} /></div>
          <div className="field"><label>Best for</label><textarea value={selectedPage.bestFor} onChange={(event) => updatePage({ bestFor: event.target.value })} /></div>
        </div>

        <div className="admin-config-card">
          <span className="badge">Redirects and lists</span>
          <div className="brief-two-col"><div className="field"><label>Primary CTA label</label><input value={selectedPage.primaryCtaLabel} onChange={(event) => updatePage({ primaryCtaLabel: event.target.value })} /></div><div className="field"><label>Primary CTA href</label><input value={selectedPage.primaryCtaHref} onChange={(event) => updatePage({ primaryCtaHref: event.target.value })} /></div></div>
          <div className="brief-two-col"><div className="field"><label>Inputs, one per line</label><textarea value={selectedPage.inputs.join("\n")} onChange={(event) => updatePage({ inputs: lines(event.target.value) })} /></div><div className="field"><label>Outputs, one per line</label><textarea value={selectedPage.outputs.join("\n")} onChange={(event) => updatePage({ outputs: lines(event.target.value) })} /></div></div>
          <div className="brief-two-col"><div className="field"><label>Delivery, one per line</label><textarea value={selectedPage.delivery.join("\n")} onChange={(event) => updatePage({ delivery: lines(event.target.value) })} /></div><div className="field"><label>Examples, one per line</label><textarea value={selectedPage.examples.join("\n")} onChange={(event) => updatePage({ examples: lines(event.target.value) })} /></div></div>
        </div>

        <div className="admin-config-card">
          <span className="badge">SEO article sections</span>
          <p style={{ color: "var(--muted)", marginTop: 0 }}>Separate sections with a line containing only --- . First line is H2, remaining lines are body text.</p>
          <div className="field"><label>Sections</label><textarea value={sectionsToText(selectedPage.sections)} onChange={(event) => updatePage({ sections: textToSections(event.target.value) })} rows={10} /></div>
        </div>

        <div className="admin-config-card">
          <span className="badge">Internal links</span>
          <div className="field"><label>Internal links as Label|/href</label><textarea value={linksToText(selectedPage.internalLinks)} onChange={(event) => updatePage({ internalLinks: textToLinks(event.target.value) })} rows={8} /></div>
        </div>
      </section>
    </div>
  );
}
