const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  previousDue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const customerModel = mongoose.model("Customer", customerSchema);

module.exports = customerModel;
