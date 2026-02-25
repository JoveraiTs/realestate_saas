import LeadForm from "@/components/LeadForm";
import { getTenantWebsiteData, createPageTitle } from "@/lib/serverApi";

const CONTACT_MAP_IMAGE = "https://www.figma.com/api/mcp/asset/cfb29226-79dc-49d5-b2ce-ea35095adb20";

export async function generateMetadata() {
  const data = await getTenantWebsiteData();
  const tenantName = data?.tenant?.name;
  return {
    title: createPageTitle(tenantName, "Contact"),
    description: "Contact our property team and submit your inquiry.",
  };
}

export default async function ContactPage() {
  const data = await getTenantWebsiteData();
  const website = data?.tenant?.website || {};
  const googleMapUrl = website?.home?.location?.googleMapUrl || "";

  const phone = website.contactPhone || "+1012 3456 789";
  const email1 = website.contactEmailPrimary || "osama@vanguardproperty.ae";
  const email2 = website.contactEmailSecondary || "malcolm@vanguardproperty.ae";
  const address1 = website.addressLine1 || "Emirates Islamic Bank Building";
  const address2 = website.addressLine2 || "5th Floor, Al Nakheel, Ras al Khaimah";

  return (
    <div className="contact-layout">
      <section className="contact-form-card">
        <h1>Contact US</h1>
        <p className="contact-subtitle">Our friendly team would love to hear from you.</p>
        <LeadForm sourcePage="contact" />
        <div className="contact-meta">
          <div>
            <strong>{phone}</strong>
            <div className="contact-meta-line">{phone}</div>
          </div>
          <div>
            <strong>{email1}</strong>
            <div className="contact-meta-line">{email2}</div>
          </div>
          <div>
            <strong>{address1}</strong>
            <div className="contact-meta-line">{address2}</div>
          </div>
        </div>
      </section>

      <section className="contact-map-large" aria-label="Map">
        {googleMapUrl && googleMapUrl.includes("google.com/maps") ? (
          googleMapUrl.includes("/maps/embed") ? (
            <iframe
              title="Map"
              src={googleMapUrl}
              className="contact-map-img"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <a className="fill-btn" href={googleMapUrl} target="_blank" rel="noreferrer">Open location</a>
          )
        ) : (
          <img src={CONTACT_MAP_IMAGE} alt="Map" className="contact-map-img" />
        )}
      </section>
    </div>
  );
}
