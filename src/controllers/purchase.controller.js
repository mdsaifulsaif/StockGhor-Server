const purchaseModel = require("../models/purchase.model");
const productModel = require("../models/Product.model");

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

module.exports = {
  addPurchase,
};
