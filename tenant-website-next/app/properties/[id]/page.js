import Link from "next/link";
import { getTenantWebsiteData, createPageTitle, getPublicPropertyById } from "@/lib/serverApi";
import PropertyContactCard from "@/components/PropertyContactCard";
import MortgageCalculator from "@/components/MortgageCalculator";

export async function generateMetadata({ params }) {
  const data = await getTenantWebsiteData();
  const tenantName = data?.tenant?.name;
  const property = await getPublicPropertyById(params?.id);
  const title = property?.title ? `${property.title} | ${tenantName || "Real Estate"}` : createPageTitle(tenantName, "Property");

  return {
    title,
    description: property?.description || "Property details and inquiry.",
  };
}

export default async function PropertyDetailsPage({ params }) {
  const data = await getTenantWebsiteData();
  const website = data?.tenant?.website || {};
  const googleMapUrl = website?.home?.location?.googleMapUrl || "";
  const property = await getPublicPropertyById(params?.id);

  if (!property) {
    return (
      <div className="section">
        <article className="empty-state">
          <h3>Property not found</h3>
          <p>This listing may be unavailable or unpublished.</p>
          <Link className="fill-btn" href="/properties">Back to properties</Link>
        </article>
      </div>
    );
  }


  const cover = property?.coverPhotoUrl || (Array.isArray(property?.gallery) ? property.gallery[0] : "");
  const gallery = Array.isArray(property?.gallery) ? property.gallery.filter(Boolean) : [];
  const thumbs = (gallery.length ? gallery : cover ? [cover] : []).slice(0, 4);
  while (thumbs.length < 4 && cover) thumbs.push(cover);

  const beds = Number(property?.bedrooms || 0);
  const baths = Number(property?.bathrooms || 0);
  const area = Number(property?.area || 0);
  const areaUnit = property?.areaUnit || "sqft";

  const documents = Array.isArray(property?.documents) ? property.documents.filter((d) => d?.name && d?.url) : [];
  const features = Array.isArray(property?.features) ? property.features.filter(Boolean) : [];

  return (
    <div className="sp-wrap">
      <div className="sp-top">
        <div>
          <h1 className="sp-title">{property.title}</h1>
          <div className="sp-meta">
            <span>🛏 {beds || "-"}</span>
            <span>🛁 {baths || "-"}</span>
            <span>📐 {area ? `${area}` : "-"}</span>
          </div>
        </div>

        <div className="sp-price">
          <p className="sp-price-main">{property.price || ""}</p>
          <p className="sp-price-sub">EST Mortgage</p>
        </div>
      </div>

      <div className="sp-gallery">
        <div className="sp-main-image" style={{ backgroundImage: cover ? `url(${cover})` : "none" }}>
          {property?.videoUrl ? (
            <a className="sp-play" href={property.videoUrl} target="_blank" rel="noreferrer" aria-label="Play video" />
          ) : null}
        </div>
        <div className="sp-thumbs">
          {thumbs.map((url, idx) => (
            <div key={`${url}-${idx}`} className="sp-thumb" style={{ backgroundImage: `url(${url})` }} />
          ))}
        </div>
      </div>

      <div className="sp-content">
        <div className="sp-left">
          <div className="sp-card">
            <h3 className="sp-card-title">Describition</h3>
            <p className="sp-text">{property.description || ""}</p>
            {property.description ? <p className="sp-readmore">Read More</p> : null}
          </div>

          {documents.length ? (
            <div className="sp-card" style={{ marginTop: 16 }}>
              <h3 className="sp-card-title">Documents</h3>
              <div className="sp-docs">
                {documents.map((doc) => (
                  <div key={doc.url} className="sp-doc">
                    <span className="sp-doc-name">📄 {doc.name}</span>
                    <a className="sp-doc-link" href={doc.url} target="_blank" rel="noreferrer">Download</a>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="sp-card" style={{ marginTop: 16 }}>
            <h3 className="sp-card-title">Property Details</h3>
            <div className="sp-kv">
              <div><span>Property ID</span><strong>{property.propertyId || "-"}</strong></div>
              <div><span>Price</span><strong>{property.price || "-"}</strong></div>
              <div><span>Property Type</span><strong>{property.category || "-"}</strong></div>
              <div><span>Property status</span><strong>{property.status || "-"}</strong></div>
              <div><span>Bedrooms</span><strong>{beds || "-"}</strong></div>
              <div><span>Bathroom</span><strong>{baths || "-"}</strong></div>
              <div><span>Garage</span><strong>{Number(property.garage || 0) || "-"}</strong></div>
              <div><span>Area</span><strong>{area ? `${area} ${areaUnit}` : "-"}</strong></div>
            </div>
          </div>

          <div className="sp-card" style={{ marginTop: 16 }}>
            <h3 className="sp-card-title">Property Location</h3>
            <div className="sp-kv">
              <div><span>City</span><strong>{property.city || "-"}</strong></div>
              <div><span>Address</span><strong>{property.address || property.location || "-"}</strong></div>
              <div><span>State / Country</span><strong>{[property.state, property.country].filter(Boolean).join(", ") || "-"}</strong></div>
              <div><span>Zip</span><strong>{property.zip || "-"}</strong></div>
            </div>
          </div>

          <div className="sp-card" style={{ marginTop: 16 }}>
            <h3 className="sp-card-title">Features</h3>
            {features.length ? (
              <div className="sp-features">
                {features.slice(0, 12).map((name) => (
                  <div key={name} className="sp-feature">{name}</div>
                ))}
              </div>
            ) : (
              <p className="sp-text">No features added yet.</p>
            )}
          </div>
        </div>

        <div className="sp-right">
          <PropertyContactCard sourcePage={`property:${property._id || property.id}`} />

          <div className="sp-card" style={{ marginTop: 16 }}>
            <h3 className="sp-card-title">Location</h3>
            <div className="sp-location">
              {googleMapUrl && googleMapUrl.includes("google.com/maps") ? (
                googleMapUrl.includes("/maps/embed") ? (
                  <iframe
                    title="Map"
                    src={googleMapUrl}
                    className="sp-map"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <a className="fill-btn" href={googleMapUrl} target="_blank" rel="noreferrer">Open location</a>
                )
              ) : (
                <div className="sp-map sp-map-fallback">Map not configured</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MortgageCalculator currency="AED" />

      <div style={{ marginTop: 22 }}>
        <Link className="fill-btn" href="/properties">Back to properties</Link>
      </div>
    </div>
  );
}
