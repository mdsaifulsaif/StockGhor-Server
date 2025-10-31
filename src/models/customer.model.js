const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String, required: true },
  previousDue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const customerModel = mongoose.model("Customer", customerSchema);

module.exports = customerModel;
