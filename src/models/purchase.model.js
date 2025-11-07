const mongoose = require("mongoose");

// const PurchaseSchema = new mongoose.Schema(
//   {
//     products: [
//       {
//         productID: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Product",
//           required: true,
//         },
//         qty: { type: Number, required: true },
//         unitCost: { type: Number, required: true },
//         totalCost: { type: Number, required: true },
//       },
//     ],
//     supplierName: { type: String, required: true },
//     supplierPhone: { type: String, default: "" },
//     totalAmount: { type: Number, required: true },
//     dueAmount: { type: Number, default: 0 }, // <-- optional
//     status: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

const PurchaseSchema = new mongoose.Schema(
  {
    // মূল Purchase ইনফরমেশন
    Purchase: {
      supplierID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
        required: true,
      },
      total: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true },
      paid: { type: Number, default: 0 },
      dueAmount: { type: Number, default: 0 },
      note: { type: String, default: "" },
      date: { type: Date, required: true },
      cost: { type: Number, default: 0 },
    },

    // পণ্য সম্পর্কিত ডাটা (array of objects)
    PurchasesProduct: [
      {
        productID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        qty: { type: Number, default: 0 },
        unitCost: { type: Number, default: 0 },
        dp: { type: Number, default: 0 },
        mrp: { type: Number, default: 0 },
        warranty: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        serialNos: { type: [String], default: [] },
      },
    ],

    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const purchaseModel = mongoose.model("Purchase", PurchaseSchema);
module.exports = purchaseModel;
