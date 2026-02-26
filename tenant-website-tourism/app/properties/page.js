import Link from "next/link";
import { getTenantWebsiteData, createPageTitle, getPublicProperties } from "@/lib/serverApi";
import SortSelect from "@/components/SortSelect";

const propertyImages = [
  "https://www.figma.com/api/mcp/asset/eef6bef5-0a2e-4c12-986e-37b52447ae64",
  "https://www.figma.com/api/mcp/asset/96d6474f-fb2f-4e0f-a97a-5e8aaac08da0",
  "https://www.figma.com/api/mcp/asset/66d45dd8-79f3-4b5c-9a3d-fe34565459e7",
];

export async function generateMetadata() {
  const data = await getTenantWebsiteData();
  const tenantName = data?.tenant?.name;
  return {
    title: createPageTitle(tenantName, "Properties"),
    description: "Browse available listings and investment opportunities.",
  };
}

const toNumberFromPrice = (value) => {
  const raw = String(value || "");
  const number = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? number : 0;
};

export default async function PropertiesPage({ searchParams }) {
  await getTenantWebsiteData();
  const allProperties = await getPublicProperties();

  const asList = (value) => {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    const out = [];
    const seen = new Set();
    for (const item of list) {
      const key = String(item || "").trim();
      if (!key) continue;
      const lowered = key.toLowerCase();
      if (seen.has(lowered)) continue;
      seen.add(lowered);
      out.push(key);
    }
    return out;
  };

  const asSingle = (value) => {
    if (Array.isArray(value)) {
      const first = value.find((v) => String(v || "").trim());
      return String(first || "").trim();
    }
    return String(value || "").trim();
  };

  const listingTypeSelected = asSingle(searchParams?.listingType);
  const citySelected = asList(searchParams?.city);
  const categorySelected = asList(searchParams?.category);
  const bedroomsSelected = asList(searchParams?.bedrooms);
  const sortSelected = String(searchParams?.sort || "newest").trim() || "newest";

  const filters = {
    listingType: listingTypeSelected,
    city: citySelected,
    category: categorySelected,
    bedrooms: bedroomsSelected,
    sort: sortSelected,
  };

  const properties = allProperties
    .filter((p) => (filters.listingType ? String(p?.listingType || "sale") === filters.listingType : true))
    .filter((p) => (filters.city.length ? filters.city.includes(String(p?.city || "").trim()) : true))
    .filter((p) => (filters.category.length ? filters.category.includes(String(p?.category || "").trim()) : true))
    .filter((p) => (filters.bedrooms.length ? filters.bedrooms.includes(String(p?.bedrooms || "")) : true));

  const sortedProperties = (() => {
    const list = [...properties];
    if (filters.sort === "price_asc") {
      return list.sort((a, b) => toNumberFromPrice(a?.price) - toNumberFromPrice(b?.price));
    }
    if (filters.sort === "price_desc") {
      return list.sort((a, b) => toNumberFromPrice(b?.price) - toNumberFromPrice(a?.price));
    }
    // newest default
    return list.sort((a, b) => String(b?.createdAt || "").localeCompare(String(a?.createdAt || "")));
  })();

  const counts = (values) => {
    const map = new Map();
    values.forEach((value) => {
      const key = String(value || "").trim();
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  };

  const emirates = counts(allProperties.map((p) => p.city || ""));
  const propertyTypes = counts(allProperties.map((p) => p.category || ""));
  const bedroomCounts = counts(allProperties.map((p) => (p.bedrooms ? String(p.bedrooms) : "")));
  const listingTypeCounts = counts(allProperties.map((p) => String(p?.listingType || "sale")));
  const resultsCount = sortedProperties.length;

  const buildParams = (next = {}) => {
    const params = new URLSearchParams();

    const applyList = (key, list) => {
      const values = Array.isArray(list) ? list : list ? [list] : [];
      values.map((v) => String(v || "").trim()).filter(Boolean).forEach((v) => params.append(key, v));
    };

    const merged = {
      listingType: next.listingType ?? filters.listingType,
      city: next.city ?? filters.city,
      category: next.category ?? filters.category,
      bedrooms: next.bedrooms ?? filters.bedrooms,
      sort: next.sort ?? filters.sort,
    };

    if (merged.listingType) {
      params.set("listingType", String(merged.listingType));
    }
    applyList("city", merged.city);
    applyList("category", merged.category);
    applyList("bedrooms", merged.bedrooms);

    if (merged.sort && merged.sort !== "newest") {
      params.set("sort", merged.sort);
    }

    return params;
  };

  const buildHref = (next) => {
    const params = buildParams(next);
    const qs = params.toString();
    return qs ? `/properties?${qs}` : "/properties";
  };

  const toggleInList = (list, value) => {
    const v = String(value || "").trim();
    if (!v) return list;
    const next = Array.isArray(list) ? [...list] : [];
    const index = next.findIndex((item) => String(item).toLowerCase() === v.toLowerCase());
    if (index >= 0) {
      next.splice(index, 1);
      return next;
    }
    next.push(v);
    return next;
  };

  const isActive = (list, value) => {
    const v = String(value || "").trim().toLowerCase();
    return Array.isArray(list) && list.some((item) => String(item || "").trim().toLowerCase() === v);
  };

  const isListingType = (value) => {
    const v = String(value || "").trim().toLowerCase();
    return v && String(filters.listingType || "").trim().toLowerCase() === v;
  };

  return (
    <div className="property-layout">
      <aside className="filter-panel">
        <Link className="reset-btn" href="/properties">Reset Filteration</Link>

        <div className="filter-group">
          <h4>Listing</h4>
          {(
            listingTypeCounts.length
              ? listingTypeCounts
              : [["sale", resultsCount], ["rent", resultsCount], ["off_plan", resultsCount]]
          )
            .map(([item, count]) => {
              const label = item === "off_plan" ? "Off-plan" : String(item).replace(/^./, (c) => c.toUpperCase());
              return (
                <Link key={item} className="filter-item" href={buildHref({ listingType: item })}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className={`dot${isListingType(item) ? " active" : ""}`} />{label}
                  </span>
                  <span>{count}</span>
                </Link>
              );
            })}
        </div>

        <div className="filter-group">
          <h4>Emirates</h4>
          {(emirates.length ? emirates : [["Dubai", resultsCount]]).slice(0, 8).map(([item, count]) => (
            <Link key={item} className="filter-item" href={buildHref({ city: toggleInList(filters.city, item) })}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className={`dot${isActive(filters.city, item) ? " active" : ""}`} />{item}
              </span>
              <span>{count}</span>
            </Link>
          ))}
        </div>

        <div className="filter-group">
          <h4>Property type</h4>
          {(propertyTypes.length ? propertyTypes : [["Property", resultsCount]]).slice(0, 8).map(([item, count]) => (
            <Link key={item} className="filter-item" href={buildHref({ category: toggleInList(filters.category, item) })}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className={`dot${isActive(filters.category, item) ? " active" : ""}`} />{item}
              </span>
              <span>{count}</span>
            </Link>
          ))}
        </div>

        <div className="filter-group">
          <h4>Number of bedroom</h4>
          {(bedroomCounts.length ? bedroomCounts : [["", resultsCount]]).slice(0, 8).map(([item, count], index) => {
            const label = item ? `${item} bed room` : "-";
            return (
              <Link key={`${item}-${index}`} className="filter-item" href={buildHref({ bedrooms: toggleInList(filters.bedrooms, item) })}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span className={`dot${isActive(filters.bedrooms, item) ? " active" : ""}`} />{label}
                </span>
                <span>{count}</span>
              </Link>
            );
          })}
        </div>

        <div className="filter-group">
          <h4>Initial payment</h4>
          <div className="filter-item"><span>25%</span><span>75%</span></div>
        </div>
      </aside>

      <section>
        <div className="property-topbar">
          <div className="property-results">
            <strong>{resultsCount}</strong>
            <span>Results</span>
          </div>
          <div className="property-sort">
            <div className="toggle-pill">
              <Link className={isListingType("sale") ? "active" : ""} href={buildHref({ listingType: "sale" })}>Sale</Link>
              <Link className={isListingType("rent") ? "active" : ""} href={buildHref({ listingType: "rent" })}>Rent</Link>
              <Link className={isListingType("off_plan") ? "active" : ""} href={buildHref({ listingType: "off_plan" })}>Off-plan</Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span>Sort by</span>
              <SortSelect defaultValue={filters.sort} />
            </div>
          </div>
        </div>

        <div className="property-grid">
          {sortedProperties.length === 0 ? (
            <article className="empty-state">
            <h3>No properties published yet</h3>
              <p>Published listings will appear here automatically.</p>
          </article>
        ) : (
            sortedProperties.map((property, index) => (
              <article key={property._id || property.id} className="property-card">
                <Link
                  href={`/properties/${property._id || property.id}`}
                  className="property-card-overlay"
                  aria-label={`View ${property.title || "property"}`}
                />
                <div
                  className="property-image"
                >
                  <img
                    src={
                      property?.coverPhotoUrl ||
                      (Array.isArray(property?.gallery) ? property.gallery[0] : "") ||
                      propertyImages[index % propertyImages.length]
                    }
                    alt={property?.title ? `${property.title} photo` : "Property photo"}
                    loading={index < 3 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index < 3 ? "high" : "auto"}
                  />
                  <span className="badge">
                    {String(property?.listingType || "sale") === "off_plan"
                      ? "off plan"
                      : String(property?.listingType || "sale")}
                  </span>
                  {index % 3 === 2 ? <span className="badge">featured</span> : null}
                </div>
                <div className="property-info">
                  <h3>{property.title}</h3>
                  <div className="property-sub">{property.location || "Dubai, Jomera"}</div>
                  <div className="property-icons">
                    <span>🛏 {property?.bedrooms || "-"}</span>
                    <span>🛁 {property?.bathrooms || "-"}</span>
                    <span>📐 {property?.area ? `${property.area} ${property.areaUnit || ""}` : "-"}</span>
                    <span className="price">{property.price || "$280,000"}</span>
                  </div>
                  <div className="property-link-row">
                      <Link href="/contact">Request details</Link>
                  </div>
                </div>
            </article>
          ))
        )}
        </div>
      </section>
    </div>
  );
}
