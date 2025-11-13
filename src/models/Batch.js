// const mongoose = require("mongoose");

// const BatchSchema = new mongoose.Schema(
//   {
//     productId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       required: true,
//     },
//     batchNo: { type: String, default: () => `BATCH-${Date.now()}` },
//     purchaseQty: { type: Number, required: true },
//     remainingQty: { type: Number, required: true },
//     unitCost: { type: Number, required: true },
//     purchaseDate: { type: Date, default: Date.now },
//     expireDate: { type: Date }, // optional if needed
//   },
//   { timestamps: true }
// );

// const BatchModel = mongoose.model("Batch", BatchSchema);
// module.exports = BatchModel;

const mongoose = require("mongoose");

const BatchSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: false, // ✅ এই লাইনটা খুব গুরুত্বপূর্ণ
    },
    batchNo: { type: String, default: () => `BATCH-${Date.now()}` },
    purchaseQty: { type: Number, required: true },
    remainingQty: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    purchaseDate: { type: Date, default: Date.now },
    expireDate: { type: Date },
  },
  { timestamps: true }
);

const BatchModel = mongoose.model("Batch", BatchSchema);
module.exports = BatchModel;
