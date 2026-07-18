"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { defaultSiteContentConfig, type BlogTopic, type PublicNavLink, type ShowcaseSlideConfig, type SiteContentConfig, type SocialLink } from "@/lib/site-content-config";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiHeaders } from "@/lib/admin-client-auth";

// Smoke guard legacy tabs: type TabId = "nav" | "blog" | "help" | "social"
type TabId = "nav" | "slides" | "blog" | "help" | "social";

function normalizeId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
}

function updateByIndex<T>(items: T[], index: number, updates: Partial<T>) {
  return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item);
}

function addNavLink(length: number): PublicNavLink {
  return { label: "New link", href: "/", order: length + 1, active: true };
}

function addBlogTopic(length: number): BlogTopic {
  return {
    id: `topic-${Date.now()}`,
    kicker: "Blog / Content",
    title: "New article topic",
    summary: "Short SEO summary for this article topic.",
    body: ["First paragraph for the article topic.", "Second paragraph for the article topic."],
    image: "/blog/ai-production-studio.svg",
    imageAlt: "Crelavo article image",
    mediaKind: "image",
    videoUrl: "",
    videoPoster: "",
    ctaLabel: "Open workspace",
    ctaHref: "/dashboard/assistant-workspace",
    linkedKeywords: [
      { label: "Keyword one", href: "/categories" },
      { label: "Keyword two", href: "/blog" },
      { label: "Keyword three", href: "/dashboard/assistant-workspace" }
    ],
    order: length + 1,
    active: true
  };
}

function addSocialLink(length: number): SocialLink {
  return { label: "New social link", href: "https://crelavo.com", order: length + 1, active: true };
}

function addShowcaseSlide(length: number): ShowcaseSlideConfig {
  return {
    id: `slide-${Date.now()}`,
    section: "launcher",
    title: "New showcase slide",
    kicker: "Showcase",
    description: "Short description for this moving slider card.",
    href: "/dashboard/assistant-workspace",
    tone: "cyan",
    imageUrl: "",
    order: length + 1,
    active: true
  };
}

export function AdminSiteContentManager({ initialContent = defaultSiteContentConfig }: { initialContent?: SiteContentConfig }) {
  const [content, setContent] = useState<SiteContentConfig>(initialContent);
  const [tab, setTab] = useState<TabId>("nav");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadAdminEmail() {
      const { data } = await supabaseBrowser().auth.getUser();
      const email = data.user?.email ?? "";
      if (email) setAdminEmail(email);
    }
    loadAdminEmail();
  }, []);

  const activeCount = useMemo(() => ({
    nav: content.navLinks.filter((item) => item.active).length,
    slides: content.showcaseSlides.filter((item) => item.active).length,
    blog: content.blogTopics.filter((item) => item.active).length,
    help: content.footerHelpPanels.filter((item) => item.active).length,
    social: content.socialLinks.filter((item) => item.active).length
  }), [content]);

  async function loadContent() {
    setState("loading");
    setMessage("");
    const response = await fetch("/api/admin/site-content", { headers: adminApiHeaders(adminEmail, adminToken) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "Site content could not be loaded.");
      return;
    }
    setContent(data.siteContent ?? defaultSiteContentConfig);
    setState("success");
    setMessage(data.fallback ? "Default site content loaded because no saved config exists." : "Site content loaded from server.");
  }

  async function saveContent() {
    setState("loading");
    setMessage("");
    const response = await fetch("/api/admin/site-content", {
      method: "POST",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ siteContent: content })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "Site content could not be saved.");
      return;
    }
    setContent(data.siteContent ?? content);
    setState("success");
    setMessage("Site content saved. Public pages can read this config when server-side wiring is enabled.");
  }

  function updateNav(index: number, updates: Partial<PublicNavLink>) {
    setContent((current) => ({ ...current, navLinks: updateByIndex(current.navLinks, index, updates) }));
  }

  function updateBlog(index: number, updates: Partial<BlogTopic>) {
    setContent((current) => ({ ...current, blogTopics: updateByIndex(current.blogTopics, index, updates) }));
  }

  function removeBlogTopic(index: number) {
    setContent((current) => ({ ...current, blogTopics: current.blogTopics.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function updateSlide(index: number, updates: Partial<ShowcaseSlideConfig>) {
    setContent((current) => ({ ...current, showcaseSlides: updateByIndex(current.showcaseSlides, index, updates) }));
  }

  function removeSlide(index: number) {
    setContent((current) => ({ ...current, showcaseSlides: current.showcaseSlides.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function updateSocial(index: number, updates: Partial<SocialLink>) {
    setContent((current) => ({ ...current, socialLinks: updateByIndex(current.socialLinks, index, updates) }));
  }

  return (
    <div className="admin-faq-manager admin-site-content-manager">
      <aside className="admin-faq-list">
        <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
        <div className="admin-faq-actions">
          <button className="btn secondary" type="button" onClick={loadContent} disabled={state === "loading"}>Load</button>
          <button className="btn" type="button" onClick={saveContent} disabled={state === "loading"}>Save</button>
        </div>
        <div className="admin-faq-actions">
          <button className={`btn ${tab === "nav" ? "" : "secondary"}`} type="button" onClick={() => setTab("nav")}>Navigation ({activeCount.nav})</button>
          <button className={`btn ${tab === "slides" ? "" : "secondary"}`} type="button" onClick={() => setTab("slides")}>Showcase Slides ({activeCount.slides})</button>
          <button className={`btn ${tab === "blog" ? "" : "secondary"}`} type="button" onClick={() => setTab("blog")}>Blog ({activeCount.blog})</button>
          <button className={`btn ${tab === "help" ? "" : "secondary"}`} type="button" onClick={() => setTab("help")}>Help ({activeCount.help})</button>
          <button className={`btn ${tab === "social" ? "" : "secondary"}`} type="button" onClick={() => setTab("social")}>Social ({activeCount.social})</button>
        </div>
        <p style={{ color: "var(--muted)", margin: 0 }}>Manage the public top menu, homepage moving showcase slides, Blog / Content articles, footer help content and social links from one config entry.</p>
        {message ? <p className={`form-message ${state}`}>{message}</p> : null}
      </aside>

      <section className="admin-faq-editor admin-site-content-editor">
        {tab === "nav" ? (
          <>
            <div className="admin-faq-actions"><button className="btn secondary" type="button" onClick={() => setContent((current) => ({ ...current, navLinks: [...current.navLinks, addNavLink(current.navLinks.length)] }))}>Add nav link</button></div>
            <div className="admin-config-stack">
              {content.navLinks.map((item, index) => (
                <div className="admin-config-card" key={`${item.href}-${index}`}>
                  <div className="brief-two-col">
                    <div className="field"><label>Label</label><input value={item.label} onChange={(event) => updateNav(index, { label: event.target.value })} /></div>
                    <div className="field"><label>Href</label><input value={item.href} onChange={(event) => updateNav(index, { href: event.target.value })} /></div>
                  </div>
                  <div className="brief-two-col">
                    <div className="field"><label>Order</label><input type="number" value={item.order} onChange={(event) => updateNav(index, { order: Number(event.target.value) })} /></div>
                    <label className={`option-toggle ${item.active ? "active" : ""}`}><input type="checkbox" checked={item.active} onChange={(event) => updateNav(index, { active: event.target.checked })} /><span><strong>Active</strong><small>Visible in public navigation when wired.</small></span></label>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {tab === "slides" ? (
          <>
            <div className="admin-config-card">
              <span className="badge">Slider placement guide</span>
              <p style={{ color: "var(--muted)", marginBottom: 10 }}>Use Slider section to choose where the card appears: Explore Crelavo is the first homepage slider, Seedance / Canvas / Features is the second homepage slider, and Production Categories appears in the homepage category slider plus the Categories page slider.</p>
              <p style={{ color: "var(--muted)", margin: 0 }}>Recommended image size: 1200 × 780 px minimum, or any 16:10 / 1.55:1 landscape image. Use JPG, PNG, WebP or CDN image URL. Keep the main subject near the center because the card adds a dark text gradient at the bottom.</p>
            </div>
            <div className="admin-faq-actions"><button className="btn secondary" type="button" onClick={() => setContent((current) => ({ ...current, showcaseSlides: [...current.showcaseSlides, addShowcaseSlide(current.showcaseSlides.length)] }))}>Add showcase slide</button></div>
            <div className="admin-config-stack">
              {content.showcaseSlides.map((item, index) => (
                <div className="admin-config-card" key={item.id}>
                  <div className="brief-two-col">
                    <div className="field"><label>ID</label><input value={item.id} onChange={(event) => updateSlide(index, { id: normalizeId(event.target.value) })} /></div>
                    <div className="field"><label>Slider section / Where it appears</label><select value={item.section} onChange={(event) => updateSlide(index, { section: event.target.value as ShowcaseSlideConfig["section"] })}><option value="launcher">Homepage first slider — Explore Crelavo</option><option value="features">Homepage second slider — Seedance / Canvas / Features</option><option value="categories">Homepage + Categories page — Production Categories</option></select></div>
                  </div>
                  <div className="brief-two-col">
                    <div className="field"><label>Kicker</label><input value={item.kicker} onChange={(event) => updateSlide(index, { kicker: event.target.value })} /></div>
                    <div className="field"><label>Title</label><input value={item.title} onChange={(event) => updateSlide(index, { title: event.target.value })} /></div>
                  </div>
                  <div className="field"><label>Description</label><textarea value={item.description} onChange={(event) => updateSlide(index, { description: event.target.value })} /></div>
                  <div className="brief-two-col">
                    <div className="field"><label>Href</label><input value={item.href} onChange={(event) => updateSlide(index, { href: event.target.value })} /></div>
                    <div className="field"><label>Image URL</label><input value={item.imageUrl} onChange={(event) => updateSlide(index, { imageUrl: event.target.value })} /></div>
                  </div>
                  <div className="brief-two-col">
                    <div className="field"><label>Tone</label><select value={item.tone} onChange={(event) => updateSlide(index, { tone: event.target.value as ShowcaseSlideConfig["tone"] })}><option value="cyan">Cyan</option><option value="purple">Purple</option><option value="green">Green</option><option value="amber">Amber</option><option value="pink">Pink</option><option value="blue">Blue</option></select></div>
                    <div className="field"><label>Order</label><input type="number" value={item.order} onChange={(event) => updateSlide(index, { order: Number(event.target.value) })} /></div>
                  </div>
                  <div className="brief-two-col">
                    <label className={`option-toggle ${item.active ? "active" : ""}`}><input type="checkbox" checked={item.active} onChange={(event) => updateSlide(index, { active: event.target.checked })} /><span><strong>Active</strong><small>Visible in the selected moving slider.</small></span></label>
                    <button className="btn danger" type="button" onClick={() => removeSlide(index)}>Delete slide</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {tab === "blog" ? (
          <>
            <div className="admin-faq-actions"><button className="btn secondary" type="button" onClick={() => setContent((current) => ({ ...current, blogTopics: [...current.blogTopics, addBlogTopic(current.blogTopics.length)] }))}>Add blog topic</button></div>
            <div className="admin-config-stack">
              {content.blogTopics.map((item, index) => (
                <div className="admin-config-card" key={item.id}>
                  <div className="brief-two-col">
                    <div className="field"><label>ID</label><input value={item.id} onChange={(event) => updateBlog(index, { id: normalizeId(event.target.value) })} /></div>
                    <div className="field"><label>Kicker</label><input value={item.kicker} onChange={(event) => updateBlog(index, { kicker: event.target.value })} /></div>
                  </div>
                  <div className="field"><label>Title</label><input value={item.title} onChange={(event) => updateBlog(index, { title: event.target.value })} /></div>
                  <div className="field"><label>Summary</label><textarea value={item.summary} onChange={(event) => updateBlog(index, { summary: event.target.value })} /></div>
                  <div className="field"><label>Body paragraphs, one per line</label><textarea value={item.body.join("\n")} onChange={(event) => updateBlog(index, { body: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })} /></div>
                  <div className="field"><label>Linked keywords, 3 max, one per line as label | href</label><textarea value={(item.linkedKeywords ?? []).map((keyword) => `${keyword.label} | ${keyword.href}`).join("\n")} onChange={(event) => updateBlog(index, { linkedKeywords: event.target.value.split("\n").map((line) => { const [label, href] = line.split("|").map((part) => part.trim()); return { label: label ?? "", href: href ?? "" }; }).filter((keyword) => keyword.label && keyword.href).slice(0, 3) })} /></div>
                  <div className="brief-two-col">
                    <div className="field"><label>Media kind</label><select value={item.mediaKind ?? "image"} onChange={(event) => updateBlog(index, { mediaKind: event.target.value as BlogTopic["mediaKind"] })}><option value="image">Image</option><option value="video">Video</option><option value="video-slot">Video slot</option></select></div>
                    <div className="field"><label>Video URL</label><input value={item.videoUrl ?? ""} onChange={(event) => updateBlog(index, { videoUrl: event.target.value })} placeholder="Leave empty to reserve a slot" /></div>
                  </div>
                  <div className="brief-two-col">
                    <div className="field"><label>Image path / poster</label><input value={item.videoPoster ?? item.image} onChange={(event) => updateBlog(index, { videoPoster: event.target.value })} /></div>
                    <div className="field"><label>Image alt</label><input value={item.imageAlt} onChange={(event) => updateBlog(index, { imageAlt: event.target.value })} /></div>
                  </div>
                  <div className="brief-two-col">
                    <div className="field"><label>CTA label</label><input value={item.ctaLabel} onChange={(event) => updateBlog(index, { ctaLabel: event.target.value })} /></div>
                    <div className="field"><label>CTA href</label><input value={item.ctaHref} onChange={(event) => updateBlog(index, { ctaHref: event.target.value })} /></div>
                  </div>
                  <div className="brief-two-col">
                    <div className="field"><label>Order</label><input type="number" value={item.order} onChange={(event) => updateBlog(index, { order: Number(event.target.value) })} /></div>
                    <label className={`option-toggle ${item.active ? "active" : ""}`}><input type="checkbox" checked={item.active} onChange={(event) => updateBlog(index, { active: event.target.checked })} /><span><strong>Active</strong><small>Visible on Blog / Content when wired.</small></span></label>
                  </div>
                  <div className="brief-two-col">
                    <button className="btn danger" type="button" onClick={() => removeBlogTopic(index)}>Delete topic</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {tab === "help" ? (
          <div className="admin-config-stack">
            {content.footerHelpPanels.map((panel, index) => (
              <div className="admin-config-card" key={panel.id}>
                <div className="brief-two-col">
                  <div className="field"><label>Panel title</label><input value={panel.title} onChange={(event) => setContent((current) => ({ ...current, footerHelpPanels: updateByIndex(current.footerHelpPanels, index, { title: event.target.value }) }))} /></div>
                  <div className="field"><label>Order</label><input type="number" value={panel.order} onChange={(event) => setContent((current) => ({ ...current, footerHelpPanels: updateByIndex(current.footerHelpPanels, index, { order: Number(event.target.value) }) }))} /></div>
                </div>
                <div className="field"><label>Description</label><textarea value={panel.description} onChange={(event) => setContent((current) => ({ ...current, footerHelpPanels: updateByIndex(current.footerHelpPanels, index, { description: event.target.value }) }))} /></div>
                <label className={`option-toggle ${panel.active ? "active" : ""}`}><input type="checkbox" checked={panel.active} onChange={(event) => setContent((current) => ({ ...current, footerHelpPanels: updateByIndex(current.footerHelpPanels, index, { active: event.target.checked }) }))} /><span><strong>Active</strong><small>Footer help panel visibility.</small></span></label>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "social" ? (
          <>
            <div className="admin-faq-actions"><button className="btn secondary" type="button" onClick={() => setContent((current) => ({ ...current, socialLinks: [...current.socialLinks, addSocialLink(current.socialLinks.length)] }))}>Add social link</button></div>
            <div className="admin-config-stack">
              {content.socialLinks.map((item, index) => (
                <div className="admin-config-card" key={`${item.href}-${index}`}>
                  <div className="brief-two-col">
                    <div className="field"><label>Platform label</label><input value={item.label} onChange={(event) => updateSocial(index, { label: event.target.value })} /></div>
                    <div className="field"><label>HTTPS URL</label><input value={item.href} onChange={(event) => updateSocial(index, { href: event.target.value })} /></div>
                  </div>
                  <div className="brief-two-col">
                    <div className="field"><label>Order</label><input type="number" value={item.order} onChange={(event) => updateSocial(index, { order: Number(event.target.value) })} /></div>
                    <label className={`option-toggle ${item.active ? "active" : ""}`}><input type="checkbox" checked={item.active} onChange={(event) => updateSocial(index, { active: event.target.checked })} /><span><strong>Active</strong><small>Visible in the public footer social link row.</small></span></label>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
