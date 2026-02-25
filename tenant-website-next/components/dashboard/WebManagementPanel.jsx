"use client";

import { useEffect, useState } from "react";
import { getWebsiteSettings, updateWebsiteSettings } from "@/lib/clientApi";

const blankCategory = () => ({ name: "", icon: "", variant: "default", href: "" });
const blankCityOverride = () => ({ city: "", imageUrl: "" });
const blankReview = () => ({ name: "", role: "", rating: 5, text: "", photoUrl: "", videoUrl: "" });

const normalizeWebsite = (raw = {}) => {
  const website = raw && typeof raw === "object" ? raw : {};
  const home = website.home && typeof website.home === "object" ? website.home : {};
  const hero = home.hero && typeof home.hero === "object" ? home.hero : {};
  const stats = home.stats && typeof home.stats === "object" ? home.stats : {};
  const bestDeals = home.bestDeals && typeof home.bestDeals === "object" ? home.bestDeals : {};
  const exploreCities = home.exploreCities && typeof home.exploreCities === "object" ? home.exploreCities : {};
  const marketing = home.marketing && typeof home.marketing === "object" ? home.marketing : {};
  const team = home.team && typeof home.team === "object" ? home.team : {};
  const contact = home.contact && typeof home.contact === "object" ? home.contact : {};
  const location = home.location && typeof home.location === "object" ? home.location : {};

  return {
    heroTitle: website.heroTitle || "",
    heroSubtitle: website.heroSubtitle || "",
    heroButtonText: website.heroButtonText || "",

    contactPhone: website.contactPhone || "",
    contactEmailPrimary: website.contactEmailPrimary || "",
    contactEmailSecondary: website.contactEmailSecondary || "",
    addressLine1: website.addressLine1 || "",
    addressLine2: website.addressLine2 || "",

    aboutLeader1Name: website.aboutLeader1Name || "",
    aboutLeader1Role: website.aboutLeader1Role || "",
    aboutLeader1Quote: website.aboutLeader1Quote || "",
    aboutLeader2Name: website.aboutLeader2Name || "",
    aboutLeader2Role: website.aboutLeader2Role || "",
    aboutLeader2Quote: website.aboutLeader2Quote || "",

    home: {
      hero: {
        imageUrl: hero.imageUrl || "",
        title: hero.title || website.heroTitle || "",
        subtitle: hero.subtitle || website.heroSubtitle || "",
        buttonText: hero.buttonText || website.heroButtonText || "",
        buttonHref: hero.buttonHref || "",
      },
      stats: {
        propertyReady: Number.isFinite(stats.propertyReady) ? stats.propertyReady : 0,
        happyClients: Number.isFinite(stats.happyClients) ? stats.happyClients : 0,
        knownAreas: Number.isFinite(stats.knownAreas) ? stats.knownAreas : 0,
      },
      featuredCategoriesTitle: home.featuredCategoriesTitle || "",
      featuredCategoriesViewAllText: home.featuredCategoriesViewAllText || "",
      featuredCategoriesViewAllHref: home.featuredCategoriesViewAllHref || "",
      featuredCategories: Array.isArray(home.featuredCategories) ? home.featuredCategories : [],
      bestDeals: {
        maxItems: Number.isFinite(bestDeals.maxItems) ? bestDeals.maxItems : 3,
      },
      exploreCities: {
        maxItems: Number.isFinite(exploreCities.maxItems) ? exploreCities.maxItems : 5,
        overrides: Array.isArray(exploreCities.overrides) ? exploreCities.overrides : [],
      },
      marketing: {
        enabled: typeof marketing.enabled === "boolean" ? marketing.enabled : true,
        imageUrl: marketing.imageUrl || "",
        title: marketing.title || "",
        subtitle: marketing.subtitle || "",
        buttonText: marketing.buttonText || "",
        buttonHref: marketing.buttonHref || "",
      },
      team: {
        enabled: typeof team.enabled === "boolean" ? team.enabled : true,
        title: team.title || "",
        subtitle: team.subtitle || "",
        maxItems: Number.isFinite(team.maxItems) ? team.maxItems : 4,
      },
      reviews: Array.isArray(home.reviews) ? home.reviews : [],
      contact: {
        enabled: typeof contact.enabled === "boolean" ? contact.enabled : true,
        title: contact.title || "",
        subtitle: contact.subtitle || "",
      },
      location: {
        googleMapUrl: location.googleMapUrl || "",
      },
    },
  };
};

const setDeep = (obj, path, value) => {
  const keys = Array.isArray(path) ? path : String(path).split(".");
  const next = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cursor = next;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    const current = cursor[key];
    cursor[key] = Array.isArray(current) ? [...current] : { ...(current || {}) };
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
  return next;
};

export default function WebManagementPanel() {
  const [form, setForm] = useState(() => normalizeWebsite({}));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const home = form.home || {};

  useEffect(() => {
    const token = localStorage.getItem("tenantAuthToken");
    if (!token) return;

    getWebsiteSettings(token)
      .then((data) => {
        const website = data?.website || {};
        setForm(normalizeWebsite(website));
      })
      .catch((error) => {
        setStatus({ type: "error", message: error?.message || "Failed to load website settings" });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const onChangePath = (path, options = {}) => (event) => {
    const raw = options.type === "checkbox" ? event.target.checked : event.target.value;
    const value = options.type === "number" ? Number(raw) : raw;
    setForm((prev) => setDeep(prev, path, value));
  };

  const updateListItem = (path, index, key) => (event) => {
    const value = key === "rating" ? Number(event.target.value) : event.target.value;
    setForm((prev) => {
      const list = Array.isArray(path.split(".").reduce((acc, part) => acc?.[part], prev))
        ? path.split(".").reduce((acc, part) => acc?.[part], prev)
        : [];

      const nextList = list.map((item, idx) => (idx === index ? { ...(item || {}), [key]: value } : item));
      return setDeep(prev, path, nextList);
    });
  };

  const addListItem = (path, createItem) => () => {
    setForm((prev) => {
      const list = Array.isArray(path.split(".").reduce((acc, part) => acc?.[part], prev))
        ? path.split(".").reduce((acc, part) => acc?.[part], prev)
        : [];
      return setDeep(prev, path, [...list, createItem()]);
    });
  };

  const removeListItem = (path, index) => () => {
    setForm((prev) => {
      const list = Array.isArray(path.split(".").reduce((acc, part) => acc?.[part], prev))
        ? path.split(".").reduce((acc, part) => acc?.[part], prev)
        : [];
      return setDeep(prev, path, list.filter((_item, idx) => idx !== index));
    });
  };

  const onSave = async () => {
    const token = localStorage.getItem("tenantAuthToken");
    if (!token) return;

    setIsSaving(true);
    setStatus({ type: "", message: "" });
    try {
      const response = await updateWebsiteSettings(token, { website: form });
      setForm(normalizeWebsite(response?.website || form));
      setStatus({ type: "success", message: "Website content saved" });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Failed to save" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="ops-loading">Loading web management...</div>;
  }

  return (
    <div className="ops-table-card" style={{ padding: 16 }}>
      <div className="ops-table-head" style={{ borderBottom: "none", padding: 0, marginBottom: 12 }}>
        <div>
          <h3>Web Management</h3>
          <p>Edit website content for Home, About, and Contact pages</p>
        </div>
        <button type="button" className="ops-mini-btn primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="profile-grid" style={{ marginTop: 0 }}>
        <section>
          <h2 className="profile-section-title">Web Management → Home</h2>

          <details open>
            <summary className="ops-nav-heading" style={{ cursor: "pointer", marginBottom: 8 }}>Section 1 — Hero</summary>
            <div className="ops-profile-form">
              <input className="ops-input" placeholder="Cover photo URL" value={home.hero?.imageUrl || ""} onChange={onChangePath("home.hero.imageUrl")} />
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="ops-mini-btn" onClick={() => setForm((prev) => setDeep(prev, "home.hero.imageUrl", ""))}>
                  Remove cover photo
                </button>
              </div>
              <input className="ops-input" placeholder="Title" value={home.hero?.title || ""} onChange={onChangePath("home.hero.title")} />
              <input className="ops-input" placeholder="Subtitle" value={home.hero?.subtitle || ""} onChange={onChangePath("home.hero.subtitle")} />
              <input className="ops-input" placeholder="Button text" value={home.hero?.buttonText || ""} onChange={onChangePath("home.hero.buttonText")} />
              <input className="ops-input" placeholder="Button link (e.g. /properties)" value={home.hero?.buttonHref || ""} onChange={onChangePath("home.hero.buttonHref")} />
            </div>
          </details>

          <details>
            <summary className="ops-nav-heading" style={{ cursor: "pointer", marginBottom: 8 }}>Section 1 — Stats strip</summary>
            <div className="ops-profile-form">
              <input className="ops-input" type="number" placeholder="Property Ready" value={home.stats?.propertyReady ?? 0} onChange={onChangePath("home.stats.propertyReady", { type: "number" })} />
              <input className="ops-input" type="number" placeholder="Happy Clients" value={home.stats?.happyClients ?? 0} onChange={onChangePath("home.stats.happyClients", { type: "number" })} />
              <input className="ops-input" type="number" placeholder="Known Areas" value={home.stats?.knownAreas ?? 0} onChange={onChangePath("home.stats.knownAreas", { type: "number" })} />
            </div>
          </details>

          <details>
            <summary className="ops-nav-heading" style={{ cursor: "pointer", marginBottom: 8 }}>Section 2 — Featured categories</summary>
            <div className="ops-profile-form">
              <input className="ops-input" placeholder="Section title" value={home.featuredCategoriesTitle || ""} onChange={onChangePath("home.featuredCategoriesTitle")} />
              <input className="ops-input" placeholder="View-all text" value={home.featuredCategoriesViewAllText || ""} onChange={onChangePath("home.featuredCategoriesViewAllText")} />
              <input className="ops-input" placeholder="View-all link (e.g. /properties)" value={home.featuredCategoriesViewAllHref || ""} onChange={onChangePath("home.featuredCategoriesViewAllHref")} />
            </div>

            <div style={{ marginTop: 10 }}>
              <button type="button" className="ops-mini-btn" onClick={addListItem("home.featuredCategories", blankCategory)}>
                + Add category
              </button>
            </div>

            {(Array.isArray(home.featuredCategories) ? home.featuredCategories : []).map((item, index) => (
              <div key={`${item?.name || "category"}-${index}`} className="ops-table-card" style={{ marginTop: 12, padding: 12 }}>
                <div className="ops-profile-form">
                  <input className="ops-input" placeholder="Icon (emoji or short text)" value={item?.icon || ""} onChange={updateListItem("home.featuredCategories", index, "icon")} />
                  <input className="ops-input" placeholder="Name" value={item?.name || ""} onChange={updateListItem("home.featuredCategories", index, "name")} />
                  <select className="ops-input" value={item?.variant || "default"} onChange={updateListItem("home.featuredCategories", index, "variant")}>
                    <option value="default">Default</option>
                    <option value="active">Active</option>
                    <option value="muted">Muted</option>
                  </select>
                  <input className="ops-input" placeholder="Link (optional)" value={item?.href || ""} onChange={updateListItem("home.featuredCategories", index, "href")} />
                </div>
                <button type="button" className="ops-mini-btn" onClick={removeListItem("home.featuredCategories", index)}>
                  Remove
                </button>
              </div>
            ))}
          </details>

          <details>
            <summary className="ops-nav-heading" style={{ cursor: "pointer", marginBottom: 8 }}>Section 3 — Discover our best deals</summary>
            <div className="ops-profile-form">
              <input className="ops-input" type="number" placeholder="Max featured properties" value={home.bestDeals?.maxItems ?? 3} onChange={onChangePath("home.bestDeals.maxItems", { type: "number" })} />
              <p className="ops-profile-email" style={{ margin: 0 }}>
                This section automatically shows published properties from your DB.
              </p>
            </div>
          </details>

          <details>
            <summary className="ops-nav-heading" style={{ cursor: "pointer", marginBottom: 8 }}>Section 4 — Explore cities</summary>
            <div className="ops-profile-form">
              <input className="ops-input" type="number" placeholder="Max cities" value={home.exploreCities?.maxItems ?? 5} onChange={onChangePath("home.exploreCities.maxItems", { type: "number" })} />
              <p className="ops-profile-email" style={{ margin: 0 }}>
                Cities are derived from published properties (city/location). You can optionally override cover photos per city below.
              </p>
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="button" className="ops-mini-btn" onClick={addListItem("home.exploreCities.overrides", blankCityOverride)}>
                + Add city cover override
              </button>
            </div>
            {(Array.isArray(home.exploreCities?.overrides) ? home.exploreCities.overrides : []).map((item, index) => (
              <div key={`${item?.city || "city"}-${index}`} className="ops-table-card" style={{ marginTop: 12, padding: 12 }}>
                <div className="ops-profile-form">
                  <input className="ops-input" placeholder="City name" value={item?.city || ""} onChange={updateListItem("home.exploreCities.overrides", index, "city")} />
                  <input className="ops-input" placeholder="Cover photo URL" value={item?.imageUrl || ""} onChange={updateListItem("home.exploreCities.overrides", index, "imageUrl")} />
                </div>
                <button type="button" className="ops-mini-btn" onClick={removeListItem("home.exploreCities.overrides", index)}>
                  Remove
                </button>
              </div>
            ))}
          </details>

          <details>
            <summary className="ops-nav-heading" style={{ cursor: "pointer", marginBottom: 8 }}>Section 5 — Marketing</summary>
            <div className="ops-profile-form">
              <label className="checkbox-row" style={{ alignItems: "center" }}>
                <input type="checkbox" checked={Boolean(home.marketing?.enabled)} onChange={onChangePath("home.marketing.enabled", { type: "checkbox" })} />
                <span>Show this section</span>
              </label>
              <input className="ops-input" placeholder="Photo URL" value={home.marketing?.imageUrl || ""} onChange={onChangePath("home.marketing.imageUrl")} />
              <input className="ops-input" placeholder="Title" value={home.marketing?.title || ""} onChange={onChangePath("home.marketing.title")} />
              <textarea className="ops-input" style={{ minHeight: 90, resize: "vertical" }} placeholder="Subtitle" value={home.marketing?.subtitle || ""} onChange={onChangePath("home.marketing.subtitle")} />
              <input className="ops-input" placeholder="Button text" value={home.marketing?.buttonText || ""} onChange={onChangePath("home.marketing.buttonText")} />
              <input className="ops-input" placeholder="Button link" value={home.marketing?.buttonHref || ""} onChange={onChangePath("home.marketing.buttonHref")} />
            </div>
          </details>

          <details>
            <summary className="ops-nav-heading" style={{ cursor: "pointer", marginBottom: 8 }}>Section 6 — Meet our team expert</summary>
            <div className="ops-profile-form">
              <label className="checkbox-row" style={{ alignItems: "center" }}>
                <input type="checkbox" checked={Boolean(home.team?.enabled)} onChange={onChangePath("home.team.enabled", { type: "checkbox" })} />
                <span>Show this section</span>
              </label>
              <input className="ops-input" placeholder="Section title" value={home.team?.title || ""} onChange={onChangePath("home.team.title")} />
              <input className="ops-input" placeholder="Section subtitle (optional)" value={home.team?.subtitle || ""} onChange={onChangePath("home.team.subtitle")} />
              <input className="ops-input" type="number" placeholder="Max agents" value={home.team?.maxItems ?? 4} onChange={onChangePath("home.team.maxItems", { type: "number" })} />
              <p className="ops-profile-email" style={{ margin: 0 }}>
                This section automatically shows active agents from your DB.
              </p>
            </div>
          </details>

          <details>
            <summary className="ops-nav-heading" style={{ cursor: "pointer", marginBottom: 8 }}>Section 7 — Customer reviews</summary>
            <div style={{ marginTop: 10 }}>
              <button type="button" className="ops-mini-btn" onClick={addListItem("home.reviews", blankReview)}>
                + Add review
              </button>
            </div>
            {(Array.isArray(home.reviews) ? home.reviews : []).map((item, index) => (
              <div key={`${item?.name || "review"}-${index}`} className="ops-table-card" style={{ marginTop: 12, padding: 12 }}>
                <div className="ops-profile-form">
                  <input className="ops-input" placeholder="Customer name" value={item?.name || ""} onChange={updateListItem("home.reviews", index, "name")} />
                  <input className="ops-input" placeholder="Role (optional)" value={item?.role || ""} onChange={updateListItem("home.reviews", index, "role")} />
                  <input className="ops-input" type="number" min="1" max="5" placeholder="Rating (1-5)" value={item?.rating ?? 5} onChange={updateListItem("home.reviews", index, "rating")} />
                  <textarea className="ops-input" style={{ minHeight: 90, resize: "vertical" }} placeholder="Review text" value={item?.text || ""} onChange={updateListItem("home.reviews", index, "text")} />
                  <input className="ops-input" placeholder="Customer photo URL (optional)" value={item?.photoUrl || ""} onChange={updateListItem("home.reviews", index, "photoUrl")} />
                  <input className="ops-input" placeholder="Video URL (optional)" value={item?.videoUrl || ""} onChange={updateListItem("home.reviews", index, "videoUrl")} />
                </div>
                <button type="button" className="ops-mini-btn" onClick={removeListItem("home.reviews", index)}>
                  Remove
                </button>
              </div>
            ))}
          </details>

          <details>
            <summary className="ops-nav-heading" style={{ cursor: "pointer", marginBottom: 8 }}>Section 8 — Contact us</summary>
            <div className="ops-profile-form">
              <label className="checkbox-row" style={{ alignItems: "center" }}>
                <input type="checkbox" checked={Boolean(home.contact?.enabled)} onChange={onChangePath("home.contact.enabled", { type: "checkbox" })} />
                <span>Show this section</span>
              </label>
              <input className="ops-input" placeholder="Title" value={home.contact?.title || ""} onChange={onChangePath("home.contact.title")} />
              <input className="ops-input" placeholder="Subtitle" value={home.contact?.subtitle || ""} onChange={onChangePath("home.contact.subtitle")} />

              <hr style={{ opacity: 0.15, width: "100%" }} />

              <input className="ops-input" placeholder="Phone" value={form.contactPhone} onChange={onChangePath("contactPhone")} />
              <input className="ops-input" placeholder="Primary Email" value={form.contactEmailPrimary} onChange={onChangePath("contactEmailPrimary")} />
              <input className="ops-input" placeholder="Secondary Email" value={form.contactEmailSecondary} onChange={onChangePath("contactEmailSecondary")} />
              <input className="ops-input" placeholder="Address line 1" value={form.addressLine1} onChange={onChangePath("addressLine1")} />
              <input className="ops-input" placeholder="Address line 2" value={form.addressLine2} onChange={onChangePath("addressLine2")} />
            </div>
          </details>

          <details>
            <summary className="ops-nav-heading" style={{ cursor: "pointer", marginBottom: 8 }}>Section 9 — Location (Google maps link)</summary>
            <div className="ops-profile-form">
              <input className="ops-input" placeholder="Google map link or embed URL" value={home.location?.googleMapUrl || ""} onChange={onChangePath("home.location.googleMapUrl")} />
            </div>
          </details>
        </section>

        <section>
          <h2 className="profile-section-title">About page (optional)</h2>
          <div className="ops-profile-form">
            <input className="ops-input" placeholder="Leader 1 name" value={form.aboutLeader1Name} onChange={onChangePath("aboutLeader1Name")} />
            <input className="ops-input" placeholder="Leader 1 role" value={form.aboutLeader1Role} onChange={onChangePath("aboutLeader1Role")} />
            <textarea className="ops-input" style={{ minHeight: 90, resize: "vertical" }} placeholder="Leader 1 quote" value={form.aboutLeader1Quote} onChange={onChangePath("aboutLeader1Quote")} />

            <input className="ops-input" placeholder="Leader 2 name" value={form.aboutLeader2Name} onChange={onChangePath("aboutLeader2Name")} />
            <input className="ops-input" placeholder="Leader 2 role" value={form.aboutLeader2Role} onChange={onChangePath("aboutLeader2Role")} />
            <textarea className="ops-input" style={{ minHeight: 90, resize: "vertical" }} placeholder="Leader 2 quote" value={form.aboutLeader2Quote} onChange={onChangePath("aboutLeader2Quote")} />
          </div>
        </section>
      </div>

      {status.message ? (
        <p className={`ops-form-status ${status.type === "error" ? "error" : "success"}`}>{status.message}</p>
      ) : null}
    </div>
  );
}
