const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
  description: { type: String }
}, { 
  timestamps: true 
});

// Export both the schema and the model
module.exports = roleSchema;
module.exports.Role = mongoose.model("Role", roleSchema);