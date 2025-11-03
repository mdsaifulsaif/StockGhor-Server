// const mongoose = require("mongoose");

// const ProductSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true }, // Product name
//     details: { type: String, default: "" }, // Description/specs
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
//     unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },

//     // Stock management
//     stock: { type: Number, default: 0 },
//     decimal: { type: Number, default: 0 }, // Decimal places allowed
//     manageStock: { type: Boolean, default: true }, // Track stock or not
//     reorderLevel: { type: Number, default: 0 }, // Minimum stock to reorder

//     // Pricing
//     unitCost: { type: Number, required: true }, // Supplier price
//     mrp: { type: Number, required: true }, // Maximum Retail Price
//     dp: { type: Number, required: true }, // Selling price / discounted price
//     taxPercent: { type: Number, default: 0 }, // Tax percentage
//     discountPercent: { type: Number, default: 0 }, // Discount percentage

//     // Extra info
//     barcode: { type: String, default: "" },
//     serialNumbers: [String],
//     status: { type: Boolean, default: true }, // Active / Inactive
//   },
//   {
//     timestamps: true, // createdAt & updatedAt auto
//   }
// );

// const ProductModel = mongoose.model("Product", ProductSchema);
// module.exports = ProductModel;

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

    // 🔹 FIFO Batch System
    batches: [
      {
        qty: { type: Number, required: true }, // কত পিস এসেছে
        unitCost: { type: Number, required: true }, // ঐ batch-এর cost
        purchaseDate: { type: Date, default: Date.now }, // কখন purchase হয়েছে
      },
    ],

    // 🔹 Stock management
    stock: { type: Number, default: 0 }, // মোট available stock
    decimal: { type: Number, default: 0 },
    manageStock: { type: Boolean, default: true },
    reorderLevel: { type: Number, default: 0 },
    alertQty: { type: Number, default: 10 },

    // 🔹 Pricing info
    unitCost: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    dp: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },

    // 🔹 Extra info
    barcode: { type: String, default: "" },
    serialNumbers: [String],
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ProductModel = mongoose.model("Product", ProductSchema);
module.exports = ProductModel;
