const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    price: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const saasConfigSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "default" },
    brandName: { type: String, trim: true, default: "JoveraITS SaaS" },
    heroTitle: {
      type: String,
      trim: true,
      default: "Launch Your Real Estate Brand Website + CRM",
    },
    heroSubtitle: {
      type: String,
      trim: true,
      default:
        "SEO-ready websites, lead capture, tenant subdomain, and agency dashboard in one SaaS platform.",
    },
    heroButtonText: { type: String, trim: true, default: "Sign Up as Agency" },
    services: {
      type: [itemSchema],
      default: [
        { title: "Website Builder", description: "Manage hero section, pages, and visual theme." },
        { title: "Leads CRM", description: "Capture, assign, and track lead lifecycle." },
        { title: "Tenant Domains", description: "Use default subdomain and custom domains." },
      ],
    },
    packages: {
      type: [itemSchema],
      default: [
        {
          title: "Free / Trial",
          price: "AED 0 / month",
          description: "1 admin user, up to 25 listings, subdomain only, basic CRM and website pages.",
        },
        {
          title: "Pro",
          price: "AED 799 / month",
          description: "Up to 10 users, 1 custom domain, up to 1,000 listings, advanced CRM and SEO controls.",
        },
        {
          title: "Enterprise",
          price: "AED 2,999 / month",
          description: "Up to 100 users, up to 5 custom domains, up to 10,000 listings, priority support and enterprise controls.",
        },
      ],
    },
    demoWebsites: {
      type: [itemSchema],
      default: [
        { title: "Luxury Homes", description: "High-end listings showcase template." },
        { title: "Urban Apartments", description: "City-focused lead generation layout." },
        { title: "Commercial Realty", description: "B2B property inquiry optimized template." },
      ],
    },
    seo: {
      title: { type: String, trim: true, default: "JoveraITS SaaS - Real Estate Website & CRM Platform" },
      description: {
        type: String,
        trim: true,
        default: "Multi-tenant real estate SaaS with website builder, CRM, SEO, lead capture, and custom domains.",
      },
      keywords: {
        type: [String],
        default: ["real estate saas", "property crm", "agency website", "tenant crm", "real estate seo"],
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterUser",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SaaSConfig", saasConfigSchema);
