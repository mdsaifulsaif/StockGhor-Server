const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema(
  {
    products: [
      {
        productID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        qty: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        discountPercent: { type: Number, default: 0 },
        taxPercent: { type: Number, default: 0 },
        totalPrice: { type: Number, required: true },
      },
    ],
    customerName: { type: String, default: "Walk-in Customer" },
    customerPhone: { type: String, default: "" },
    totalAmount: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 }, // <-- optional
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "partial"],
      default: "pending",
    },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const saleModel = mongoose.model("Sale", SaleSchema);

module.exports = saleModel;
