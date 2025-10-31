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

    //  Calculate and update stock automatically
    for (const item of products) {
      console.log(item);
      const product = await productModel.findById(item.productID);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productID}`,
        });
      }

      // Update stock
      product.stock = (product.stock || 0) + item.qty;
      await product.save();
    }

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
      message: "Purchase added successfully.",
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
