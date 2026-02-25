"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createTenantProperty,
  deleteTenantProperty,
  listTenantProperties,
  updateTenantProperty,
  uploadTenantPropertyCover,
  uploadTenantPropertyGallery,
} from "@/lib/clientApi";

const blankForm = () => ({
  title: "",
  category: "",
  city: "",
  location: "",
  price: "",
  listingType: "sale",
  status: "published",
  coverPhotoUrl: "",
  description: "",
  propertyId: "",
  bedrooms: 0,
  bathrooms: 0,
  garage: 0,
  area: 0,
  areaUnit: "sqft",
  address: "",
  state: "",
  country: "",
  zip: "",
  videoUrl: "",
  featuresCsv: "",
  documents: [],
});

const normalizeStatus = (value) => {
  const v = String(value || "").toLowerCase();
  if (v === "draft" || v === "published" || v === "archived") return v;
  return "published";
};

const normalizeListingType = (value) => {
  const v = String(value || "").toLowerCase();
  if (v === "sale" || v === "rent" || v === "off_plan") return v;
  return "sale";
};

export default function PropertyManagementPanel() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const [createForm, setCreateForm] = useState(blankForm);
  const [createCoverFile, setCreateCoverFile] = useState(null);
  const [createGalleryFiles, setCreateGalleryFiles] = useState([]);

  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(blankForm);
  const [editCoverFile, setEditCoverFile] = useState(null);
  const [editGalleryFiles, setEditGalleryFiles] = useState([]);

  const token = useMemo(() => {
    try {
      return localStorage.getItem("tenantAuthToken") || "";
    } catch {
      return "";
    }
  }, []);

  const load = async () => {
    if (!token) return;
    setIsLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const properties = await listTenantProperties(token);
      setItems(properties);
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Failed to load properties" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreateChange = (key) => (event) => {
    setCreateForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const onEditChange = (key) => (event) => {
    setEditForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const startEdit = (property) => {
    setEditingId(String(property?._id || property?.id || ""));
    setEditForm({
      title: property?.title || "",
      category: property?.category || "",
      city: property?.city || "",
      location: property?.location || "",
      price: property?.price || "",
      listingType: normalizeListingType(property?.listingType),
      status: normalizeStatus(property?.status),
      coverPhotoUrl: property?.coverPhotoUrl || "",
      description: property?.description || "",

      propertyId: property?.propertyId || "",
      bedrooms: Number(property?.bedrooms || 0),
      bathrooms: Number(property?.bathrooms || 0),
      garage: Number(property?.garage || 0),
      area: Number(property?.area || 0),
      areaUnit: property?.areaUnit || "sqft",
      address: property?.address || "",
      state: property?.state || "",
      country: property?.country || "",
      zip: property?.zip || "",
      videoUrl: property?.videoUrl || "",
      featuresCsv: Array.isArray(property?.features) ? property.features.join(", ") : "",
      documents: Array.isArray(property?.documents) ? property.documents : [],
    });
    setEditCoverFile(null);
    setEditGalleryFiles([]);
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm(blankForm());
    setEditCoverFile(null);
    setEditGalleryFiles([]);
  };

  const doCreate = async () => {
    if (!token) return;
    setIsSaving(true);
    setStatus({ type: "", message: "" });
    try {
      const payload = {
        ...createForm,
        listingType: normalizeListingType(createForm.listingType),
        status: normalizeStatus(createForm.status),
        bedrooms: Number(createForm.bedrooms || 0),
        bathrooms: Number(createForm.bathrooms || 0),
        garage: Number(createForm.garage || 0),
        area: Number(createForm.area || 0),
        documents: Array.isArray(createForm.documents) ? createForm.documents : [],
        features: String(createForm.featuresCsv || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const result = await createTenantProperty(token, payload);
      const property = result?.property;

      if (property && createCoverFile) {
        await uploadTenantPropertyCover(token, property._id, createCoverFile);
      }

      if (property && createGalleryFiles.length) {
        await uploadTenantPropertyGallery(token, property._id, createGalleryFiles);
      }

      setCreateForm(blankForm());
      setCreateCoverFile(null);
      setCreateGalleryFiles([]);
      setStatus({ type: "success", message: "Property created" });
      await load();
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Failed to create property" });
    } finally {
      setIsSaving(false);
    }
  };

  const doSaveEdit = async () => {
    if (!token || !editingId) return;
    setIsSaving(true);
    setStatus({ type: "", message: "" });
    try {
      const payload = {
        ...editForm,
        listingType: normalizeListingType(editForm.listingType),
        status: normalizeStatus(editForm.status),
        bedrooms: Number(editForm.bedrooms || 0),
        bathrooms: Number(editForm.bathrooms || 0),
        garage: Number(editForm.garage || 0),
        area: Number(editForm.area || 0),
        documents: Array.isArray(editForm.documents) ? editForm.documents : [],
        features: String(editForm.featuresCsv || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await updateTenantProperty(token, editingId, payload);
      if (editCoverFile) {
        await uploadTenantPropertyCover(token, editingId, editCoverFile);
      }

      if (editGalleryFiles.length) {
        await uploadTenantPropertyGallery(token, editingId, editGalleryFiles);
      }

      setStatus({ type: "success", message: "Property updated" });
      cancelEdit();
      await load();
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Failed to update property" });
    } finally {
      setIsSaving(false);
    }
  };

  const doDelete = async (id) => {
    if (!token) return;
    const ok = window.confirm("Delete this property? This cannot be undone.");
    if (!ok) return;

    setIsSaving(true);
    setStatus({ type: "", message: "" });
    try {
      await deleteTenantProperty(token, id);
      setStatus({ type: "success", message: "Property deleted" });
      await load();
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Failed to delete property" });
    } finally {
      setIsSaving(false);
    }
  };

  const updateDocument = (mode, index, key, value) => {
    const clean = String(value || "");
    const apply = (prev) => {
      const list = Array.isArray(prev.documents) ? prev.documents : [];
      const next = list.map((doc, idx) => (idx === index ? { ...(doc || {}), [key]: clean } : doc));
      return { ...prev, documents: next };
    };

    if (mode === "create") setCreateForm(apply);
    if (mode === "edit") setEditForm(apply);
  };

  const addDocument = (mode) => {
    const apply = (prev) => {
      const list = Array.isArray(prev.documents) ? prev.documents : [];
      return { ...prev, documents: [...list, { name: "", url: "" }] };
    };
    if (mode === "create") setCreateForm(apply);
    if (mode === "edit") setEditForm(apply);
  };

  const removeDocument = (mode, index) => {
    const apply = (prev) => {
      const list = Array.isArray(prev.documents) ? prev.documents : [];
      return { ...prev, documents: list.filter((_doc, idx) => idx !== index) };
    };
    if (mode === "create") setCreateForm(apply);
    if (mode === "edit") setEditForm(apply);
  };

  const removeGalleryItem = async (property, url) => {
    if (!token) return;
    const id = String(property?._id || property?.id || "");
    if (!id) return;

    const nextGallery = (Array.isArray(property?.gallery) ? property.gallery : []).filter((item) => item !== url);
    setIsSaving(true);
    setStatus({ type: "", message: "" });
    try {
      await updateTenantProperty(token, id, { gallery: nextGallery });
      setStatus({ type: "success", message: "Gallery updated" });
      await load();
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Failed to update gallery" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="ops-loading">Loading properties...</div>;
  }

  return (
    <div className="ops-table-card" style={{ padding: 16 }}>
      <div className="ops-table-head" style={{ borderBottom: "none", padding: 0, marginBottom: 12 }}>
        <div>
          <h3>Property Management</h3>
          <p>Create, edit, and publish your listings. Cover photos upload to MinIO.</p>
        </div>
        <button type="button" className="ops-mini-btn" onClick={load} disabled={isSaving}>
          Refresh
        </button>
      </div>

      <div className="profile-grid" style={{ marginTop: 0 }}>
        <section>
          <h2 className="profile-section-title">Add property</h2>
          <div className="ops-profile-form">
            <input className="ops-input" placeholder="Title" value={createForm.title} onChange={onCreateChange("title")} />
            <input className="ops-input" placeholder="Category (e.g. Villa)" value={createForm.category} onChange={onCreateChange("category")} />
            <input className="ops-input" placeholder="City (e.g. Dubai)" value={createForm.city} onChange={onCreateChange("city")} />
            <input className="ops-input" placeholder="Location (e.g. Dubai Marina)" value={createForm.location} onChange={onCreateChange("location")} />
            <input className="ops-input" placeholder="Price (e.g. AED 2,350,000)" value={createForm.price} onChange={onCreateChange("price")} />

            <select className="ops-input" value={createForm.listingType} onChange={onCreateChange("listingType")}>
              <option value="sale">Sale</option>
              <option value="rent">Rent</option>
              <option value="off_plan">Off-plan</option>
            </select>
            <input className="ops-input" placeholder="Property ID (optional)" value={createForm.propertyId} onChange={onCreateChange("propertyId")} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
              <input className="ops-input" type="number" placeholder="Bedrooms" value={createForm.bedrooms} onChange={onCreateChange("bedrooms")} />
              <input className="ops-input" type="number" placeholder="Bathrooms" value={createForm.bathrooms} onChange={onCreateChange("bathrooms")} />
              <input className="ops-input" type="number" placeholder="Garage" value={createForm.garage} onChange={onCreateChange("garage")} />
              <input className="ops-input" type="number" placeholder="Area" value={createForm.area} onChange={onCreateChange("area")} />
            </div>
            <input className="ops-input" placeholder="Area unit (sqft, sqm)" value={createForm.areaUnit} onChange={onCreateChange("areaUnit")} />

            <input className="ops-input" placeholder="Address" value={createForm.address} onChange={onCreateChange("address")} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
              <input className="ops-input" placeholder="State" value={createForm.state} onChange={onCreateChange("state")} />
              <input className="ops-input" placeholder="Country" value={createForm.country} onChange={onCreateChange("country")} />
            </div>
            <input className="ops-input" placeholder="Zip" value={createForm.zip} onChange={onCreateChange("zip")} />
            <input className="ops-input" placeholder="Video URL (optional)" value={createForm.videoUrl} onChange={onCreateChange("videoUrl")} />

            <select className="ops-input" value={createForm.status} onChange={onCreateChange("status")}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <input className="ops-input" placeholder="Cover Photo URL (optional)" value={createForm.coverPhotoUrl} onChange={onCreateChange("coverPhotoUrl")} />

            <label className="ops-profile-email" style={{ margin: 0 }}>
              Upload cover photo (optional)
              <input
                type="file"
                accept="image/*"
                style={{ display: "block", marginTop: 8 }}
                onChange={(e) => setCreateCoverFile(e.target.files?.[0] || null)}
              />
            </label>

            <label className="ops-profile-email" style={{ margin: 0 }}>
              Upload gallery images (optional)
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: "block", marginTop: 8 }}
                onChange={(e) => setCreateGalleryFiles(Array.from(e.target.files || []))}
              />
            </label>

            <textarea
              className="ops-input"
              style={{ minHeight: 70, resize: "vertical" }}
              placeholder="Features (comma separated)"
              value={createForm.featuresCsv}
              onChange={onCreateChange("featuresCsv")}
            />

            <div className="ops-table-card" style={{ padding: 12 }}>
              <div className="ops-table-head" style={{ borderBottom: "none", padding: 0, marginBottom: 10 }}>
                <div>
                  <h3>Documents</h3>
                  <p>Name + URL</p>
                </div>
                <button type="button" className="ops-mini-btn" onClick={() => addDocument("create")}>
                  + Add
                </button>
              </div>

              {(Array.isArray(createForm.documents) ? createForm.documents : []).map((doc, idx) => (
                <div key={`doc-${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6, marginBottom: 6 }}>
                  <input
                    className="ops-input"
                    placeholder="Document name"
                    value={doc?.name || ""}
                    onChange={(e) => updateDocument("create", idx, "name", e.target.value)}
                  />
                  <input
                    className="ops-input"
                    placeholder="https://..."
                    value={doc?.url || ""}
                    onChange={(e) => updateDocument("create", idx, "url", e.target.value)}
                  />
                  <button type="button" className="ops-mini-btn" onClick={() => removeDocument("create", idx)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <textarea
              className="ops-input"
              style={{ minHeight: 100, resize: "vertical" }}
              placeholder="Description"
              value={createForm.description}
              onChange={onCreateChange("description")}
            />

            <button type="button" className="ops-mini-btn primary" onClick={doCreate} disabled={isSaving}>
              {isSaving ? "Saving..." : "Create"}
            </button>
          </div>
        </section>

        <section>
          <h2 className="profile-section-title">Properties</h2>

          {items.length === 0 ? (
            <article className="empty-state">
              <h3>No properties yet</h3>
              <p>Create your first listing to show it on the website.</p>
            </article>
          ) : (
            <div className="ops-table-grid" style={{ gridTemplateColumns: "1fr" }}>
              {items.map((property) => {
                const id = String(property?._id || property?.id || "");
                const isEditing = id && editingId === id;
                const cover = property?.coverPhotoUrl || "";
                const gallery = Array.isArray(property?.gallery) ? property.gallery : [];

                return (
                  <article key={id} className="ops-table-card" style={{ padding: 14 }}>
                    <div className="ops-table-head" style={{ borderBottom: "none", padding: 0, marginBottom: 10 }}>
                      <div>
                        <h3 style={{ marginBottom: 4 }}>{property?.title || "Untitled"}</h3>
                        <p style={{ margin: 0 }}>{property?.city || ""}{property?.location ? ` · ${property.location}` : ""}{property?.price ? ` · ${property.price}` : ""}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span className="ops-chip">{normalizeStatus(property?.status)}</span>
                        <button type="button" className="ops-mini-btn" onClick={() => (isEditing ? cancelEdit() : startEdit(property))}>
                          {isEditing ? "Close" : "Edit"}
                        </button>
                        <button type="button" className="ops-mini-btn" onClick={() => doDelete(id)} disabled={isSaving}>
                          Delete
                        </button>
                      </div>
                    </div>

                    {cover ? (
                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                        <img src={cover} alt="Cover" style={{ width: 120, height: 72, objectFit: "cover", borderRadius: 10 }} />
                        <div style={{ fontSize: 12, opacity: 0.8, wordBreak: "break-all" }}>{cover}</div>
                      </div>
                    ) : null}

                    {gallery.length ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                        {gallery.slice(0, 12).map((url) => (
                          <div key={url} style={{ position: "relative" }}>
                            <img src={url} alt="Gallery" style={{ width: 72, height: 52, objectFit: "cover", borderRadius: 10 }} />
                            <button
                              type="button"
                              className="ops-mini-btn"
                              style={{ position: "absolute", top: 4, right: 4, padding: "2px 6px" }}
                              onClick={() => removeGalleryItem(property, url)}
                              disabled={isSaving}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {isEditing ? (
                      <div className="ops-profile-form">
                        <input className="ops-input" placeholder="Title" value={editForm.title} onChange={onEditChange("title")} />
                        <input className="ops-input" placeholder="Category" value={editForm.category} onChange={onEditChange("category")} />
                        <input className="ops-input" placeholder="City" value={editForm.city} onChange={onEditChange("city")} />
                        <input className="ops-input" placeholder="Location" value={editForm.location} onChange={onEditChange("location")} />
                        <input className="ops-input" placeholder="Price" value={editForm.price} onChange={onEditChange("price")} />

                        <select className="ops-input" value={editForm.listingType} onChange={onEditChange("listingType")}>
                          <option value="sale">Sale</option>
                          <option value="rent">Rent</option>
                          <option value="off_plan">Off-plan</option>
                        </select>
                        <input className="ops-input" placeholder="Property ID" value={editForm.propertyId} onChange={onEditChange("propertyId")} />

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                          <input className="ops-input" type="number" placeholder="Bedrooms" value={editForm.bedrooms} onChange={onEditChange("bedrooms")} />
                          <input className="ops-input" type="number" placeholder="Bathrooms" value={editForm.bathrooms} onChange={onEditChange("bathrooms")} />
                          <input className="ops-input" type="number" placeholder="Garage" value={editForm.garage} onChange={onEditChange("garage")} />
                          <input className="ops-input" type="number" placeholder="Area" value={editForm.area} onChange={onEditChange("area")} />
                        </div>
                        <input className="ops-input" placeholder="Area unit" value={editForm.areaUnit} onChange={onEditChange("areaUnit")} />

                        <input className="ops-input" placeholder="Address" value={editForm.address} onChange={onEditChange("address")} />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                          <input className="ops-input" placeholder="State" value={editForm.state} onChange={onEditChange("state")} />
                          <input className="ops-input" placeholder="Country" value={editForm.country} onChange={onEditChange("country")} />
                        </div>
                        <input className="ops-input" placeholder="Zip" value={editForm.zip} onChange={onEditChange("zip")} />
                        <input className="ops-input" placeholder="Video URL" value={editForm.videoUrl} onChange={onEditChange("videoUrl")} />

                        <select className="ops-input" value={editForm.status} onChange={onEditChange("status")}>
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>

                        <input className="ops-input" placeholder="Cover Photo URL" value={editForm.coverPhotoUrl} onChange={onEditChange("coverPhotoUrl")} />

                        <label className="ops-profile-email" style={{ margin: 0 }}>
                          Upload new cover photo (optional)
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "block", marginTop: 8 }}
                            onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)}
                          />
                        </label>

                        <label className="ops-profile-email" style={{ margin: 0 }}>
                          Upload gallery images (optional)
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: "block", marginTop: 8 }}
                            onChange={(e) => setEditGalleryFiles(Array.from(e.target.files || []))}
                          />
                        </label>

                        <textarea
                          className="ops-input"
                          style={{ minHeight: 70, resize: "vertical" }}
                          placeholder="Features (comma separated)"
                          value={editForm.featuresCsv}
                          onChange={onEditChange("featuresCsv")}
                        />

                        <div className="ops-table-card" style={{ padding: 12 }}>
                          <div className="ops-table-head" style={{ borderBottom: "none", padding: 0, marginBottom: 10 }}>
                            <div>
                              <h3>Documents</h3>
                              <p>Name + URL</p>
                            </div>
                            <button type="button" className="ops-mini-btn" onClick={() => addDocument("edit")}>
                              + Add
                            </button>
                          </div>

                          {(Array.isArray(editForm.documents) ? editForm.documents : []).map((doc, idx) => (
                            <div key={`edit-doc-${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6, marginBottom: 6 }}>
                              <input
                                className="ops-input"
                                placeholder="Document name"
                                value={doc?.name || ""}
                                onChange={(e) => updateDocument("edit", idx, "name", e.target.value)}
                              />
                              <input
                                className="ops-input"
                                placeholder="https://..."
                                value={doc?.url || ""}
                                onChange={(e) => updateDocument("edit", idx, "url", e.target.value)}
                              />
                              <button type="button" className="ops-mini-btn" onClick={() => removeDocument("edit", idx)}>
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>

                        <textarea
                          className="ops-input"
                          style={{ minHeight: 100, resize: "vertical" }}
                          placeholder="Description"
                          value={editForm.description}
                          onChange={onEditChange("description")}
                        />

                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="button" className="ops-mini-btn primary" onClick={doSaveEdit} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                          <button type="button" className="ops-mini-btn" onClick={cancelEdit} disabled={isSaving}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {status.message ? (
        <p className={`ops-form-status ${status.type === "error" ? "error" : "success"}`}>{status.message}</p>
      ) : null}
    </div>
  );
}
