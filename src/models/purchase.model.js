const mongoose = require("mongoose");

const PurchaseSchema = new mongoose.Schema(
  {
    products: [
      {
        productID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        qty: { type: Number, required: true },
        unitCost: { type: Number, required: true },
        totalCost: { type: Number, required: true },
      },
    ],
    supplierName: { type: String, required: true },
    supplierPhone: { type: String, default: "" },
    totalAmount: { type: Number, required: true },
    dueAmount: { type: Number, default: 0 }, // <-- optional
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const purchaseModel = mongoose.model("Purchase", PurchaseSchema);
module.exports = purchaseModel;
