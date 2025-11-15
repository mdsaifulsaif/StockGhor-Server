const mongoose = require("mongoose");

// const saleSchema = new mongoose.Schema(
//   {
//     customerID: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       required: true,
//     },
//     items: [
//       {
//         productID: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Product",
//           required: true,
//         },
//         batchId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Batch",
//         },
//         qty: { type: Number, required: true },
//         unitPrice: { type: Number, required: true },
//         total: { type: Number, required: true },
//       },
//     ],
//     subTotal: { type: Number, required: true },
//     discount: { type: Number, default: 0 },
//     tax: { type: Number, default: 0 },
//     grandTotal: { type: Number, required: true },
//     paidAmount: { type: Number, default: 0 },
//     dueAmount: { type: Number, default: 0 },
//     note: { type: String, default: "" },
//     invoiceNo: { type: String, unique: true },
//     saleDate: { type: Date, default: Date.now },
//     status: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

const saleSchema = new mongoose.Schema(
  {
    customerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    items: [
      {
        productID: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        batchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Batch",
        },
        qty: { type: Number, required: true },
        unitPrice: { type: Number },
        // salePrice: { type: Number },
        unitCost: { type: Number }, //  add unitCost for profit calculation
        total: { type: Number, required: true },
        profit: { type: Number }, // profit per item
      },
    ],
    subTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 }, //  total profit of sale
    note: { type: String, default: "" },
    invoiceNo: { type: String, unique: true },
    saleDate: { type: Date, default: Date.now },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SaleModel = mongoose.model("Sale", saleSchema);
module.exports = SaleModel;
