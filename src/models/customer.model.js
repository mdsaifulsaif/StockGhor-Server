const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: {
    type: String,
    required: true,
    unique: true,
    minlength: 11,
    maxlength: 11,
    match: /^[0-9]{11}$/,
  },
  email: { type: String },
  address: { type: String, required: true },
  status: { type: Boolean, default: true },
  previousDue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const customerModel = mongoose.model("Customer", customerSchema);

module.exports = customerModel;
