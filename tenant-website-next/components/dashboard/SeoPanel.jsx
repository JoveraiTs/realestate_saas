"use client";

import { useEffect, useState } from "react";
import { getWebsiteSettings, updateWebsiteSettings } from "@/lib/clientApi";

export default function SeoPanel() {
  const [form, setForm] = useState({ title: "", description: "", keywords: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    const token = localStorage.getItem("tenantAuthToken");
    if (!token) return;

    getWebsiteSettings(token)
      .then((data) => {
        const seo = data?.seo || {};
        setForm({
          title: seo.title || "",
          description: seo.description || "",
          keywords: Array.isArray(seo.keywords) ? seo.keywords.join(", ") : "",
        });
      })
      .catch((error) => {
        setStatus({ type: "error", message: error?.message || "Failed to load SEO" });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const onSave = async () => {
    const token = localStorage.getItem("tenantAuthToken");
    if (!token) return;

    setIsSaving(true);
    setStatus({ type: "", message: "" });
    try {
      await updateWebsiteSettings(token, {
        seo: {
          title: form.title,
          description: form.description,
          keywords: form.keywords,
        },
      });
      setStatus({ type: "success", message: "SEO saved" });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Failed to save SEO" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="ops-loading">Loading SEO...</div>;
  }

  return (
    <div className="ops-table-card" style={{ padding: 16 }}>
      <div className="ops-table-head" style={{ borderBottom: "none", padding: 0, marginBottom: 12 }}>
        <div>
          <h3>SEO</h3>
          <p>Update metadata used across the website</p>
        </div>
        <button type="button" className="ops-mini-btn primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="ops-profile-form">
        <input
          className="ops-input"
          placeholder="SEO Title"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
        />
        <textarea
          className="ops-input"
          style={{ minHeight: 90, resize: "vertical" }}
          placeholder="SEO Description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <input
          className="ops-input"
          placeholder="SEO Keywords (comma separated)"
          value={form.keywords}
          onChange={(e) => setForm((prev) => ({ ...prev, keywords: e.target.value }))}
        />
      </div>

      {status.message ? (
        <p className={`ops-form-status ${status.type === "error" ? "error" : "success"}`}>{status.message}</p>
      ) : null}
    </div>
  );
}
