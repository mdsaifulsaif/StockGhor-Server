const mongoose = require("mongoose");

const saleReturnSchema = new mongoose.Schema(
  {
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        qty: { type: Number, required: true },
        reason: { type: String, default: "" },
      },
    ],
    totalReturnAmount: { type: Number, required: true },
    returnDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const saleRetunModel = mongoose.model("SaleReturn", saleReturnSchema);
module.exports = saleRetunModel;
