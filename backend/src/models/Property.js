const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    coverPhotoUrl: { type: String, trim: true, default: "" },
    gallery: { type: [String], default: [] },
    category: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    price: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },

    listingType: {
      type: String,
      enum: ["sale", "rent", "off_plan"],
      default: "sale",
    },

    propertyId: { type: String, trim: true, default: "" },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    garage: { type: Number, default: 0 },
    area: { type: Number, default: 0 },
    areaUnit: { type: String, trim: true, default: "sqft" },

    address: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    zip: { type: String, trim: true, default: "" },

    videoUrl: { type: String, trim: true, default: "" },
    features: { type: [String], default: [] },
    documents: {
      type: [
        {
          name: { type: String, trim: true, default: "" },
          url: { type: String, trim: true, default: "" },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = propertySchema;
