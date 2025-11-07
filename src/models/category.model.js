const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    status: { type: Boolean, default: true }, // active/inactive
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const categoryModal = mongoose.model("Category", categorySchema);
module.exports = categoryModal;
