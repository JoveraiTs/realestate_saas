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
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // central admin
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
