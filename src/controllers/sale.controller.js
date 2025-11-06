const mongoose = require("mongoose");
const saleModel = require("../models/sale.model");
const productModel = require("../models/Product.model");
const saleReturnModel = require("../models/saleReturn.model");
const customerModel = require("../models/customer.model");

const addSale = async (req, res) => {
  try {
    let {
      customerId,
      customerName,
      items,
      subTotal,
      discount,
      grandTotal,
      paidAmount,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sale must include at least one product.",
      });
    }

    if (customerId) customerId = new mongoose.Types.ObjectId(customerId);

    const dueAmount = grandTotal - paidAmount;
    let paymentStatus =
      paidAmount === 0
        ? "pending"
        : paidAmount < grandTotal
        ? "partial"
        : "paid";

    // 🔹 STOCK REDUCTION (FIFO or Manual)
    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product)
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });

      if (item.productId)
        item.productId = new mongoose.Types.ObjectId(item.productId);

      let qtyToSell = item.qty;
      let batchesUsed = [];

      // ✅ Manual batches
      if (item.batchesUsed && item.batchesUsed.length > 0) {
        for (const batchInfo of item.batchesUsed) {
          const batch = product.batches.find(
            (b) => String(b._id) === String(batchInfo.batchId)
          );

          if (!batch)
            return res
              .status(400)
              .json({
                success: false,
                message: `Batch not found for ${item.name}`,
              });

          if (batch.qty < batchInfo.qty)
            return res.status(400).json({
              success: false,
              message: `Not enough qty in batch ${batch._id} for ${item.name}`,
            });

          batch.qty -= batchInfo.qty;
          qtyToSell -= batchInfo.qty;

          batchesUsed.push({
            batchId: batch._id,
            qty: batchInfo.qty,
            unitCost: batch.unitCost,
            purchaseDate: batch.purchaseDate,
          });
        }
      }
      // ✅ FIFO
      else if (product.batches && product.batches.length > 0) {
        for (let batch of product.batches) {
          if (qtyToSell <= 0) break;
          if (batch.qty === 0) continue;

          const deductQty = Math.min(qtyToSell, batch.qty);
          batch.qty -= deductQty;
          qtyToSell -= deductQty;

          batchesUsed.push({
            batchId: batch._id,
            qty: deductQty,
            unitCost: batch.unitCost,
            purchaseDate: batch.purchaseDate,
          });
        }
      }

      // ✅ Remove empty batches
      product.batches = product.batches.filter((b) => b.qty > 0);

      // ✅ Recalculate total stock dynamically
      product.stock = product.batches.reduce((acc, b) => acc + b.qty, 0);

      await product.save();

      // attach batchesUsed for record
      item.batchesUsed = batchesUsed;
    }

    // 🔹 SAVE SALE ENTRY
    const sale = await saleModel.create({
      customerId: customerId || null,
      customerName: customerName || "Walk-in Customer",
      items,
      subTotal,
      discount,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentStatus,
    });

    res.status(201).json({
      success: true,
      message: "Sale added successfully (FIFO / Manual batch applied)",
      data: sale,
    });
  } catch (error) {
    console.error("Sale Add Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// const addSale = async (req, res) => {
//   try {
//     let {
//       customerId,
//       customerName,
//       items,
//       subTotal,
//       discount,
//       grandTotal,
//       paidAmount,
//     } = req.body;

//     if (!items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Sale must include at least one product.",
//       });
//     }

//     // Convert ObjectId for customer if exists
//     if (customerId) customerId = new mongoose.Types.ObjectId(customerId);

//     // Calculate due + payment status
//     const dueAmount = grandTotal - paidAmount;
//     let paymentStatus = "pending";
//     if (paidAmount === 0) paymentStatus = "pending";
//     else if (paidAmount < grandTotal) paymentStatus = "partial";
//     else paymentStatus = "paid";

//     // -----------------------------
//     // 🔹 STOCK REDUCTION (FIFO or Manual)
//     // -----------------------------
//     for (const item of items) {
//       const product = await productModel.findById(item.productId);
//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: `Product not found: ${item.productId}`,
//         });
//       }

//       if (item.productId)
//         item.productId = new mongoose.Types.ObjectId(item.productId);

//       let qtyToSell = item.qty;
//       let batchesUsed = [];

//       // ✅ If user manually selected batches
//       if (item.batchesUsed && item.batchesUsed.length > 0) {
//         for (const batchInfo of item.batchesUsed) {
//           const batch = product.batches.find(
//             (b) => String(b._id) === String(batchInfo.batchId)
//           );
//           if (!batch)
//             return res
//               .status(400)
//               .json({
//                 success: false,
//                 message: `Batch not found for ${item.name}`,
//               });

//           if (batch.qty < batchInfo.qty)
//             return res.status(400).json({
//               success: false,
//               message: `Not enough qty in batch ${batch._id} for ${item.name}`,
//             });

//           batch.qty -= batchInfo.qty;
//           qtyToSell -= batchInfo.qty;

//           batchesUsed.push({
//             batchId: batch._id,
//             qty: batchInfo.qty,
//             unitCost: batch.unitCost,
//             purchaseDate: batch.purchaseDate,
//           });
//         }
//       }
//       // ✅ Else use FIFO
//       else if (product.batches && product.batches.length > 0) {
//         for (let batch of product.batches) {
//           if (qtyToSell <= 0) break;
//           if (batch.qty === 0) continue;

//           const deductQty = Math.min(qtyToSell, batch.qty);
//           batch.qty -= deductQty;
//           qtyToSell -= deductQty;

//           batchesUsed.push({
//             batchId: batch._id,
//             qty: deductQty,
//             unitCost: batch.unitCost,
//             purchaseDate: batch.purchaseDate,
//           });
//         }
//       }

//       product.batches = product.batches.filter((b) => b.qty > 0);
//       product.stock = Math.max((product.stock || 0) - item.qty, 0);

//       await product.save();
//       item.batchesUsed = batchesUsed;
//     }

//     // -----------------------------
//     // 🔹 SAVE SALE ENTRY
//     // -----------------------------
//     const sale = await saleModel.create({
//       customerId: customerId || null,
//       customerName: customerName || "Walk-in Customer",
//       items,
//       subTotal,
//       discount,
//       grandTotal,
//       paidAmount,
//       dueAmount,
//       paymentStatus,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Sale added successfully (FIFO / Manual batch applied)",
//       data: sale,
//     });
//   } catch (error) {
//     console.error("Sale Add Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// const addSale = async (req, res) => {
//   try {
//     let {
//       customerId,
//       customerName,
//       items,
//       subTotal,
//       discount,
//       grandTotal,
//       paidAmount,
//     } = req.body;

//     if (!items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Sale must include at least one product.",
//       });
//     }

//     // ObjectId conversion
//     if (customerId) customerId = new mongoose.Types.ObjectId(customerId);

//     //  Calculate due + payment status
//     const dueAmount = grandTotal - paidAmount;
//     let paymentStatus = "pending";
//     if (paidAmount === 0) paymentStatus = "pending";
//     else if (paidAmount < grandTotal) paymentStatus = "partial";
//     else paymentStatus = "paid";

//     //  FIFO STOCK REDUCTION
//     for (const item of items) {
//       const product = await productModel.findById(item.productId);
//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: `Product not found: ${item.productId}`,
//         });
//       }

//       // ObjectId conversion for product relations (optional)
//       if (item.productId)
//         item.productId = new mongoose.Types.ObjectId(item.productId);

//       // যদি ব্যাচ সিস্টেম থাকে
//       let qtyToSell = item.qty;

//       if (product.batches && product.batches.length > 0) {
//         for (let batch of product.batches) {
//           if (qtyToSell <= 0) break;
//           if (batch.qty === 0) continue;

//           const deductQty = Math.min(qtyToSell, batch.qty);
//           batch.qty -= deductQty;
//           qtyToSell -= deductQty;
//         }

//         product.batches = product.batches.filter((b) => b.qty > 0);
//       }

//       product.stock = Math.max((product.stock || 0) - item.qty, 0);
//       await product.save();
//     }

//     //  Save sale entry
//     const sale = await saleModel.create({
//       customerId: customerId || null,
//       customerName: customerName || "Walk-in Customer",
//       items,
//       subTotal,
//       discount,
//       grandTotal,
//       paidAmount,
//       dueAmount,
//       paymentStatus,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Sale added successfully (FIFO applied)",
//       data: sale,
//     });
//   } catch (error) {
//     console.error("Sale Add Error:", error);
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
        path: "customerId",
        select: "name phone email",
      })
      .populate({
        path: "items.productId",
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

const editSale = async (req, res) => {
  try {
    const { id } = req.params; // saleId
    const {
      customerId,
      customerName,
      items,
      subTotal,
      discount,
      grandTotal,
      paidAmount,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sale must include at least one product.",
      });
    }

    const sale = await saleModel.findById(id);
    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    // Step 1: Rollback previous sale stock (increase stock back)
    for (const item of sale.items) {
      const product = await productModel.findById(item.productId);
      if (product) {
        product.stock = (product.stock || 0) + item.qty;
        if (product.batches && product.batches.length > 0) {
          product.batches.unshift({
            qty: item.qty,
            unitCost: item.price,
            purchaseDate: new Date(),
          });
        }
        await product.save();
      }
    }

    // Step 2: Apply new sale stock deduction
    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      let qtyToSell = item.qty;
      if (product.batches && product.batches.length > 0) {
        for (let batch of product.batches) {
          if (qtyToSell <= 0) break;
          if (batch.qty === 0) continue;

          const deductQty = Math.min(batch.qty, qtyToSell);
          batch.qty -= deductQty;
          qtyToSell -= deductQty;
        }
        product.batches = product.batches.filter((b) => b.qty > 0);
      }

      product.stock = Math.max((product.stock || 0) - item.qty, 0);
      await product.save();
    }

    // Step 3: Update sale document
    const dueAmount = grandTotal - paidAmount;
    let paymentStatus = "pending";
    if (paidAmount === 0) paymentStatus = "pending";
    else if (paidAmount < grandTotal) paymentStatus = "partial";
    else paymentStatus = "paid";

    sale.customerId = customerId || null;
    sale.customerName = customerName || "Walk-in Customer";
    sale.items = items;
    sale.subTotal = subTotal;
    sale.discount = discount;
    sale.grandTotal = grandTotal;
    sale.paidAmount = paidAmount;
    sale.dueAmount = dueAmount;
    sale.paymentStatus = paymentStatus;

    await sale.save();

    res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      data: sale,
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
    const { saleId, items, totalReturnAmount } = req.body;

    if (!saleId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sale ID and items are required.",
      });
    }

    // Sale খুঁজে বের করো
    const sale = await saleModel.findById(saleId);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found.",
      });
    }

    // প্রতিটি product এর stock restore করো
    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product) continue;

      // FIFO অনুযায়ী নতুন batch যোগ করা সবচেয়ে সহজ ও clean
      product.batches.push({
        qty: item.qty,
        unitCost: product.unitCost,
        purchaseDate: new Date(),
      });

      // total stock restore
      product.stock = (product.stock || 0) + item.qty;
      await product.save();
    }

    // Return entry সংরক্ষণ করো
    const saleReturn = await saleReturnModel.create({
      saleId,
      customerId: sale.customerId,
      items,
      totalReturnAmount,
    });

    res.status(201).json({
      success: true,
      message: "Sale return processed successfully",
      data: saleReturn,
    });
  } catch (error) {
    console.error("Sale Return Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addSale,
  getSalesList,
  deleteSale,
  addSaleReturn,
  editSale,
};
