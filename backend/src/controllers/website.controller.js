const Tenant = require("../models/Tenant");

const trimString = (value) => String(value || "").trim();

const toSafeInt = (value, fallback = 0) => {
  const number = Number.parseInt(String(value ?? "").trim(), 10);
  if (Number.isNaN(number)) return fallback;
  return Math.max(0, Math.min(number, 100000000));
};

const sanitizeList = (value, maxItems, mapFn) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => mapFn(item))
    .filter(Boolean)
    .slice(0, maxItems);
};

const sanitizeWebsite = (payload = {}) => {
  const website = payload && typeof payload === "object" ? payload : {};

  const out = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(website, key);

  if (has("heroTitle")) out.heroTitle = trimString(website.heroTitle);
  if (has("heroSubtitle")) out.heroSubtitle = trimString(website.heroSubtitle);
  if (has("heroButtonText")) out.heroButtonText = trimString(website.heroButtonText);

  if (has("contactPhone")) out.contactPhone = trimString(website.contactPhone);
  if (has("contactEmailPrimary")) out.contactEmailPrimary = trimString(website.contactEmailPrimary).toLowerCase();
  if (has("contactEmailSecondary")) out.contactEmailSecondary = trimString(website.contactEmailSecondary).toLowerCase();
  if (has("addressLine1")) out.addressLine1 = trimString(website.addressLine1);
  if (has("addressLine2")) out.addressLine2 = trimString(website.addressLine2);

  if (has("aboutLeader1Name")) out.aboutLeader1Name = trimString(website.aboutLeader1Name);
  if (has("aboutLeader1Role")) out.aboutLeader1Role = trimString(website.aboutLeader1Role);
  if (has("aboutLeader1Quote")) out.aboutLeader1Quote = trimString(website.aboutLeader1Quote);
  if (has("aboutLeader2Name")) out.aboutLeader2Name = trimString(website.aboutLeader2Name);
  if (has("aboutLeader2Role")) out.aboutLeader2Role = trimString(website.aboutLeader2Role);
  if (has("aboutLeader2Quote")) out.aboutLeader2Quote = trimString(website.aboutLeader2Quote);

  if (website.home && typeof website.home === "object") {
    const home = website.home;
    const homeHero = home.hero && typeof home.hero === "object" ? home.hero : {};
    const homeStats = home.stats && typeof home.stats === "object" ? home.stats : {};
    const homeBestDeals = home.bestDeals && typeof home.bestDeals === "object" ? home.bestDeals : {};
    const homeExploreCities = home.exploreCities && typeof home.exploreCities === "object" ? home.exploreCities : {};
    const homeMarketing = home.marketing && typeof home.marketing === "object" ? home.marketing : {};
    const homeTeam = home.team && typeof home.team === "object" ? home.team : {};
    const homeContact = home.contact && typeof home.contact === "object" ? home.contact : {};
    const homeLocation = home.location && typeof home.location === "object" ? home.location : {};

    out.home = {
      hero: {
        imageUrl: trimString(homeHero.imageUrl),
        title: trimString(homeHero.title),
        subtitle: trimString(homeHero.subtitle),
        buttonText: trimString(homeHero.buttonText),
        buttonHref: trimString(homeHero.buttonHref),
      },
      stats: {
        propertyReady: toSafeInt(homeStats.propertyReady, 0),
        happyClients: toSafeInt(homeStats.happyClients, 0),
        knownAreas: toSafeInt(homeStats.knownAreas, 0),
      },
      featuredCategories: sanitizeList(home.featuredCategories, 24, (item) => {
        const value = item && typeof item === "object" ? item : {};
        const name = trimString(value.name);
        if (!name) return null;
        const variant = ["default", "active", "muted"].includes(trimString(value.variant))
          ? trimString(value.variant)
          : "default";

        return {
          name,
          icon: trimString(value.icon),
          variant,
          href: trimString(value.href),
        };
      }),
      featuredCategoriesTitle: trimString(home.featuredCategoriesTitle),
      featuredCategoriesViewAllText: trimString(home.featuredCategoriesViewAllText),
      featuredCategoriesViewAllHref: trimString(home.featuredCategoriesViewAllHref),
      bestDeals: {
        maxItems: Math.max(1, Math.min(toSafeInt(homeBestDeals.maxItems, 3), 24)),
      },
      exploreCities: {
        maxItems: Math.max(1, Math.min(toSafeInt(homeExploreCities.maxItems, 5), 24)),
        overrides: sanitizeList(homeExploreCities.overrides, 50, (item) => {
          const value = item && typeof item === "object" ? item : {};
          const city = trimString(value.city);
          if (!city) return null;
          return {
            city,
            imageUrl: trimString(value.imageUrl),
          };
        }),
      },
      marketing: {
        enabled: Boolean(homeMarketing.enabled),
        imageUrl: trimString(homeMarketing.imageUrl),
        title: trimString(homeMarketing.title),
        subtitle: trimString(homeMarketing.subtitle),
        buttonText: trimString(homeMarketing.buttonText),
        buttonHref: trimString(homeMarketing.buttonHref),
      },
      team: {
        enabled: Boolean(homeTeam.enabled),
        title: trimString(homeTeam.title),
        subtitle: trimString(homeTeam.subtitle),
        maxItems: Math.max(1, Math.min(toSafeInt(homeTeam.maxItems, 4), 24)),
      },
      reviews: sanitizeList(home.reviews, 50, (item) => {
        const value = item && typeof item === "object" ? item : {};
        const text = trimString(value.text);
        if (!text) return null;
        const rating = Math.max(1, Math.min(toSafeInt(value.rating, 5), 5));
        return {
          name: trimString(value.name),
          role: trimString(value.role),
          rating,
          text,
          photoUrl: trimString(value.photoUrl),
          videoUrl: trimString(value.videoUrl),
        };
      }),
      contact: {
        enabled: Boolean(homeContact.enabled),
        title: trimString(homeContact.title),
        subtitle: trimString(homeContact.subtitle),
      },
      location: {
        googleMapUrl: trimString(homeLocation.googleMapUrl),
      },
    };
  }

  return out;
};

const sanitizeSeo = (payload = {}) => {
  const seo = payload && typeof payload === "object" ? payload : {};
  const keywords = Array.isArray(seo.keywords)
    ? seo.keywords
    : typeof seo.keywords === "string"
      ? seo.keywords.split(",")
      : [];

  return {
    title: trimString(seo.title),
    description: trimString(seo.description),
    keywords: keywords
      .map((value) => trimString(value))
      .filter(Boolean)
      .slice(0, 30),
  };
};

exports.getWebsiteSettings = async (req, res) => {
  try {
    const tenant = req.tenant;
    const freshTenant = await Tenant.findById(tenant._id).select("name subdomain domain websiteTheme seo website");
    if (!freshTenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    return res.status(200).json({
      tenant: {
        id: freshTenant._id,
        name: freshTenant.name,
        subdomain: freshTenant.subdomain,
        domain: freshTenant.domain,
      },
      theme: freshTenant.websiteTheme,
      seo: freshTenant.seo || { title: "", description: "", keywords: [] },
      website: freshTenant.website || {},
    });
  } catch (error) {
    console.error("❌ Website settings error:", error.message);
    return res.status(500).json({ error: "Failed to load website settings" });
  }
};

exports.updateWebsiteSettings = async (req, res) => {
  try {
    const tenant = req.tenant;

    const incomingWebsite = req.body?.website;
    const incomingSeo = req.body?.seo;

    const $set = {};

    if (incomingWebsite && typeof incomingWebsite === "object") {
      const sanitizedWebsite = sanitizeWebsite(incomingWebsite);
      for (const [key, value] of Object.entries(sanitizedWebsite)) {
        if (key === "home") {
          $set["website.home"] = value;
        } else {
          $set[`website.${key}`] = value;
        }
      }
    }

    if (incomingSeo && typeof incomingSeo === "object") {
      $set.seo = sanitizeSeo(incomingSeo);
    }

    if (Object.keys($set).length === 0) {
      return res.status(400).json({ error: "No valid fields provided" });
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenant._id,
      { $set },
      { new: true, runValidators: true }
    ).select("name subdomain domain websiteTheme seo website");

    if (!updatedTenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    return res.status(200).json({
      message: "Website settings updated",
      theme: updatedTenant.websiteTheme,
      seo: updatedTenant.seo || { title: "", description: "", keywords: [] },
      website: updatedTenant.website || {},
    });
  } catch (error) {
    console.error("❌ Website settings update error:", error.message);
    return res.status(500).json({ error: "Failed to update website settings" });
  }
};
