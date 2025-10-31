const mongoose = require("mongoose");
const productModel = require("../models/Product.model");

// Add new product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      details,
      categoryID,
      brandID,
      unit,
      qty,
      decimal,
      manageStock,
      reorderLevel,
      unitCost,
      mrp,
      dp,
      taxPercent,
      discountPercent,
      barcode,
      serialNumbers,
      status,
    } = req.body;

    console.log(req.body);
    // Required fields check
    if (!name || !categoryID || !brandID || !unit || !unitCost || !mrp || !dp) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields missing: name, categoryID, brandID, unit, unitCost, mrp, dp",
        data: null,
      });
    }

    // Stock validation
    if (qty < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
        data: null,
      });
    }

    //  Convert to ObjectId (important for populate)
    const categoryObjectId = new mongoose.Types.ObjectId(categoryID);
    const brandObjectId = new mongoose.Types.ObjectId(brandID);
    const unitObjectId = new mongoose.Types.ObjectId(unit);

    // Create new product
    const product = new productModel({
      name,
      details,
      categoryID: categoryObjectId,
      brandID: brandObjectId,
      unit: unitObjectId,
      qty: qty || 0,
      decimal: decimal || 0,
      manageStock: manageStock !== undefined ? manageStock : true,
      reorderLevel: reorderLevel || 0,
      unitCost,
      mrp,
      dp,
      taxPercent: taxPercent || 0,
      discountPercent: discountPercent || 0,
      barcode: barcode || "",
      serialNumbers: serialNumbers || [],
      status: status !== undefined ? status : true,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};

const getProductsList = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const perPage = parseInt(req.params.perPage) || 10;
    const searchKey = req.params.search === "0" ? "" : req.params.search;

    // Build filter
    let filter = {};
    if (searchKey && searchKey !== "0") {
      // এখানে name বা details এর মধ্যে search হবে
      filter = {
        $or: [
          { name: { $regex: searchKey, $options: "i" } },
          { details: { $regex: searchKey, $options: "i" } },
        ],
      };
    }

    const total = await productModel.countDocuments(filter);
    const products = await productModel
      .find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 })
      .populate([
        { path: "categoryID", select: "name" }, // category name
        { path: "brandID", select: "name" }, // brand name
        { path: "unit", select: "name" }, // unit name
      ]);

    res.json({
      success: true,
      message: "Products fetched successfully",
      data: products,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addProduct,
  getProductsList,
};
