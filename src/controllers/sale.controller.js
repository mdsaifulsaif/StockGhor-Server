const mongoose = require("mongoose");
const saleModel = require("../models/sale.model");
const productModel = require("../models/Product.model");
const saleReturnModel = require("../models/saleReturn.model");
const customerModel = require("../models/customer.model");
const BatchModel = require("../models/Batch");

// const addSale = async (req, res) => {
//   try {
//     const { customerID, items, discount, tax, paidAmount, note } = req.body;

//     if (!customerID || !items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Customer ID and items are required.",
//       });
//     }

//     let subTotal = 0;
//     let soldItems = [];

//     for (const item of items) {
//       const product = await productModel.findById(item.productID);
//       if (!product) continue;

//       let qtyToSell = item.qty;
//       let totalItemAmount = 0;

//       // FIFO Batch Reduction
//       const batches = await BatchModel.find({
//         productId: item.productID,
//         remainingQty: { $gt: 0 },
//       }).sort({ purchaseDate: 1 });

//       for (const batch of batches) {
//         if (qtyToSell <= 0) break;

//         const deductQty = Math.min(batch.remainingQty, qtyToSell);
//         batch.remainingQty -= deductQty;
//         await batch.save();

//         const itemTotal = deductQty * item.unitPrice;
//         totalItemAmount += itemTotal;

//         soldItems.push({
//           productID: item.productID,
//           batchId: batch._id,
//           qty: deductQty,
//           unitPrice: item.unitPrice,
//           total: itemTotal,
//         });

//         qtyToSell -= deductQty;
//       }

//       // Update Product Stock
//       product.totalStock = Math.max(product.totalStock - item.qty, 0);
//       await product.save();

//       subTotal += totalItemAmount;
//     }

//     const grandTotal = subTotal - (discount || 0) + (tax || 0);
//     const dueAmount = grandTotal - (paidAmount || 0);

//     const sale = new saleModel({
//       customerID,
//       items: soldItems,
//       subTotal,
//       discount,
//       tax,
//       grandTotal,
//       paidAmount,
//       dueAmount,
//       note,
//       invoiceNo: "INV-" + Date.now(),
//     });

//     await sale.save();

//     res.status(200).json({
//       success: true,
//       message: "Sale processed successfully",
//       data: sale,
//     });
//   } catch (error) {
//     console.error("Add Sale Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const addSale = async (req, res) => {
  try {
    const { customerID, items, discount, tax, paidAmount, note } = req.body;

    if (!customerID || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and items are required.",
      });
    }

    let subTotal = 0;
    let totalProfit = 0;
    const soldItems = [];

    for (const item of items) {
      const product = await productModel.findById(item.productID);
      if (!product) continue;

      // ✅ Check stock availability
      if (item.qty > product.totalStock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.totalStock}`,
        });
      }

      let qtyToSell = item.qty;
      let totalItemAmount = 0;
      let totalItemProfit = 0;

      // FIFO Batch Reduction
      const batches = await BatchModel.find({
        productId: item.productID,
        remainingQty: { $gt: 0 },
      }).sort({ purchaseDate: 1 });

      for (const batch of batches) {
        if (qtyToSell <= 0) break;

        const deductQty = Math.min(batch.remainingQty, qtyToSell);
        batch.remainingQty -= deductQty;
        await batch.save();

        const itemTotal = deductQty * item.unitPrice;
        const itemProfit = deductQty * (item.unitPrice - batch.unitCost);

        totalItemAmount += itemTotal;
        totalItemProfit += itemProfit;

        soldItems.push({
          productID: item.productID,
          batchId: batch._id,
          qty: deductQty,
          unitPrice: item.unitPrice,
          unitCost: batch.unitCost,
          total: itemTotal,
          profit: itemProfit,
        });

        qtyToSell -= deductQty;
      }

      // Update Product Stock
      product.totalStock -= item.qty;
      if (product.totalStock < 0) product.totalStock = 0;
      await product.save();

      subTotal += totalItemAmount;
      totalProfit += totalItemProfit;
    }

    const grandTotal = subTotal - (discount || 0) + (tax || 0);
    const dueAmount = grandTotal - (paidAmount || 0);

    const sale = new saleModel({
      customerID,
      items: soldItems,
      subTotal,
      discount,
      tax,
      grandTotal,
      paidAmount,
      dueAmount,
      totalProfit,
      note,
      invoiceNo: "INV-" + Date.now(),
    });

    await sale.save();

    res.status(200).json({
      success: true,
      message: "Sale processed successfully",
      data: sale,
    });
  } catch (error) {
    console.error("Add Sale Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSalesList = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const perPage = parseInt(req.params.perPage) || 10;
    const searchKey = req.params.search === "0" ? "" : req.params.search;

    // 🔹 Build filter
    let filter = {};
    if (searchKey && searchKey.trim() !== "") {
      filter = {
        $or: [
          { customerName: { $regex: searchKey, $options: "i" } },
          { "items.name": { $regex: searchKey, $options: "i" } },
        ],
      };
    }

    const total = await saleModel.countDocuments(filter);

    const sales = await saleModel
      .find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 })
      .populate({
        path: "customerID",
        select: "name phone email",
      })
      .populate({
        path: "items.productID",
        select: "name dp mrp unitCost",
        populate: [
          { path: "categoryID", select: "name" },
          { path: "brandID", select: "name" },
        ],
      });

    res.json({
      success: true,
      message: "Sales fetched successfully",
      data: sales,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get Sales Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSaleDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await saleModel
      .findById(id)
      .populate("customerID", "name mobile address")
      .populate({
        path: "items.productID",
        select: "name mrp salePrice categoryID brandID",
        populate: [
          { path: "categoryID", select: "name" },
          { path: "brandID", select: "name" },
        ],
      })
      .populate("items.batchId", "batchNo unitCost")
      .lean();

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sale details fetched successfully",
      data: sale,
    });
  } catch (error) {
    console.error("Get Sale Detail Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const editSale = async (req, res) => {
  try {
    const { saleId, customerID, items, paidAmount, status } = req.body;
    if (!saleId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sale ID and items are required",
      });
    }

    const existingSale = await saleModel.findById(saleId);
    if (!existingSale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    // 🔹 Step 1: Revert old stock
    for (const oldItem of existingSale.items) {
      const product = await productModel.findById(oldItem.productID);
      if (product) {
        product.totalStock += oldItem.qty;
        await product.save();
      }

      if (oldItem.batchId) {
        const batch = await BatchModel.findById(oldItem.batchId);
        if (batch) {
          batch.remainingQty += oldItem.qty;
          await batch.save();
        }
      }
    }

    // 🔹 Step 2: Process new items & adjust stock
    let totalAmount = 0;
    const processedItems = [];

    for (const newItem of items) {
      const product = await productModel.findById(newItem.productID);
      if (!product) continue;

      let qtyToSell = newItem.qty;

      // Fetch batches in FIFO order
      const batches = await BatchModel.find({
        productId: newItem.productID,
        remainingQty: { $gt: 0 },
      }).sort({ purchaseDate: 1 });

      let batchUsed = null;

      for (const batch of batches) {
        if (qtyToSell <= 0) break;

        const deductQty = Math.min(batch.remainingQty, qtyToSell);
        batch.remainingQty -= deductQty;
        await batch.save();

        batchUsed = batch._id; // last used batch for reference
        qtyToSell -= deductQty;
      }

      // Update product stock
      product.totalStock = Math.max(product.totalStock - newItem.qty, 0);
      await product.save();

      const itemTotal = newItem.qty * newItem.unitPrice;
      totalAmount += itemTotal;

      processedItems.push({
        productID: newItem.productID,
        qty: newItem.qty,
        unitPrice: newItem.unitPrice,
        total: itemTotal,
        batchId: batchUsed,
      });
    }

    // 🔹 Step 3: Update sale document
    existingSale.customerID = customerID || existingSale.customerID;
    existingSale.items = processedItems;
    existingSale.totalAmount = totalAmount;
    existingSale.paidAmount = paidAmount || existingSale.paidAmount;
    existingSale.dueAmount =
      totalAmount - (paidAmount || existingSale.paidAmount);
    existingSale.status = status || existingSale.status;

    await existingSale.save();

    res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      sale: existingSale,
    });
  } catch (error) {
    console.error("Edit Sale Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await saleModel.findById(id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    // প্রতিটি sale item এর জন্য stock restore করো
    for (const item of sale.items) {
      const product = await productModel.findById(item.productId);
      if (!product) continue;

      // FIFO অনুযায়ী: সর্বশেষ batch (যেটা বিক্রিতে কমেছে) তাতে আবার qty যোগ করো
      // যেহেতু আমরা sale এর সময় oldest batch থেকে qty কমাই,
      // delete করলে quantity ফিরিয়ে দিতে হবে newest batch-এ বা নতুন batch তৈরি করে।
      const restoreQty = item.qty;

      // যদি ব্যাচ থাকে, তাহলে শেষ batch-এ যোগ করো
      if (product.batches && product.batches.length > 0) {
        product.batches[product.batches.length - 1].qty += restoreQty;
      } else {
        // না থাকলে নতুন batch তৈরি করো
        product.batches.push({
          qty: restoreQty,
          unitCost: product.unitCost,
          purchaseDate: new Date(),
        });
      }

      // stock restore করো
      product.stock = (product.stock || 0) + restoreQty;
      await product.save();
    }

    // Sale delete করো
    await saleModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Sale deleted successfully and stock restored.",
    });
  } catch (error) {
    console.error("Delete Sale Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addSaleReturn = async (req, res) => {
  try {
    const { saleId, returnItems, note } = req.body;
    // returnItems = [{ productID, returnQty, reason }]

    if (!saleId || !returnItems || returnItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sale ID and return items are required",
      });
    }

    // Find Sale
    const sale = await saleModel.findById(saleId);
    if (!sale)
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });

    let totalAmount = 0;
    const returnedProducts = [];

    // Loop through each return item
    for (const item of returnItems) {
      const product = await productModel.findById(item.productID);
      if (!product) continue;

      let qtyToReturn = item.returnQty;

      // Fetch batches in **FIFO order** (oldest first)
      const batches = await BatchModel.find({
        productId: item.productID,
      }).sort({ purchaseDate: 1 });

      let totalReturnedThisProduct = 0;

      for (const batch of batches) {
        if (qtyToReturn <= 0) break;

        // Deduct quantity from batch
        const deductQty = Math.min(
          batch.purchaseQty - batch.remainingQty || 0,
          qtyToReturn
        );

        if (deductQty <= 0) continue;

        batch.remainingQty += deductQty; // Add back to stock
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

      // Update product total stock
      if (totalReturnedThisProduct > 0) {
        product.totalStock =
          (product.totalStock || 0) + totalReturnedThisProduct;
        await product.save();
      }
    }

    // Save Sale Return Record
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
      },
    });
  } catch (error) {
    console.error("Sale Return Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addSale,
  getSalesList,
  getSaleDetail,
  deleteSale,
  addSaleReturn,
  editSale,
};
