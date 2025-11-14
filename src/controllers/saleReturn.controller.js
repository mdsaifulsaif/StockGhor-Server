const mongoose = require("mongoose");
const saleModel = require("../models/sale.model");
const productModel = require("../models/Product.model");
const saleReturnModel = require("../models/saleReturn.model");
const customerModel = require("../models/customer.model");
const BatchModel = require("../models/Batch");

const addSaleReturn = async (req, res) => {
  try {
    const { saleId } = req.params; // Sale ID from params
    const { returnItems, note } = req.body;

    if (!saleId || !returnItems || returnItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sale ID and return items are required",
      });
    }

    // Find Sale
    const sale = await saleModel.findById(saleId).populate("customerID");
    if (!sale)
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });

    let totalAmount = 0;
    const returnedProducts = [];

    // ===============================
    // LOOP THROUGH RETURN ITEMS
    // ===============================
    for (const item of returnItems) {
      const product = await productModel.findById(item.productID);
      if (!product) continue;

      // -------------------------------
      // 1 Find sold quantity
      // -------------------------------
      const soldItem = sale.items.find(
        (i) => i.productID.toString() === item.productID
      );

      if (!soldItem) continue;

      const soldQty = soldItem.qty;

      // -------------------------------
      // 2 Find previously returned qty
      // -------------------------------
      const previousReturns = await saleReturnModel.aggregate([
        { $match: { saleId: sale._id } },
        { $unwind: "$returnedProducts" },
        { $match: { "returnedProducts.productID": product._id } },
        {
          $group: {
            _id: null,
            totalReturned: { $sum: "$returnedProducts.qty" },
          },
        },
      ]);

      const alreadyReturned = previousReturns.length
        ? previousReturns[0].totalReturned
        : 0;

      // -------------------------------
      // 3 Calculate allowed return qty
      // -------------------------------
      const allowedReturn = soldQty - alreadyReturned;

      if (item.returnQty > allowedReturn) {
        return res.status(400).json({
          success: false,
          message: `Cannot return more than allowed. Sold: ${soldQty}, Already Returned: ${alreadyReturned}, Allowed: ${allowedReturn}`,
        });
      }

      // ===============================
      // 4 Return Stock to batches
      // ===============================

      let qtyToReturn = item.returnQty;
      const batches = await BatchModel.find({ productId: item.productID }).sort(
        { purchaseDate: 1 }
      );

      let totalReturnedThisProduct = 0;

      for (const batch of batches) {
        if (qtyToReturn <= 0) break;

        const soldFromBatch = batch.purchaseQty - batch.remainingQty;
        const deductQty = Math.min(soldFromBatch, qtyToReturn);
        if (deductQty <= 0) continue;

        batch.remainingQty += deductQty;
        await batch.save();

        returnedProducts.push({
          productID: item.productID,
          batchId: batch._id,
          qty: deductQty,
          unitCost: batch.unitCost,
          total: deductQty * batch.unitCost,
          reason: item.reason || "",
        });

        totalAmount += deductQty * batch.unitCost;
        totalReturnedThisProduct += deductQty;
        qtyToReturn -= deductQty;
      }

      // -------------------------------
      // 5 Update product stock
      // -------------------------------
      if (totalReturnedThisProduct > 0) {
        product.totalStock =
          (product.totalStock || 0) + totalReturnedThisProduct;
        await product.save();
      }
    }

    // ===============================
    // 6 Update customer balance
    // ===============================
    if (sale.customerID) {
      sale.customerID.balance = Math.max(
        (sale.customerID.balance || 0) - totalAmount,
        0
      );
      await sale.customerID.save();
    }

    // ===============================
    // 7 Save Return Record
    // ===============================
    const saleReturn = new saleReturnModel({
      saleId,
      returnedProducts,
      totalAmount,
      note: note || "",
    });

    await saleReturn.save();

    res.status(200).json({
      success: true,
      message: "Sale return processed successfully",
      data: {
        saleReturn,
        updatedStock: returnedProducts.map((r) => ({
          productID: r.productID,
          returnedQty: r.qty,
        })),
        updatedCustomerBalance: sale.customerID ? sale.customerID.balance : 0,
      },
    });
  } catch (error) {
    console.error("Sale Return Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addSaleReturn,
};
