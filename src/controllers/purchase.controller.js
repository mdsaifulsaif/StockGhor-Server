const purchaseModel = require("../models/purchase.model");
const productModel = require("../models/Product.model");
const categoryModel = require("../models/category.model");

//  Add New Purchase
// const addPurchase = async (req, res) => {
//   try {
//     const { products, supplierName, supplierPhone, totalAmount, dueAmount } =
//       req.body;

//     // Validation
//     if (!products || products.length === 0 || !supplierName || !totalAmount) {
//       return res.status(400).json({
//         success: false,
//         message: "Products, supplier name, and total amount are required.",
//       });
//     }

//     // Loop through products and update product batches
//     for (const item of products) {
//       const { productID, qty, unitCost } = item;

//       const product = await productModel.findById(productID);
//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: `Product not found: ${productID}`,
//         });
//       }

//       // ✅ Push new batch (FIFO logic)
//       product.batches.push({
//         qty: qty,
//         unitCost: unitCost,
//         purchaseDate: new Date(),
//       });

//       // ✅ Update total stock
//       product.stock = (product.stock || 0) + qty;

//       // ✅ Update latest cost for display/reference
//       product.unitCost = unitCost;

//       await product.save();
//     }

//     // ✅ Save purchase record
//     const newPurchase = new purchaseModel({
//       products,
//       supplierName,
//       supplierPhone,
//       totalAmount,
//       dueAmount: dueAmount || 0,
//     });

//     await newPurchase.save();

//     res.status(201).json({
//       success: true,
//       message: "Purchase added successfully with FIFO batches.",
//       data: newPurchase,
//     });
//   } catch (error) {
//     console.error("Add Purchase Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const addPurchase = async (req, res) => {
  try {
    const { Purchase, PurchasesProduct } = req.body;

    // ✅ Validation
    if (
      !Purchase ||
      !PurchasesProduct ||
      PurchasesProduct.length === 0 ||
      !Purchase.supplierID ||
      !Purchase.total
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Purchase info, contactID, and at least one product are required.",
      });
    }

    // ✅ Loop through products and update stock & batches
    for (const item of PurchasesProduct) {
      const { productID, qty, unitCost } = item;

      const product = await productModel.findById(productID);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${productID}`,
        });
      }

      // Push new batch (FIFO style)
      product.batches = product.batches || [];
      product.batches.push({
        qty,
        unitCost,
        purchaseDate: new Date(),
      });

      // Update total stock & unit cost
      product.stock = (product.stock || 0) + qty;
      product.unitCost = unitCost;

      await product.save();
    }

    // ✅ Save Purchase record
    const newPurchase = new purchaseModel({
      Purchase,
      PurchasesProduct,
    });

    await newPurchase.save();

    res.status(201).json({
      success: true,
      message: "Purchase added successfully with FIFO batches.",
      data: newPurchase,
    });
  } catch (error) {
    console.error("Add Purchase Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getPurchasesList = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const perPage = parseInt(req.params.perPage) || 10;
    const searchKey = req.params.search === "0" ? "" : req.params.search;

    let filter = {};
    if (searchKey && searchKey !== "0") {
      filter = {
        $or: [
          { "Purchase.supplierName": { $regex: searchKey, $options: "i" } },
          { "Purchase.supplierPhone": { $regex: searchKey, $options: "i" } },
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
        path: "PurchasesProduct.productID",
        select: "name unitCost mrp dp categoryID brandID",
        populate: [
          { path: "categoryID", select: "name" },
          { path: "brandID", select: "name" },
        ],
      })
      .populate({
        path: "Purchase.supplierID",
        select: "name mobile address",
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
    console.error("Get Purchases Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const editPurchase = async (req, res) => {
  try {
    const { id } = req.params; // purchaseId
    const { products, supplierName, supplierPhone, totalAmount, dueAmount } =
      req.body;

    if (!products || products.length === 0 || !supplierName || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Products, supplier name, and total amount are required.",
      });
    }

    const purchase = await purchaseModel.findById(id);
    if (!purchase) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });
    }

    // Step 1: Rollback previous stock & batches
    for (const item of purchase.products) {
      const product = await productModel.findById(item.productID);
      if (product) {
        product.stock = Math.max((product.stock || 0) - item.qty, 0);
        if (product.batches && product.batches.length > 0) {
          let qtyToRemove = item.qty;
          for (let batch of product.batches) {
            if (qtyToRemove <= 0) break;
            const deduct = Math.min(batch.qty, qtyToRemove);
            batch.qty -= deduct;
            qtyToRemove -= deduct;
          }
          product.batches = product.batches.filter((b) => b.qty > 0);
        }
        await product.save();
      }
    }

    // Step 2: Apply new products stock & batches
    for (const item of products) {
      const product = await productModel.findById(item.productID);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productID}`,
        });
      }

      product.stock = (product.stock || 0) + item.qty;
      if (!product.batches) product.batches = [];
      product.batches.push({
        qty: item.qty,
        unitCost: item.unitCost,
        purchaseDate: new Date(),
      });
      await product.save();
    }

    // Step 3: Update Purchase document
    purchase.products = products;
    purchase.supplierName = supplierName;
    purchase.supplierPhone = supplierPhone;
    purchase.totalAmount = totalAmount;
    purchase.dueAmount = dueAmount || 0;
    await purchase.save();

    res.status(200).json({
      success: true,
      message: "Purchase updated successfully",
      data: purchase,
    });
  } catch (error) {
    console.error("Edit Purchase Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// const deletePurchase = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const purchase = await purchaseModel.findById(id);
//     if (!purchase) {
//       return res.status(404).json({
//         success: false,
//         message: "Purchase not found",
//       });
//     }

//     // ✅ 1. Loop through all purchased items
//     for (const item of purchase.products) {
//       const product = await productModel.findById(item.productID);
//       if (product) {
//         // ✅ 2. FIFO batches থেকেও qty remove করতে হবে
//         let qtyToRemove = item.qty;

//         for (let batch of product.batches) {
//           if (qtyToRemove <= 0) break;

//           const removeQty = Math.min(batch.qty, qtyToRemove);
//           batch.qty -= removeQty;
//           qtyToRemove -= removeQty;
//         }

//         // ✅ 3. Empty batch remove করো
//         product.batches = product.batches.filter((b) => b.qty > 0);

//         // ✅ 4. Total stock কমাও
//         product.stock = Math.max((product.stock || 0) - item.qty, 0);

//         await product.save();
//       }
//     }

//     // ✅ 5. Purchase delete করো
//     await purchaseModel.findByIdAndDelete(id);

//     res.status(200).json({
//       success: true,
//       message: "Purchase deleted successfully & stock updated.",
//     });
//   } catch (error) {
//     console.error("Delete Purchase Error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await purchaseModel.findById(id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // ✅ PurchasesProduct loop করো
    for (const item of purchase.PurchasesProduct) {
      const product = await productModel.findById(item.productID);
      if (product) {
        // ✅ FIFO batches থেকেও qty remove করতে হবে
        let qtyToRemove = item.qty;

        for (let batch of product.batches) {
          if (qtyToRemove <= 0) break;

          const removeQty = Math.min(batch.qty, qtyToRemove);
          batch.qty -= removeQty;
          qtyToRemove -= removeQty;
        }

        // ✅ খালি ব্যাচগুলো বাদ দাও
        product.batches = product.batches.filter((b) => b.qty > 0);

        // ✅ মোট stock কমাও
        product.stock = Math.max((product.stock || 0) - item.qty, 0);

        await product.save();
      }
    }

    // ✅ অবশেষে purchase delete করো
    await purchaseModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Purchase deleted successfully & stock updated.",
    });
  } catch (error) {
    console.error("Delete Purchase Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addPurchase,
  getPurchasesList,
  deletePurchase,
  editPurchase,
};
