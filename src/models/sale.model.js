// const mongoose = require("mongoose");

// const saleSchema = new mongoose.Schema(
//   {
//     // 🔹 Customer info
//     customerId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       default: null,
//     },
//     customerName: { type: String, default: "Walk-in Customer" },

//     // 🔹 Sold products
//     items: [
//       {
//         productId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Product",
//           required: true,
//         },
//         name: { type: String, required: true },
//         qty: { type: Number, required: true },
//         price: { type: Number, required: true }, // Selling price per item
//         total: { type: Number, required: true }, // qty * price
//         batchRef: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" }, // FIFO batch track করার জন্য future use
//       },
//     ],

//     // 🔹 Totals
//     subTotal: { type: Number, required: true },
//     discount: { type: Number, default: 0 },
//     grandTotal: { type: Number, required: true },

//     // 🔹 Payment
//     paidAmount: { type: Number, default: 0 },
//     dueAmount: { type: Number, default: 0 },
//     paymentStatus: {
//       type: String,
//       enum: ["pending", "partial", "paid"],
//       default: "pending",
//     },

//     // 🔹 Timestamps
//     createdAt: { type: Date, default: Date.now },
//   },
//   { timestamps: true }
// );
// const saleModel = mongoose.model("Sale", saleSchema);
// module.exports = saleModel;

const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    // 🔹 Customer info
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    customerName: { type: String, default: "Walk-in Customer" },

    // 🔹 Sold products
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true }, // Selling price per item
        total: { type: Number, required: true }, // qty * price

        // 🔹 FIFO batches used during sale
        batchesUsed: [
          {
            batchId: { type: mongoose.Schema.Types.ObjectId },
            qty: Number,
            unitCost: Number,
            purchaseDate: Date,
          },
        ],
      },
    ],

    // 🔹 Totals
    subTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    // 🔹 Payment
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const saleModel = mongoose.model("Sale", saleSchema);
module.exports = saleModel;
