// const mongoose = require("mongoose");

// const ProductSchema = new mongoose.Schema(
//   {
//     // 🔹 Basic Info
//     name: { type: String, required: true },
//     details: { type: String, default: "" },

//     // 🔹 Relations
//     categoryID: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       required: true,
//     },
//     brandID: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Brand",
//       required: true,
//     },
//     unit: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Unit",
//       required: true,
//     },

//     // 🔹 FIFO Batch System
//     batches: [
//       {
//         qty: { type: Number, required: true }, // কত পিস এসেছে
//         unitCost: { type: Number, required: true }, // ঐ batch-এর cost
//         purchaseDate: { type: Date, default: Date.now }, // কখন purchase হয়েছে
//       },
//     ],

//     // 🔹 Stock management
//     stock: { type: Number, default: 0 }, // মোট available stock
//     decimal: { type: Number, default: 0 },
//     manageStock: { type: Boolean, default: true },
//     reorderLevel: { type: Number, default: 0 },
//     alertQty: { type: Number, default: 10 },
//     isActive: { type: Boolean, default: true },

//     // 🔹 Pricing info
//     unitCost: { type: Number, default: 0 },
//     mrp: { type: Number, default: 0 },
//     dp: { type: Number, default: 0 },
//     salePrice: { type: Number, default: 0 },
//     taxPercent: { type: Number, default: 0 },
//     discountPercent: { type: Number, default: 0 },

//     // 🔹 Extra info
//     barcode: { type: String, default: "" },
//     serialNumbers: [String],
//     status: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

// const ProductModel = mongoose.model("Product", ProductSchema);
// module.exports = ProductModel;

// new style =====================================

const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    // 🔹 Basic Info
    name: { type: String, required: true },
    details: { type: String, default: "" },

    // 🔹 Relations
    categoryID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brandID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },

    // 🔹 Stock management (summary info only)
    totalStock: { type: Number, default: 0 }, // সব batch মিলিয়ে মোট stock
    lastPurchasePrice: { type: Number, default: 0 }, // শেষ purchase এর cost
    averageCost: { type: Number, default: 0 }, // সব batch এর weighted average
    manageStock: { type: Boolean, default: true },
    reorderLevel: { type: Number, default: 0 },
    alertQty: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },

    // 🔹 Pricing info (for sale)
    mrp: { type: Number, default: 0 },
    dp: { type: Number, default: 0 }, // distributor price
    salePrice: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },

    // 🔹 Extra info
    barcode: { type: String, default: "" },
    serialNumbers: [String],
    status: { type: Boolean, default: true },

    // 🔹 Optional Link with Batch (for fast lookup)
    // আলাদা batch collection থাকলেও এখানে virtual populate বা lastBatchId রাখতে পারো
  },
  { timestamps: true }
);

// Virtual populate (batch গুলো সহজে আনতে)
ProductSchema.virtual("batches", {
  ref: "Batch",
  localField: "_id",
  foreignField: "productId",
});

ProductSchema.set("toObject", { virtuals: true });
ProductSchema.set("toJSON", { virtuals: true });

const ProductModel = mongoose.model("Product", ProductSchema);
module.exports = ProductModel;
