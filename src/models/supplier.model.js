const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  previousDue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const supplierModel = mongoose.model("Supplier", supplierSchema);

module.exports = supplierModel;
