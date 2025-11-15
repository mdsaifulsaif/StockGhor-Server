const mongoose = require("mongoose");
const saleModel = require("../models/sale.model");
const productModel = require("../models/Product.model");
const saleReturnModel = require("../models/saleReturn.model");
const customerModel = require("../models/customer.model");
const BatchModel = require("../models/Batch");

// with out due manage sale
// const addSale = async (req, res) => {
//   try {
//     const { customerID, items, discount, tax, paidAmount, note } = req.body;

//     if (!customerID || !items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Customer ID and items are required.",
//       });
//     }

//     // ✅ Get Customer Info
//     const customer = await customerModel.findById(customerID);
//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found.",
//       });
//     }

//     let subTotal = 0;
//     let totalProfit = 0;
//     const soldItems = [];

//     for (const item of items) {
//       const product = await productModel.findById(item.productID);
//       if (!product) continue;

//       // ✅ Check stock availability
//       if (item.qty > product.totalStock) {
//         return res.status(400).json({
//           success: false,
//           message: `Insufficient stock for ${product.name}. Available: ${product.totalStock}`,
//         });
//       }

//       let qtyToSell = item.qty;
//       let totalItemAmount = 0;
//       let totalItemProfit = 0;

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
//         const itemProfit = deductQty * (item.unitPrice - batch.unitCost);

//         totalItemAmount += itemTotal;
//         totalItemProfit += itemProfit;

//         soldItems.push({
//           productID: item.productID,
//           batchId: batch._id,
//           qty: deductQty,
//           unitPrice: item.unitPrice,
//           unitCost: batch.unitCost,
//           total: itemTotal,
//           profit: itemProfit,
//         });

//         qtyToSell -= deductQty;
//       }

//       // ✅ Update Product Stock
//       product.totalStock -= item.qty;
//       if (product.totalStock < 0) product.totalStock = 0;
//       await product.save();

//       subTotal += totalItemAmount;
//       totalProfit += totalItemProfit;
//     }

//     // ✅ Financial calculations
//     const grandTotal = subTotal - (discount || 0) + (tax || 0);
//     let dueAmount = grandTotal - (paidAmount || 0);

//     // ✅ Add previous due into current balance
//     const totalDue = customer.previousDue + dueAmount;

//     // ✅ Create Sale Record
//     const sale = new saleModel({
//       customerID,
//       items: soldItems,
//       subTotal,
//       discount,
//       tax,
//       grandTotal,
//       paidAmount,
//       dueAmount,
//       totalProfit,
//       note,
//       invoiceNo: "INV-" + Date.now(),
//     });

//     await sale.save();

//     // ✅ Update Customer Balance
//     customer.balance = totalDue; // previousDue + new due
//     customer.previousDue = 0; // যদি চাও এইটা clear করে দেবে (optional)
//     await customer.save();

//     res.status(200).json({
//       success: true,
//       message: "Sale processed successfully",
//       data: {
//         sale,
//         customerBalance: customer.balance,
//       },
//     });
//   } catch (error) {
//     console.error("Add Sale Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const addSale = async (req, res) => {
  try {
    const {
      customerID,
      items,
      discount = 0,
      tax = 0,
      paidAmount = 0,
      note,
    } = req.body;

    if (!customerID || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and items are required.",
      });
    }

    // --- Get Customer ---
    const customer = await customerModel.findById(customerID);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    let subTotal = 0;
    let totalProfit = 0;
    const soldItems = [];

    // --- Loop All Sale Items ---
    for (const item of items) {
      const product = await productModel.findById(item.productID);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productID}`,
        });
      }

      // ----------------------------
      // VALIDATION FIXES
      // ----------------------------
      if (!item.qty || item.qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid qty for product ${product.name}`,
        });
      }

      if (!item.unitPrice || Number(item.unitPrice) <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid unit price for product ${product.name}`,
        });
      }
      // ----------------------------

      // --- Check Stock ---
      if (item.qty > product.totalStock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.totalStock}`,
        });
      }

      let qtyToSell = item.qty;
      let soldQty = 0;
      let totalItemAmount = 0;
      let totalItemProfit = 0;

      // --- FIFO Batches ---
      const batches = await BatchModel.find({
        productId: item.productID,
        remainingQty: { $gt: 0 },
      }).sort({ purchaseDate: 1 });

      for (const batch of batches) {
        if (qtyToSell <= 0) break;

        const deductQty = Math.min(batch.remainingQty, qtyToSell);

        batch.remainingQty -= deductQty;
        await batch.save();

        soldQty += deductQty;

        const unitPrice = Number(item.unitPrice);
        const unitCost = Number(batch.unitCost);

        const itemTotal = deductQty * unitPrice;
        const itemProfit = deductQty * (unitPrice - unitCost);

        totalItemAmount += itemTotal;
        totalItemProfit += itemProfit;

        soldItems.push({
          productID: item.productID,
          batchId: batch._id,
          qty: deductQty,
          unitPrice,
          unitCost,
          total: itemTotal,
          profit: itemProfit,
        });

        qtyToSell -= deductQty;
      }

      // Update Product Stock
      product.totalStock -= soldQty;
      if (product.totalStock < 0) product.totalStock = 0;
      await product.save();

      subTotal += totalItemAmount;
      totalProfit += totalItemProfit;
    }

    // --- Final Amounts ---
    const grandTotal = subTotal - discount + tax;
    const dueAmount = grandTotal - paidAmount;

    customer.balance += dueAmount;

    // --- Create Sale ---
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

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Sale processed successfully",
      sale,
      customerBalance: customer.balance,
    });
  } catch (error) {
    console.error("Add Sale Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// const addSale = async (req, res) => {
//   try {
//     const {
//       customerID,
//       items,
//       discount = 0,
//       tax = 0,
//       paidAmount = 0,
//       note,
//     } = req.body;

//     if (!customerID || !items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Customer ID and items are required.",
//       });
//     }

//     // --- Get Customer ---
//     const customer = await customerModel.findById(customerID);
//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found.",
//       });
//     }

//     let subTotal = 0;
//     let totalProfit = 0;
//     const soldItems = [];

//     // --- Loop All Items ---
//     for (const item of items) {
//       const product = await productModel.findById(item.productID);
//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: `Product not found: ${item.productID}`,
//         });
//       }

//       // --- Check Stock ---
//       if (item.qty > product.totalStock) {
//         return res.status(400).json({
//           success: false,
//           message: `Insufficient stock for ${product.name}. Available: ${product.totalStock}`,
//         });
//       }

//       let qtyToSell = item.qty;
//       let soldQty = 0; //  actual sold qty (bug fix)
//       let totalItemAmount = 0;
//       let totalItemProfit = 0;

//       // --- FIFO Batches ---
//       const batches = await BatchModel.find({
//         productId: item.productID,
//         remainingQty: { $gt: 0 },
//       }).sort({ purchaseDate: 1 });

//       for (const batch of batches) {
//         if (qtyToSell <= 0) break;

//         const deductQty = Math.min(batch.remainingQty, qtyToSell);

//         batch.remainingQty -= deductQty;
//         await batch.save();

//         soldQty += deductQty; //  FIXED (main bug fix)

//         const itemTotal = deductQty * item.unitPrice;
//         const itemProfit = deductQty * (item.unitPrice - batch.unitCost);

//         totalItemAmount += itemTotal;
//         totalItemProfit += itemProfit;

//         soldItems.push({
//           productID: item.productID,
//           batchId: batch._id,
//           qty: deductQty,
//           unitPrice: item.unitPrice,
//           unitCost: batch.unitCost,
//           total: itemTotal,
//           profit: itemProfit,
//         });

//         qtyToSell -= deductQty;
//       }

//       // --- Update Product Stock ---
//       product.totalStock -= soldQty; //  Correct stock reduction
//       if (product.totalStock < 0) product.totalStock = 0;
//       await product.save();

//       subTotal += totalItemAmount;
//       totalProfit += totalItemProfit;
//     }

//     // --- Final Calculations ---
//     const grandTotal = subTotal - discount + tax;
//     const dueAmount = grandTotal - paidAmount;

//     // --- Customer Balance Update ---
//     const updatedBalance = customer.balance + dueAmount;

//     // --- Create Sale ---
//     const sale = new saleModel({
//       customerID,
//       items: soldItems,
//       subTotal,
//       discount,
//       tax,
//       grandTotal,
//       paidAmount,
//       dueAmount,
//       totalProfit,
//       note,
//       invoiceNo: "INV-" + Date.now(),
//     });

//     await sale.save();

//     // --- Update Customer ---
//     customer.balance = updatedBalance;
//     await customer.save();

//     res.status(200).json({
//       success: true,
//       message: "Sale processed successfully",
//       sale,
//       customerBalance: customer.balance,
//     });
//   } catch (error) {
//     console.error("Add Sale Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

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

// const editSale = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { saleId } = req.params; // ✅ saleId from params
//     const { customerID, items, paidAmount, status } = req.body;

//     if (!saleId || !items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Sale ID and items are required",
//       });
//     }

//     // 🔹 Find sale
//     const existingSale = await saleModel.findById(saleId).session(session);
//     if (!existingSale) {
//       return res.status(404).json({
//         success: false,
//         message: "Sale not found",
//       });
//     }

//     // 🔹 Find customer
//     const customer = await customerModel
//       .findById(customerID || existingSale.customerID)
//       .session(session);

//     if (!customer) {
//       throw new Error("Customer not found");
//     }

//     // -------------------------------------------------------------
//     // 🔹 STEP 1: Revert previous sale stock + balance
//     // -------------------------------------------------------------
//     for (const oldItem of existingSale.items) {
//       const product = await productModel
//         .findById(oldItem.productID)
//         .session(session);

//       if (product) {
//         product.totalStock += oldItem.qty;
//         await product.save({ session });
//       }

//       if (oldItem.batchId) {
//         const batch = await BatchModel.findById(oldItem.batchId).session(
//           session
//         );
//         if (batch) {
//           batch.remainingQty += oldItem.qty;
//           await batch.save({ session });
//         }
//       }
//     }

//     // 🔹 revert customer balance
//     const prevDue = existingSale.totalAmount - existingSale.paidAmount;
//     customer.balance = Math.max((customer.balance || 0) - prevDue, 0);

//     // -------------------------------------------------------------
//     // 🔹 STEP 2: Apply new sale items
//     // -------------------------------------------------------------
//     let totalAmount = 0;
//     const processedItems = [];

//     for (const newItem of items) {
//       const product = await productModel
//         .findById(newItem.productID)
//         .session(session);
//       if (!product) continue;

//       let qtyToSell = newItem.qty;
//       let batchUsed = null;

//       // FIFO batches
//       const batches = await BatchModel.find({
//         productId: newItem.productID,
//         remainingQty: { $gt: 0 },
//       })
//         .sort({ purchaseDate: 1 })
//         .session(session);

//       for (const batch of batches) {
//         if (qtyToSell <= 0) break;

//         const deductQty = Math.min(batch.remainingQty, qtyToSell);
//         batch.remainingQty -= deductQty;
//         await batch.save({ session });

//         batchUsed = batch._id;
//         qtyToSell -= deductQty;
//       }

//       // Update product stock
//       product.totalStock = Math.max(product.totalStock - newItem.qty, 0);
//       await product.save({ session });

//       const itemTotal = newItem.qty * newItem.unitPrice;
//       totalAmount += itemTotal;

//       processedItems.push({
//         productID: newItem.productID,
//         qty: newItem.qty,
//         unitPrice: newItem.unitPrice,
//         total: itemTotal,
//         batchId: batchUsed,
//       });
//     }

//     // -------------------------------------------------------------
//     // 🔹 STEP 3: Update Sale Document
//     // -------------------------------------------------------------
//     const finalPaid = paidAmount ?? existingSale.paidAmount;
//     const dueAmount = totalAmount - finalPaid;

//     existingSale.customerID = customerID || existingSale.customerID;
//     existingSale.items = processedItems;
//     existingSale.totalAmount = totalAmount;
//     existingSale.paidAmount = finalPaid;
//     existingSale.dueAmount = dueAmount;
//     existingSale.status = status || existingSale.status;

//     await existingSale.save({ session });

//     // -------------------------------------------------------------
//     // 🔹 STEP 4: Update Customer Balance
//     // -------------------------------------------------------------
//     customer.balance += dueAmount;
//     await customer.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     return res.status(200).json({
//       success: true,
//       message: "Sale updated successfully",
//       sale: existingSale,
//       updatedCustomerBalance: customer.balance,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Edit Sale Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const editSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { saleId } = req.params;
    const { customerID, items, paidAmount, status } = req.body;

    if (!saleId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sale ID and items are required",
      });
    }

    // Fetch existing sale
    const existingSale = await saleModel.findById(saleId).session(session);
    if (!existingSale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    // Fetch customer
    const customer = await customerModel
      .findById(customerID || existingSale.customerID)
      .session(session);

    if (!customer) throw new Error("Customer not found");

    // -------------------------------------------
    // STEP 1: Revert old sale (Stock + Customer balance)
    // -------------------------------------------
    for (const oldItem of existingSale.items) {
      const product = await productModel
        .findById(oldItem.productID)
        .session(session);

      if (product) {
        product.totalStock += oldItem.qty;
        await product.save({ session });
      }

      const batch = await BatchModel.findById(oldItem.batchId).session(session);
      if (batch) {
        batch.remainingQty += oldItem.qty;
        await batch.save({ session });
      }
    }

    const previousDue = existingSale.totalAmount - existingSale.paidAmount;
    customer.balance = Math.max(customer.balance - previousDue, 0);

    // -------------------------------------------
    // STEP 2: Apply new sale items
    // -------------------------------------------
    let totalAmount = 0;
    let totalProfit = 0;
    const processedItems = [];

    for (const newItem of items) {
      const product = await productModel
        .findById(newItem.productID)
        .session(session);

      if (!product) continue;

      let qtyToSell = newItem.qty;
      let batchUsed = null;
      let unitCostForProfit = 0;

      const batches = await BatchModel.find({
        productId: newItem.productID,
        remainingQty: { $gt: 0 },
      })
        .sort({ purchaseDate: 1 })
        .session(session);

      for (const batch of batches) {
        if (qtyToSell <= 0) break;

        const deductQty = Math.min(batch.remainingQty, qtyToSell);

        // Reduce stock
        batch.remainingQty -= deductQty;
        await batch.save({ session });

        batchUsed = batch._id;
        unitCostForProfit = batch.unitCost; // FIXED

        qtyToSell -= deductQty;
      }

      // Update product stock
      product.totalStock = Math.max(product.totalStock - newItem.qty, 0);
      await product.save({ session });

      const itemTotal = newItem.qty * newItem.unitPrice;
      const itemProfit = newItem.qty * (newItem.unitPrice - unitCostForProfit); // FIXED

      totalAmount += itemTotal;
      totalProfit += itemProfit;

      processedItems.push({
        productID: newItem.productID,
        qty: newItem.qty,
        unitPrice: newItem.unitPrice,
        unitCost: unitCostForProfit, // FIXED
        total: itemTotal,
        profit: itemProfit, // FIXED
        batchId: batchUsed,
      });
    }

    // -------------------------------------------
    // STEP 3: Update Sale Document
    // -------------------------------------------
    const finalPaid = paidAmount ?? existingSale.paidAmount;
    const dueAmount = totalAmount - finalPaid;

    existingSale.customerID = customerID || existingSale.customerID;
    existingSale.items = processedItems;
    existingSale.totalAmount = totalAmount;
    existingSale.paidAmount = finalPaid;
    existingSale.dueAmount = dueAmount;
    existingSale.totalProfit = totalProfit; // FIXED
    existingSale.status = status || existingSale.status;

    await existingSale.save({ session });

    // -------------------------------------------
    // STEP 4: Update Customer Balance
    // -------------------------------------------
    customer.balance += dueAmount;
    await customer.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      sale: existingSale,
      updatedCustomerBalance: customer.balance,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Edit Sale Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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

module.exports = {
  addSale,
  getSalesList,
  getSaleDetail,
  deleteSale,
  editSale,
};
