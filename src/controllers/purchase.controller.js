const purchaseModel = require("../models/purchase.model");
const productModel = require("../models/Product.model");
const categoryModel = require("../models/category.model");

//  Add New Purchase
const addPurchase = async (req, res) => {
  try {
    const { products, supplierName, supplierPhone, totalAmount, dueAmount } =
      req.body;

    // Validation
    if (!products || products.length === 0 || !supplierName || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Products, supplier name, and total amount are required.",
      });
    }

    // Loop through products and update product batches
    for (const item of products) {
      const { productID, qty, unitCost } = item;

      const product = await productModel.findById(productID);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${productID}`,
        });
      }

      // ✅ Push new batch (FIFO logic)
      product.batches.push({
        qty: qty,
        unitCost: unitCost,
        purchaseDate: new Date(),
      });

      // ✅ Update total stock
      product.stock = (product.stock || 0) + qty;

      // ✅ Update latest cost for display/reference
      product.unitCost = unitCost;

      await product.save();
    }

    // ✅ Save purchase record
    const newPurchase = new purchaseModel({
      products,
      supplierName,
      supplierPhone,
      totalAmount,
      dueAmount: dueAmount || 0,
    });

    await newPurchase.save();

    res.status(201).json({
      success: true,
      message: "Purchase added successfully with FIFO batches.",
      data: newPurchase,
    });
  } catch (error) {
    console.error("Add Purchase Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPurchasesList = async (req, res) => {
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
          { supplierName: { $regex: searchKey, $options: "i" } },
          { supplierPhone: { $regex: searchKey, $options: "i" } },
        ],
      };
    }

    const total = await purchaseModel.countDocuments(filter);
    const purchases = await purchaseModel
      .find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 })
      .populate({
        path: "products.productID",
        select: "name unitCost mrp dp categoryID brandID",
        populate: [
          { path: "categoryID", select: "name" },
          { path: "brandID", select: "name" },
        ],
      });

    res.json({
      success: true,
      message: "Purchase products fetched successfully",
      data: purchases,
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
  addPurchase,
  getPurchasesList,
};
