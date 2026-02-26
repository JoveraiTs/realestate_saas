import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import { getTenantWebsiteData, getPublicProperties, getPublicAgents } from "@/lib/serverApi";

const HERO_IMAGE = "https://www.figma.com/api/mcp/asset/399c5f38-767d-4041-90ad-de4ef14c9155";
const HERO_STATS_BG = "https://www.figma.com/api/mcp/asset/e62bcd57-80e7-48dc-8c8d-ec6d5d772e9c";
const ICON_ARROW = "https://www.figma.com/api/mcp/asset/7bbef56f-e05b-4b1a-a88f-58da43a7deba";
const ICON_LOCATION = "https://www.figma.com/api/mcp/asset/ee367711-7746-466b-839d-4860c7f596cb";
const ICON_BED = "https://www.figma.com/api/mcp/asset/b090a91c-0746-40a1-a03b-86d00f2b0119";
const ICON_BATH = "https://www.figma.com/api/mcp/asset/86bde9a4-dd93-4327-bcd0-c3e3ec03e0ef";
const ICON_AREA = "https://www.figma.com/api/mcp/asset/fb0e196c-5218-4b56-b615-891d00a1b913";

const CATEGORY_ICON_VILLA = "https://www.figma.com/api/mcp/asset/374cdcfc-4870-48ab-a105-fdd9d4217c02";
const CATEGORY_ICON_APARTMENT = "https://www.figma.com/api/mcp/asset/da85a0e1-c13f-4541-aa1e-500ab40800cb";
const CATEGORY_ICON_TOWNHOUSE = "https://www.figma.com/api/mcp/asset/eb72bea8-b27e-44d5-ae88-e7862d5e6c0c";
const CATEGORY_ICON_OFFICE = "https://www.figma.com/api/mcp/asset/36659732-b9ef-4da8-a946-3b80464b03bb";
const CATEGORY_ICON_PENTHOUSE = "https://www.figma.com/api/mcp/asset/e4ef60e8-4d42-462c-845d-e279c6de1223";
const CATEGORY_ICON_SINGLE_FAMILY = "https://www.figma.com/api/mcp/asset/ee367711-7746-466b-839d-4860c7f596cb";

const categoryItems = ["Villa", "Apartment", "Town House", "Office", "Pent House", "Single Family"];

const cityImages = [
  "https://www.figma.com/api/mcp/asset/53f36a21-b27f-4bb4-928e-3ee8d4a86c23",
  "https://www.figma.com/api/mcp/asset/344694aa-54c4-4b5b-a974-f8f12ee6f8fb",
  "https://www.figma.com/api/mcp/asset/deb68351-b24c-492f-9a36-f27598fbc2a9",
  "https://www.figma.com/api/mcp/asset/87378408-a69c-4360-aa5b-33712ff74b8e",
  "https://www.figma.com/api/mcp/asset/b7eac5fb-c5c2-4499-9da1-71790bbb4f25",
];

const dealImages = [
  "https://www.figma.com/api/mcp/asset/fc8026a7-0b7d-4f33-b4d6-5286925f5666",
  "https://www.figma.com/api/mcp/asset/f4bb4880-3ce5-47b6-bf3c-77b3cff3c4a4",
  "https://www.figma.com/api/mcp/asset/2d55dcbb-909c-40ca-9e77-655e403dd9cb",
];

const expertImages = [
  "https://www.figma.com/api/mcp/asset/b4e4d41b-c862-4fea-8286-c70a816d379d",
  "https://www.figma.com/api/mcp/asset/dee5112d-95d1-4375-a2ff-888188c5b873",
  "https://www.figma.com/api/mcp/asset/c609f747-0cdd-4771-9c98-988b00c23f8b",
  "https://www.figma.com/api/mcp/asset/74b2d466-26da-4f2d-9d2f-10f526acfd28",
];

const WORK_IMAGE_LEFT = "https://www.figma.com/api/mcp/asset/9b61ab87-0774-4626-b8cc-f0ed28ad05f4";
const WORK_IMAGE_RIGHT = "https://www.figma.com/api/mcp/asset/d6be2585-a4c3-478f-8bbc-c07d150204e1";
const TESTIMONIAL_IMAGE = "https://www.figma.com/api/mcp/asset/55399e28-18b0-4f4c-b57a-bd7ed2802823";
const TESTIMONIAL_AVATAR = "https://www.figma.com/api/mcp/asset/3529e05b-31e5-49d3-8bf8-6323b6514e2c";
const HOME_CONTACT_MAP = "https://www.figma.com/api/mcp/asset/e605d70d-cf9a-4205-a575-2712203aeeec";

export default async function HomePage() {
  const data = await getTenantWebsiteData();
  const tenant = data?.tenant;
  const tenantName = tenant?.name || "Vanguard Properties";

  const website = tenant?.website || {};
  const home = website?.home || {};
  const hero = home?.hero || {};
  const stats = home?.stats || {};

  const heroImageUrl = hero.imageUrl || HERO_IMAGE;
  const heroTitle = hero.title || website.heroTitle || "Search for your dream Home in UAE";
  const heroSubtitle = hero.subtitle || website.heroSubtitle || "";
  const heroButtonText = hero.buttonText || website.heroButtonText || "View Properties";
  const heroButtonHref = hero.buttonHref || "/properties";

  const allProperties = await getPublicProperties();
  const maxDeals = Number(home?.bestDeals?.maxItems || 3);
  const properties = allProperties.slice(0, Math.max(1, maxDeals));

  const exploreCitiesConfig = home?.exploreCities;
  const teamConfig = home?.team;

  const maxAgents = Number(teamConfig?.maxItems || 4);
  const agents = teamConfig && teamConfig.enabled !== false
    ? (await getPublicAgents()).slice(0, Math.max(1, maxAgents))
    : [];

  const maxCities = Number(exploreCitiesConfig?.maxItems || 5);
  const cityOverrides = Array.isArray(exploreCitiesConfig?.overrides) ? exploreCitiesConfig.overrides : [];

  const citiesFromProperties = (() => {
    const seen = new Set();
    const list = [];
    for (const property of allProperties) {
      const city = String(property?.city || "").trim();
      if (!city || seen.has(city.toLowerCase())) continue;
      seen.add(city.toLowerCase());
      list.push(city);
      if (list.length >= Math.max(1, maxCities)) break;
    }
    return list;
  })();

  const citiesFromOverrides = cityOverrides
    .map((item) => String(item?.city || "").trim())
    .filter(Boolean)
    .slice(0, Math.max(1, maxCities));

  const citiesToRender = (citiesFromProperties.length ? citiesFromProperties : citiesFromOverrides)
    .slice(0, Math.max(1, maxCities));

  const showExploreCities = Boolean(exploreCitiesConfig) && exploreCitiesConfig.enabled !== false && citiesToRender.length > 0;
  const showTeam = Boolean(teamConfig) && teamConfig.enabled !== false && agents.length > 0;

  const getCityCover = (city, index) => {
    const override = cityOverrides.find((item) => String(item?.city || "").trim().toLowerCase() === String(city).toLowerCase());
    if (override?.imageUrl) return override.imageUrl;

    const match = allProperties.find((property) => String(property?.city || property?.location || "").trim().toLowerCase() === String(city).toLowerCase());
    const fromProperty = match?.coverPhotoUrl || (Array.isArray(match?.gallery) ? match.gallery[0] : "");
    if (fromProperty) return fromProperty;
    return cityImages[index % cityImages.length];
  };

  const featuredCategoriesTitle = home.featuredCategoriesTitle || "Featured Categories";
  const featuredCategoriesViewAllText = home.featuredCategoriesViewAllText || "View All Categories";
  const featuredCategoriesViewAllHref = home.featuredCategoriesViewAllHref || "/properties";
  const featuredCategories = Array.isArray(home.featuredCategories) && home.featuredCategories.length
    ? home.featuredCategories
    : categoryItems.map((name, index) => ({ name, icon: "⌂", variant: index === 0 ? "active" : "default", href: "" }));

  const categoryIconByName = {
    villa: CATEGORY_ICON_VILLA,
    apartment: CATEGORY_ICON_APARTMENT,
    "town house": CATEGORY_ICON_TOWNHOUSE,
    townhouse: CATEGORY_ICON_TOWNHOUSE,
    office: CATEGORY_ICON_OFFICE,
    "pent house": CATEGORY_ICON_PENTHOUSE,
    penthouse: CATEGORY_ICON_PENTHOUSE,
    "single family": CATEGORY_ICON_SINGLE_FAMILY,
  };

  const categoryCountByName = (() => {
    const map = new Map();
    for (const property of allProperties) {
      const name = String(property?.category || "").trim();
      if (!name) continue;
      map.set(name.toLowerCase(), (map.get(name.toLowerCase()) || 0) + 1);
    }
    return map;
  })();

  const cityCountByName = (() => {
    const map = new Map();
    for (const property of allProperties) {
      const name = String(property?.city || "").trim();
      if (!name) continue;
      map.set(name.toLowerCase(), (map.get(name.toLowerCase()) || 0) + 1);
    }
    return map;
  })();

  const formatCountLabel = (count) => {
    const num = Number(count || 0);
    if (num === 1) return "1 Property";
    return `${num} Properties`;
  };

  const listingLabel = (value) => {
    const v = String(value || "sale").trim().toLowerCase();
    if (v === "rent") return "For Rent";
    return "For Sale";
  };

  const marketing = home.marketing || {};
  const team = home.team || {};
  const contact = home.contact || {};
  const reviews = Array.isArray(home.reviews) ? home.reviews : [];
  const googleMapUrl = home?.location?.googleMapUrl || "";

  return (
    <div className="home">
      <section className="home-hero full-bleed">
        <div className="home-hero-pad">
          <div className="home-hero-nav-gap" />
          <div className="home-hero-card">
            <img src={heroImageUrl} alt="Hero" className="home-hero-img" loading="eager" decoding="async" fetchPriority="high" />

            <div className="home-hero-text">
              <h1>{heroTitle}</h1>
              {heroSubtitle ? <p className="home-hero-subtitle">{heroSubtitle}</p> : null}
              <Link href={heroButtonHref} className="home-hero-button">{heroButtonText}</Link>
            </div>

            <div className="home-hero-stats" style={{ backgroundImage: `url(${HERO_STATS_BG})` }}>
              <div className="home-hero-stat">
                <strong>{stats.awardWinning || 680}</strong>
                <span>Awward Winning</span>
              </div>
              <div className="home-hero-stat">
                <strong>{stats.happyClients || "8K+"}</strong>
                <span>Happy Customer</span>
              </div>
              <div className="home-hero-stat">
                <strong>{stats.propertyReady || "500+"}</strong>
                <span>Property Ready</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="home-section home-categories full-bleed">
        <div className="home-section-inner">
          <div className="home-section-head">
            <h2>{featuredCategoriesTitle}</h2>
            <Link className="home-section-link" href={featuredCategoriesViewAllHref}>
              <span>{featuredCategoriesViewAllText}</span>
              <img src={ICON_ARROW} alt="" aria-hidden="true" />
            </Link>
          </div>

          <div className="home-category-row">
            {featuredCategories.slice(0, 6).map((item, index) => {
              const name = String(item?.name || "Category").trim();
              const key = name.toLowerCase();
              const count = categoryCountByName.get(key) || 0;
              const iconUrl = item?.iconUrl || categoryIconByName[key] || "";
              const active = item?.variant === "active" || index === 0;
              const content = (
                <>
                  <div className="home-category-icon">
                    {iconUrl ? <img src={iconUrl} alt="" aria-hidden="true" loading="lazy" decoding="async" /> : <span>⌂</span>}
                  </div>
                  <div className="home-category-name">{name}</div>
                  <div className="home-category-count">{formatCountLabel(count)}</div>
                </>
              );

              if (item?.href) {
                return (
                  <Link key={`${name}-${index}`} href={item.href} className={`home-category-card${active ? " active" : ""}`}>
                    {content}
                  </Link>
                );
              }

              return (
                <article key={`${name}-${index}`} className={`home-category-card${active ? " active" : ""}`}>
                  {content}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-inner">
          <div className="home-section-head centered">
            <h2>Discover Our Best Deals</h2>
          </div>

          <div className="home-deals-grid">
            {properties.length === 0 ? (
              <article className="empty-state">
                <h3>No featured properties yet</h3>
                <p>Published listings will appear here automatically.</p>
              </article>
            ) : (
              properties.map((property, index) => (
                <Link key={property._id || property.id} href={`/properties/${property._id || property.id}`} className="home-deal-card">
                  <div className="home-deal-media">
                    <img
                      src={property?.coverPhotoUrl || (Array.isArray(property?.gallery) ? property.gallery[0] : "") || dealImages[index % dealImages.length]}
                      alt={property?.title ? `${property.title} photo` : "Property photo"}
                      loading={index < 3 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={index < 3 ? "high" : "auto"}
                    />
                    <span className="home-tag sale">{listingLabel(property?.listingType)}</span>
                    {index % 3 === 2 ? <span className="home-tag featured">Featured</span> : null}
                  </div>

                  <div className="home-deal-title">{property?.title || "Property"}</div>
                  <div className="home-deal-location">
                    <img src={ICON_LOCATION} alt="" aria-hidden="true" />
                    <span>{property?.location || property?.city || "Dubai , Jomera"}</span>
                  </div>

                  <div className="home-deal-meta">
                    <span className="home-meta-item">
                      <img src={ICON_BED} alt="" aria-hidden="true" />
                      <span>{property?.bedrooms || 0}</span>
                    </span>
                    <span className="home-meta-item">
                      <img src={ICON_BATH} alt="" aria-hidden="true" />
                      <span>{property?.bathrooms || 0}</span>
                    </span>
                    <span className="home-meta-item">
                      <img src={ICON_AREA} alt="" aria-hidden="true" />
                      <span>{property?.area || 0}</span>
                    </span>
                    <span className="home-deal-price">{property?.price || "$280,000"}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {showExploreCities ? (
        <section className="home-section home-cities full-bleed">
          <div className="home-section-inner">
            <div className="home-section-head centered">
              <h2>{exploreCitiesConfig?.title || "Explore Cities"}</h2>
            </div>
          </div>

          <div className="home-cities-panel">
            <div className="home-section-inner">
              <div className="home-cities-grid">
                {citiesToRender.slice(0, 5).map((city, index) => {
                  const count = cityCountByName.get(String(city).toLowerCase()) || 0;
                  return (
                    <article key={city} className="home-city-card">
                      <div className="home-city-media">
                        <img src={getCityCover(city, index)} alt={city} loading="lazy" decoding="async" />
                      </div>
                      <div className="home-city-count">{formatCountLabel(count)}</div>
                      <div className="home-city-name">{city}</div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {marketing?.enabled === false ? null : (
        <section className="home-section home-why full-bleed">
          <div className="home-section-inner home-why-inner">
            <div className="home-why-images">
              <img src={marketing?.leftImageUrl || marketing?.imageUrl || WORK_IMAGE_LEFT} alt="" loading="lazy" decoding="async" />
              <img src={marketing?.rightImageUrl || marketing?.imageUrl || WORK_IMAGE_RIGHT} alt="" loading="lazy" decoding="async" />
              <div className="home-why-highlight">
                <div className="home-why-highlight-icon">
                  <img src={CATEGORY_ICON_TOWNHOUSE} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                </div>
                <div className="home-why-highlight-text">+1000 Properties for sale</div>
              </div>
            </div>

            <div className="home-why-copy">
              <h2>{marketing?.title || "Why You Should Work\nWith Us"}</h2>
              <p>{marketing?.subtitle || "Helping you find the perfect home with confidence and ease."}</p>
              <div className="home-why-bullets">
                <div className="home-why-bullet">100% Secure</div>
                <div className="home-why-bullet">Wide Range of Properties</div>
                <div className="home-why-bullet">Buy or Rent Homes</div>
                <div className="home-why-bullet">Truested by Thousands</div>
              </div>
              <Link href={marketing?.buttonHref || "/about"} className="home-why-button">
                <span>{marketing?.buttonText || "Learn More"}</span>
                <img src={ICON_ARROW} alt="" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {showTeam ? (
        <section className="home-section">
          <div className="home-section-inner">
            <div className="home-section-head centered">
              <h2>{team?.title || "Meet our team Expert"}</h2>
            </div>

            <div className="home-team-grid">
              {agents.slice(0, 4).map((agent, index) => (
                <article key={agent._id || index} className="home-team-card">
                  <div className="home-team-photo">
                    <img src={agent?.photoUrl || expertImages[index % expertImages.length]} alt={agent?.name || "Team member"} loading="lazy" decoding="async" />
                  </div>
                  <div className="home-team-name">{agent?.name || `Advisor ${index + 1}`}</div>
                  <div className="home-team-role">{agent?.specialization || "Head of Sales"}</div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="home-section home-testimonial full-bleed">
        <div className="home-testimonial-inner">
          <div className="home-testimonial-media">
            <img src={TESTIMONIAL_IMAGE} alt="Client" loading="lazy" decoding="async" />
          </div>
          <div className="home-testimonial-card">
            <div className="home-testimonial-avatar">
              <img src={TESTIMONIAL_AVATAR} alt="" aria-hidden="true" loading="lazy" decoding="async" />
            </div>
            <div className="home-testimonial-name">{reviews[0]?.name || "Best Customer"}</div>
            <div className="home-testimonial-role">{reviews[0]?.role || "Customer"}</div>
            <p className="home-testimonial-text">
              {reviews[0]?.text || `"At ${tenantName}, we help buyers and investors secure properties with confidence and ease."`}
            </p>
          </div>
        </div>
      </section>

      {contact?.enabled === false ? null : (
        <section className="home-section home-contact">
          <div className="home-section-inner">
            <div className="home-section-head centered">
              <h2>{contact?.title || "Contact US"}</h2>
            </div>

            <div className="home-contact-grid">
              <div className="home-contact-form">
                {contact?.subtitle ? <p className="home-contact-subtitle">{contact.subtitle}</p> : null}
                <LeadForm sourcePage="home" compact />
              </div>
              <div className="home-contact-map">
                {googleMapUrl && googleMapUrl.includes("google.com/maps") ? (
                  googleMapUrl.includes("/maps/embed") ? (
                    <iframe
                      title="Map"
                      src={googleMapUrl}
                      className="home-contact-map-frame"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <a className="home-why-button" href={googleMapUrl} target="_blank" rel="noreferrer">Open location</a>
                  )
                ) : (
                  <img src={HOME_CONTACT_MAP} alt="Map" className="home-contact-map-frame" loading="lazy" decoding="async" />
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
