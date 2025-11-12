const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema(
  {
    // 🔹 Supplier Info (optional)
    supplierID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    supplierName: { type: String },

    // 🔹 Purchase Details
    invoiceNo: { type: String, required: true },
    purchaseDate: { type: Date, default: Date.now },
    notes: { type: String, default: "" },

    // 🔹 Purchase Items (multiple products)
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: String,
        purchaseQty: { type: Number, required: true },
        unitCost: { type: Number, required: true },
        totalCost: { type: Number, required: true },
        // optional link to created batch id (for FIFO tracking)
        batchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Batch",
        },
      },
    ],

    // 🔹 Financial Summary
    subTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    // 🔹 Meta
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Completed",
    },
  },
  { timestamps: true }
);

const PurchaseModel = mongoose.model("Purchase", PurchaseSchema);
module.exports = PurchaseModel;
