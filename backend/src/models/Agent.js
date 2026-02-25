const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photoUrl: { type: String, trim: true, default: "" },
    whatsappBusinessNumber: { type: String, trim: true, default: "" },
    specialization: { type: String, trim: true, default: "" },
    experience: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["inactive", "active"],
      default: "active",
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = agentSchema;
