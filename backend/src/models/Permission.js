const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  submodule: { type: String, required: true },
  action: { type: String, required: true },
  name: { type: String, required: true, unique: true },
  description: { type: String }
}, { 
  timestamps: true 
});

// Export both the schema and the model
module.exports = permissionSchema;
module.exports.Permission = mongoose.model("Permission", permissionSchema);