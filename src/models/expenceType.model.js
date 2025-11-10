const mongoose = require("mongoose");

const ExpenceTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Product name
    status: { type: Boolean, default: true }, // active/inactive
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true, // createdAt & updatedAt auto
  }
);

const ExpenceTypeModel = mongoose.model("ExpenceType", ExpenceTypeSchema);
module.exports = ExpenceTypeModel;
