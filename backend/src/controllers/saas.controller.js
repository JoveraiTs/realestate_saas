const SaaSConfig = require("../models/SaaSConfig");

const filterItems = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      title: String(item.title || "").trim(),
      price: String(item.price || "").trim(),
      description: String(item.description || "").trim(),
    }))
    .filter((item) => item.title && item.description);

const getOrCreateConfig = async () => {
  let config = await SaaSConfig.findOne({ key: "default" });
  if (!config) {
    config = await SaaSConfig.create({ key: "default" });
  }
  return config;
};

exports.getPublicSaasConfig = async (_req, res) => {
  try {
    const config = await getOrCreateConfig();
    return res.status(200).json({
      brandName: config.brandName,
      heroTitle: config.heroTitle,
      heroSubtitle: config.heroSubtitle,
      heroButtonText: config.heroButtonText,
      services: config.services,
      packages: config.packages,
      demoWebsites: config.demoWebsites,
      seo: config.seo,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAdminSaasConfig = async (_req, res) => {
  try {
    const config = await getOrCreateConfig();
    return res.status(200).json(config);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateAdminSaasConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();

    const {
      brandName,
      heroTitle,
      heroSubtitle,
      heroButtonText,
      services,
      packages,
      demoWebsites,
      seo,
    } = req.body;

    if (typeof brandName === "string") config.brandName = brandName.trim() || config.brandName;
    if (typeof heroTitle === "string") config.heroTitle = heroTitle.trim() || config.heroTitle;
    if (typeof heroSubtitle === "string") config.heroSubtitle = heroSubtitle.trim() || config.heroSubtitle;
    if (typeof heroButtonText === "string") config.heroButtonText = heroButtonText.trim() || config.heroButtonText;

    const parsedServices = filterItems(services);
    const parsedPackages = filterItems(packages);
    const parsedDemo = filterItems(demoWebsites);

    if (parsedServices.length) config.services = parsedServices;
    if (parsedPackages.length) config.packages = parsedPackages;
    if (parsedDemo.length) config.demoWebsites = parsedDemo;

    if (seo && typeof seo === "object") {
      config.seo = {
        title: String(seo.title || config.seo?.title || "").trim(),
        description: String(seo.description || config.seo?.description || "").trim(),
        keywords: Array.isArray(seo.keywords)
          ? seo.keywords.map((item) => String(item).trim()).filter(Boolean)
          : config.seo?.keywords || [],
      };
    }

    config.updatedBy = req.masterUser?._id;
    await config.save();

    return res.status(200).json({ message: "SaaS website config updated", config });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
