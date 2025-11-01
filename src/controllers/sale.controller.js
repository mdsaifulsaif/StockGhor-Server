const mongoose = require("mongoose");
const saleModel = require("../models/sale.model");
const productModel = require("../models/Product.model");
const customerModel = require("../models/customer.model");

// const addSale = async (req, res) => {
//   try {
//     const {
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

//       // যদি ব্যাচ সিস্টেম থাকে
//       let qtyToSell = item.qty;

//       if (product.batches && product.batches.length > 0) {
//         for (let batch of product.batches) {
//           if (qtyToSell <= 0) break; // কাজ শেষ
//           if (batch.qty === 0) continue;

//           const deductQty = Math.min(qtyToSell, batch.qty);
//           batch.qty -= deductQty;
//           qtyToSell -= deductQty;
//         }

//         // FIFO update after deduction
//         product.batches = product.batches.filter((b) => b.qty > 0);
//       }

//       // Total stock update
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

    // ObjectId conversion
    if (customerId) customerId = new mongoose.Types.ObjectId(customerId);

    //  Calculate due + payment status
    const dueAmount = grandTotal - paidAmount;
    let paymentStatus = "pending";
    if (paidAmount === 0) paymentStatus = "pending";
    else if (paidAmount < grandTotal) paymentStatus = "partial";
    else paymentStatus = "paid";

    //  FIFO STOCK REDUCTION
    for (const item of items) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      // ObjectId conversion for product relations (optional)
      if (item.productId)
        item.productId = new mongoose.Types.ObjectId(item.productId);

      // যদি ব্যাচ সিস্টেম থাকে
      let qtyToSell = item.qty;

      if (product.batches && product.batches.length > 0) {
        for (let batch of product.batches) {
          if (qtyToSell <= 0) break;
          if (batch.qty === 0) continue;

          const deductQty = Math.min(qtyToSell, batch.qty);
          batch.qty -= deductQty;
          qtyToSell -= deductQty;
        }

        product.batches = product.batches.filter((b) => b.qty > 0);
      }

      product.stock = Math.max((product.stock || 0) - item.qty, 0);
      await product.save();
    }

    //  Save sale entry
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
      message: "Sale added successfully (FIFO applied)",
      data: sale,
    });
  } catch (error) {
    console.error("Sale Add Error:", error);
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

module.exports = {
  addSale,
  getSalesList,
};
