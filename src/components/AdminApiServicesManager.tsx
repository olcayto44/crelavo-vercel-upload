"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminCredentialFields } from "@/components/AdminCredentialFields";
import { adminApiHeaders } from "@/lib/admin-client-auth";
import { apiServiceGroups as defaultApiServiceGroups, type ApiService, type ApiServiceGroup } from "@/lib/api-services";
import { createCustomApiService, createCustomApiServiceGroup, normalizeApiServicesConfig } from "@/lib/api-services-config";
import { supabaseBrowser } from "@/lib/supabase";

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `custom-api-service-${Date.now()}`;
}

function updateService(groups: ApiServiceGroup[], groupIndex: number, serviceIndex: number, updates: Partial<ApiService>) {
  return groups.map((group, index) => {
    if (index !== groupIndex) return group;
    return {
      ...group,
      services: group.services.map((service, innerIndex) => innerIndex === serviceIndex ? { ...service, ...updates } : service)
    };
  });
}

function updateGroup(groups: ApiServiceGroup[], groupIndex: number, updates: Partial<ApiServiceGroup>) {
  return groups.map((group, index) => index === groupIndex ? { ...group, ...updates } : group);
}

export function AdminApiServicesManager({ initialGroups = defaultApiServiceGroups }: { initialGroups?: ApiServiceGroup[] }) {
  const [groups, setGroups] = useState<ApiServiceGroup[]>(initialGroups);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const defaultGroupTitles = useMemo(() => new Set(defaultApiServiceGroups.map((group) => group.title)), []);
  const selectedGroup = groups[selectedGroupIndex] ?? groups[0];
  const selectedService = selectedGroup?.services[selectedServiceIndex] ?? selectedGroup?.services[0];
  const serviceCount = groups.flatMap((group) => group.services).length;

  useEffect(() => {
    async function loadAdminEmail() {
      const { data } = await supabaseBrowser().auth.getUser();
      const email = data.user?.email ?? "";
      if (email) setAdminEmail(email);
    }
    loadAdminEmail();
  }, []);

  function selectGroup(index: number) {
    setSelectedGroupIndex(index);
    setSelectedServiceIndex(0);
  }

  function changeGroup(updates: Partial<ApiServiceGroup>) {
    setGroups((current) => updateGroup(current, selectedGroupIndex, updates));
  }

  function changeService(updates: Partial<ApiService>) {
    setGroups((current) => updateService(current, selectedGroupIndex, selectedServiceIndex, updates));
  }

  function addGroup() {
    const group = createCustomApiServiceGroup();
    setGroups((current) => [...current, group]);
    setSelectedGroupIndex(groups.length);
    setSelectedServiceIndex(0);
    setMessage("New API service group added locally. Edit fields and save.");
    setState("idle");
  }

  function addService() {
    if (!selectedGroup) return;
    const service = createCustomApiService();
    setGroups((current) => current.map((group, index) => index === selectedGroupIndex ? { ...group, services: [...group.services, service] } : group));
    setSelectedServiceIndex(selectedGroup.services.length);
    setMessage("New API service card added locally. Add image, copy and save.");
    setState("idle");
  }

  function deleteService() {
    if (!selectedGroup || !selectedService) return;
    if (selectedGroup.services.length <= 1) {
      setMessage("Each group should keep at least one service card. Delete the whole custom group instead if needed.");
      setState("error");
      return;
    }
    setGroups((current) => current.map((group, index) => index === selectedGroupIndex ? { ...group, services: group.services.filter((_, innerIndex) => innerIndex !== selectedServiceIndex) } : group));
    setSelectedServiceIndex(0);
  }

  function deleteGroup() {
    if (!selectedGroup) return;
    if (defaultGroupTitles.has(selectedGroup.title)) {
      setMessage("Default API groups cannot be deleted, but their card copy and image paths can be edited.");
      setState("error");
      return;
    }
    const nextGroups = groups.filter((_, index) => index !== selectedGroupIndex);
    setGroups(nextGroups.length ? nextGroups : defaultApiServiceGroups);
    setSelectedGroupIndex(0);
    setSelectedServiceIndex(0);
  }

  async function loadGroups() {
    setState("loading");
    setMessage("");
    const response = await fetch("/api/admin/api-services", { headers: adminApiHeaders(adminEmail, adminToken) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "API services could not be loaded.");
      return;
    }
    const nextGroups = normalizeApiServicesConfig(data.apiServiceGroups);
    setGroups(nextGroups);
    setSelectedGroupIndex(0);
    setSelectedServiceIndex(0);
    setState("success");
    setMessage(data.fallback ? "Default API service cards loaded." : "API service cards loaded from admin config.");
  }

  async function saveGroups() {
    setState("loading");
    setMessage("");
    const response = await fetch("/api/admin/api-services", {
      method: "POST",
      headers: adminApiHeaders(adminEmail, adminToken, { "Content-Type": "application/json" }),
      body: JSON.stringify({ apiServiceGroups: groups })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("error");
      setMessage(data.error ?? "API services could not be saved.");
      return;
    }
    setGroups(normalizeApiServicesConfig(data.apiServiceGroups));
    setState("success");
    setMessage("API service cards saved. The API documentation service cards now read this admin config.");
  }

  return (
    <div className="admin-faq-manager admin-service-pages-manager">
      <aside className="admin-faq-list">
        <AdminCredentialFields adminEmail={adminEmail} adminToken={adminToken} onAdminEmailChange={setAdminEmail} onAdminTokenChange={setAdminToken} />
        <div className="admin-faq-actions"><button className="btn secondary" type="button" onClick={loadGroups} disabled={state === "loading"}>Load</button><button className="btn" type="button" onClick={saveGroups} disabled={state === "loading"}>Save</button></div>
        <div className="admin-faq-actions"><button className="btn secondary" type="button" onClick={addGroup}>Add group</button><button className="btn secondary" type="button" onClick={addService}>Add service card</button></div>
        <div className="admin-faq-actions"><button className="btn danger" type="button" onClick={deleteService}>Delete service</button><button className="btn danger" type="button" onClick={deleteGroup}>Delete custom group</button></div>
        <div className="admin-info-grid" style={{ marginTop: 12 }}>
          <div><span>Groups</span><strong>{groups.length}</strong><small>API card groups</small></div>
          <div><span>Cards</span><strong>{serviceCount}</strong><small>Visible service cards</small></div>
        </div>
        <div className="admin-config-stack">
          {groups.map((group, groupIndex) => (
            <div className="admin-config-card" key={`${group.title}-${groupIndex}`}>
              <button className={`admin-inline-select ${groupIndex === selectedGroupIndex ? "active" : ""}`} type="button" onClick={() => selectGroup(groupIndex)}><b>{group.title}</b><small>{group.services.length} service cards</small></button>
              <div className="admin-config-stack" style={{ marginTop: 8 }}>
                {group.services.map((service, serviceIndex) => <button className={`admin-inline-select ${groupIndex === selectedGroupIndex && serviceIndex === selectedServiceIndex ? "active" : ""}`} type="button" onClick={() => { setSelectedGroupIndex(groupIndex); setSelectedServiceIndex(serviceIndex); }} key={`${service.slug}-${serviceIndex}`}><b>{service.name}</b><small>#{service.slug}</small></button>)}
              </div>
            </div>
          ))}
        </div>
        {message ? <p className={`form-message ${state}`}>{message}</p> : null}
      </aside>

      {selectedGroup && selectedService ? (
        <section className="admin-faq-editor admin-service-pages-editor">
          <div className="admin-config-card">
            <span className="badge">API documentation cards</span>
            <h3>Service card image rule</h3>
            <p style={{ color: "var(--muted)", marginTop: 0 }}>Recommended image size: 16:9 ratio, 1200×675 px or 960×540 px. Use JPG, PNG, WebP or SVG. Put local images under /public and enter paths like /blog/example.svg, or paste a full https image URL.</p>
          </div>

          <div className="admin-config-card">
            <span className="badge">Group</span>
            <div className="brief-two-col"><div className="field"><label>Group title</label><input value={selectedGroup.title} onChange={(event) => changeGroup({ title: event.target.value })} /></div><div className="field"><label>Group description</label><input value={selectedGroup.description} onChange={(event) => changeGroup({ description: event.target.value })} /></div></div>
          </div>

          <div className="admin-config-card">
            <span className="badge">Selected service card</span>
            <div className="brief-two-col"><div className="field"><label>Service name</label><input value={selectedService.name} onChange={(event) => changeService({ name: event.target.value })} /></div><div className="field"><label>Anchor slug</label><input value={selectedService.slug} onChange={(event) => changeService({ slug: normalizeSlug(event.target.value) })} /></div></div>
            <div className="field"><label>Card summary / title</label><textarea value={selectedService.summary} onChange={(event) => changeService({ summary: event.target.value })} /></div>
            <div className="field"><label>Use case text</label><textarea value={selectedService.useCase} onChange={(event) => changeService({ useCase: event.target.value })} /></div>
            <div className="field"><label>Image path or URL</label><input value={selectedService.image} onChange={(event) => changeService({ image: event.target.value })} placeholder="/blog/example.svg or https://..." /></div>
            <div className="field"><label>Image alt text</label><input value={selectedService.alt} onChange={(event) => changeService({ alt: event.target.value })} /></div>
            <div className="api-service-image-wrap" style={{ marginTop: 12, maxWidth: 520 }}>
              <img alt={selectedService.alt} className="api-service-image" src={selectedService.image} />
            </div>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>Public anchor will be: /api-documentation#api-{selectedService.slug}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
