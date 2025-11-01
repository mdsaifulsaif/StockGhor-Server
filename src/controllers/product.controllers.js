const mongoose = require("mongoose");
const productModel = require("../models/Product.model");

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

    // Required fields check
    if (!name || !categoryID || !brandID || !unit || !unitCost || !mrp || !dp) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields missing: name, categoryID, brandID, unit, unitCost, mrp, dp",
      });
    }

    if (qty < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
      });
    }

    // Convert to ObjectId
    const categoryObjectId = new mongoose.Types.ObjectId(categoryID);
    const brandObjectId = new mongoose.Types.ObjectId(brandID);
    const unitObjectId = new mongoose.Types.ObjectId(unit);

    // ✅ Create new product with first FIFO batch if qty > 0
    const product = new productModel({
      name,
      details,
      categoryID: categoryObjectId,
      brandID: brandObjectId,
      unit: unitObjectId,
      stock: qty || 0, // total available stock
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
      batches:
        qty && qty > 0
          ? [
              {
                qty: qty,
                unitCost: unitCost,
                purchaseDate: new Date(),
              },
            ]
          : [],
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully (FIFO ready)",
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
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

const getAllProducts = async (req, res) => {
  try {
    const products = await productModel.find({}).select("-batches");

    res.status(200).json({
      success: true,
      message: "All product fetched successfully",
      // data: products.map((c) => ({
      //   _id: c._id,
      //   name: c.name,
      // })),
      data: products,
    });
  } catch (error) {
    console.error("All product Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addProduct,
  getProductsList,
  getAllProducts,
};
