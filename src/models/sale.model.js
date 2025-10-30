const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    default: null,
  },
  customerName: { type: String, default: "Walk-in Customer" },

  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      qty: Number,
      price: Number,
      total: Number,
    },
  ],

  subTotal: Number,
  discount: { type: Number, default: 0 },
  grandTotal: Number,

  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ["pending", "partial", "paid"],
    default: "pending",
  },

  createdAt: { type: Date, default: Date.now },
});

const saleModel = mongoose.model("Sale", saleSchema);
module.exports = saleModel;
