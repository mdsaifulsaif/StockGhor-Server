const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    status: { type: Boolean, default: true }, // active/inactive
  },
  { timestamps: true }
);

const brandModal = mongoose.model("Brand", brandSchema);
module.exports = brandModal;
