const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., piece, box, kg
    shortName: { type: String, default: "" }, // e.g., pc, kg, bx
    description: { type: String, default: "" },
    status: { type: Boolean, default: true }, // active/inactive
  },
  { timestamps: true }
);

const unitModal = mongoose.model("Unit", unitSchema);
module.exports = unitModal;
