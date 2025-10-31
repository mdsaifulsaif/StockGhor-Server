const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Product name
    details: { type: String, default: "" }, // Description/specs
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
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit", required: true },

    // Stock management
    stock: { type: Number, default: 0 },
    decimal: { type: Number, default: 0 }, // Decimal places allowed
    manageStock: { type: Boolean, default: true }, // Track stock or not
    reorderLevel: { type: Number, default: 0 }, // Minimum stock to reorder

    // Pricing
    unitCost: { type: Number, required: true }, // Supplier price
    mrp: { type: Number, required: true }, // Maximum Retail Price
    dp: { type: Number, required: true }, // Selling price / discounted price
    taxPercent: { type: Number, default: 0 }, // Tax percentage
    discountPercent: { type: Number, default: 0 }, // Discount percentage

    // Extra info
    barcode: { type: String, default: "" },
    serialNumbers: [String],
    status: { type: Boolean, default: true }, // Active / Inactive
  },
  {
    timestamps: true, // createdAt & updatedAt auto
  }
);

const ProductModel = mongoose.model("Product", ProductSchema);
module.exports = ProductModel;
