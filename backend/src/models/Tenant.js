const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tenant name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      // unique: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, "Invalid phone number"],
    },
    address: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    subdomain: {
      type: String,
      // required: [true, "Domain is required"],
      trim: true,
      unique: true,
      lowercase: true,
    },
    domain: {
      type: String,
      // required: [true, "Domain is required"],
      // trim: true,
      // unique: true,
      lowercase: true,
    },
    requestedDomain: {
      type: String,
      trim: true,
      lowercase: true,
    },
    customDomains: {
      type: [String],
      default: [],
    },
    databaseName: {
      type: String,
      required: [true, "Database name is required"],
      trim: true,
      unique: true,
    },
    domainVerified: {
      type: Boolean,
      default: false,
    },

    // 🔹 Plan and Billing
    plan: {
      type: String,
      // enum: ["basic", "standard", "premium", "enterprise"],
      default: "basic",
    },
    planStartDate: {
      type: Date,
      default: Date.now,
    },
    planEndDate: {
      type: Date, // used for trial or subscription expiry
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    trialActive: {
      type: Boolean,
      default: true,
    },
    trialEndsAt: {
      type: Date,
    },

    // 🔹 Lifecycle & Approval
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    reviewNote: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterUser",
    },

    websiteTheme: {
      type: String,
      enum: ["black", "gold"],
      default: "black",
    },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
      keywords: { type: [String], default: [] },
    },

    website: {
      heroTitle: { type: String, trim: true, default: "" },
      heroSubtitle: { type: String, trim: true, default: "" },
      heroButtonText: { type: String, trim: true, default: "" },

      home: {
        hero: {
          imageUrl: { type: String, trim: true, default: "" },
          title: { type: String, trim: true, default: "" },
          subtitle: { type: String, trim: true, default: "" },
          buttonText: { type: String, trim: true, default: "" },
          buttonHref: { type: String, trim: true, default: "" },
        },
        stats: {
          propertyReady: { type: Number, default: 0 },
          happyClients: { type: Number, default: 0 },
          knownAreas: { type: Number, default: 0 },
        },
        featuredCategories: {
          type: [
            {
              name: { type: String, trim: true, default: "" },
              icon: { type: String, trim: true, default: "" },
              variant: { type: String, trim: true, default: "default" },
              href: { type: String, trim: true, default: "" },
            },
          ],
          default: [],
        },
        featuredCategoriesTitle: { type: String, trim: true, default: "" },
        featuredCategoriesViewAllText: { type: String, trim: true, default: "" },
        featuredCategoriesViewAllHref: { type: String, trim: true, default: "" },
        bestDeals: {
          maxItems: { type: Number, default: 3 },
        },
        exploreCities: {
          maxItems: { type: Number, default: 5 },
          overrides: {
            type: [
              {
                city: { type: String, trim: true, default: "" },
                imageUrl: { type: String, trim: true, default: "" },
              },
            ],
            default: [],
          },
        },
        marketing: {
          enabled: { type: Boolean, default: true },
          imageUrl: { type: String, trim: true, default: "" },
          title: { type: String, trim: true, default: "" },
          subtitle: { type: String, trim: true, default: "" },
          buttonText: { type: String, trim: true, default: "" },
          buttonHref: { type: String, trim: true, default: "" },
        },
        team: {
          enabled: { type: Boolean, default: true },
          title: { type: String, trim: true, default: "" },
          subtitle: { type: String, trim: true, default: "" },
          maxItems: { type: Number, default: 4 },
        },
        reviews: {
          type: [
            {
              name: { type: String, trim: true, default: "" },
              role: { type: String, trim: true, default: "" },
              rating: { type: Number, default: 5 },
              text: { type: String, trim: true, default: "" },
              photoUrl: { type: String, trim: true, default: "" },
              videoUrl: { type: String, trim: true, default: "" },
            },
          ],
          default: [],
        },
        contact: {
          enabled: { type: Boolean, default: true },
          title: { type: String, trim: true, default: "" },
          subtitle: { type: String, trim: true, default: "" },
        },
        location: {
          googleMapUrl: { type: String, trim: true, default: "" },
        },
      },

      contactPhone: { type: String, trim: true, default: "" },
      contactEmailPrimary: { type: String, trim: true, lowercase: true, default: "" },
      contactEmailSecondary: { type: String, trim: true, lowercase: true, default: "" },
      addressLine1: { type: String, trim: true, default: "" },
      addressLine2: { type: String, trim: true, default: "" },

      aboutLeader1Name: { type: String, trim: true, default: "" },
      aboutLeader1Role: { type: String, trim: true, default: "" },
      aboutLeader1Quote: { type: String, trim: true, default: "" },

      aboutLeader2Name: { type: String, trim: true, default: "" },
      aboutLeader2Role: { type: String, trim: true, default: "" },
      aboutLeader2Quote: { type: String, trim: true, default: "" },
    },

    // 🔹 Database provisioning flags
    dbCreated: {
      type: Boolean,
      default: false,
    },
    dbURI: {
      type: String, // store actual connection URI (for multi-cluster setups)
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
// tenantSchema.index({ domain: 1 });
// tenantSchema.index({ databaseName: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ plan: 1 });
tenantSchema.index({ planEndDate: 1 });
tenantSchema.index({ domain: 1 }, { unique: false });

// 🔹 Auto-calculate trial period (e.g., 14 days) before save
tenantSchema.pre("save", async function () {
  if (this.isNew && this.trialActive && !this.trialEndsAt) {
    const trialDays = 14;
    this.trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    this.planEndDate = this.trialEndsAt;
  }
});


// 🔹 Mark DB as created once tenant DB is provisioned
tenantSchema.methods.markDatabaseCreated = async function (dbURI) {
  this.dbCreated = true;
  this.dbURI = dbURI;
  this.status = "approved";
  this.approvedAt = new Date();
  await this.save();
};

module.exports = mongoose.model("Tenant", tenantSchema);
