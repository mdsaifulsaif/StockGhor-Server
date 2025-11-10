// models/purchaseReturnModel.js
const mongoose = require("mongoose");

const purchaseReturnSchema = new mongoose.Schema(
  {
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
    },
    supplierID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    returnedProducts: [
      {
        productID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        qty: { type: Number, required: true },
        unitCost: { type: Number, required: true },
        total: { type: Number, required: true },
        reason: { type: String, default: "" },
      },
    ],
    totalAmount: { type: Number, required: true },
    note: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const PurchaseReturnModel = mongoose.model(
  "PurchaseReturn",
  purchaseReturnSchema
);
module.exports = PurchaseReturnModel;
