import { getTenantWebsiteData, createPageTitle } from "@/lib/serverApi";

const ABOUT_IMAGE_1 = "https://www.figma.com/api/mcp/asset/75d8d538-2b3a-452f-9d7d-64470ba23aab";
const ABOUT_IMAGE_2 = "https://www.figma.com/api/mcp/asset/db917eb5-987e-4cc0-a26b-9e4c452825ea";

export async function generateMetadata() {
  const data = await getTenantWebsiteData();
  const tenantName = data?.tenant?.name;
  return {
    title: createPageTitle(tenantName, "About"),
    description: "Learn about our market expertise, service model, and client approach.",
  };
}

export default async function AboutPage() {
  const data = await getTenantWebsiteData();
  const tenantName = data?.tenant?.name || "Vanguard Properties";
  const website = data?.tenant?.website || {};

  const leader1Name = website.aboutLeader1Name || "Malcolm Naidoo";
  const leader1Role = website.aboutLeader1Role || "CEO & Founder";
  const leader1Quote = website.aboutLeader1Quote ||
    `“I founded ${tenantName} to create a real estate company that puts people and long-term value ahead of short-term transactions.
            Years in the Ras Al Khaimah market taught me that listening carefully is the key to every successful journey.”`;

  const leader2Name = website.aboutLeader2Name || "Dr. Osama Siddiqui";
  const leader2Role = website.aboutLeader2Role || "Head of Sales";
  const leader2Quote = website.aboutLeader2Quote ||
    `“At ${tenantName}, our focus is on creating clarity. I believe clients deserve transparent guidance and practical advice
            grounded in real market experience.”`;

  return (
    <div className="about-stack">
      <section className="about-card">
        <div className="about-image first" style={{ ["--about-photo"]: `url(${ABOUT_IMAGE_1})` }} />
        <div className="about-copy">
          <h2>{leader1Name} {leader1Role}</h2>
          <p>{leader1Quote}</p>
          <button className="fill-btn" type="button">Read More</button>
        </div>
      </section>

      <section className="about-note">
        <h3>Understanding the Real Estate Market</h3>
        <p>
          My experience has taught me that successful real estate decisions come from understanding the market deeply,
          listening carefully to clients, and always acting in their best interest.
        </p>
      </section>

      <section className="about-card reverse">
        <div className="about-image second" style={{ ["--about-photo"]: `url(${ABOUT_IMAGE_2})` }} />
        <div className="about-copy">
          <h2>{leader2Name} {leader2Role}</h2>
          <p>{leader2Quote}</p>
          <button className="fill-btn" type="button">Read More</button>
        </div>
      </section>

      <section className="about-note">
        <h3>Understanding the Real Estate Market</h3>
        <p>
          What I value most is building trust. I believe clients deserve transparent guidance, confidence, and support throughout
          every investment journey.
        </p>
      </section>
    </div>
  );
}
