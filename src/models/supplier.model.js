const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String },
  phone: {
    type: String,
    required: true,
    unique: true,
    minlength: 11,
    maxlength: 11,
    // match: /^[0-9]{11}$/,
    match: /^(?:\+8801|01)[3-9]\d{8}$/,
  },
  email: { type: String, default: "" },
  status: { type: Boolean, default: true },
  address: { type: String, required: true },
  previousDue: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const supplierModel = mongoose.model("Supplier", supplierSchema);

module.exports = supplierModel;
