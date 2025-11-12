const mongoose = require("mongoose");
const purchaseModel = require("../models/purchase.model");
const PurchaseReturnModel = require("../models/purchaseReturn.Model");
const productModel = require("../models/Product.model");
const BatchModel = require("../models/Batch");
// const purchaseReturnModel = require("../models/purchaseReturn.Model");

//  Add New Purchase
// =====================================================

// addPurchase = async (req, res) => {
//   try {
//     const { productId, purchaseQty, unitCost } = req.body;

//     // 1️⃣ নতুন batch তৈরি
//     const newBatch = new Batch({
//       productId,
//       batchNo: "B" + Date.now(),
//       purchaseQty,
//       remainingQty: purchaseQty,
//       unitCost,
//       purchaseDate: new Date(),
//     });
//     await newBatch.save();

//     // 2️⃣ Product update
//     const product = await productModel.findById(productId);

//     const oldStock = product.totalStock || 0;
//     const oldCost = product.averageCost || 0;
//     const newStock = oldStock + purchaseQty;

//     // Weighted average cost হিসাব
//     const avgCost =
//       newStock === 0
//         ? unitCost
//         : (oldStock * oldCost + purchaseQty * unitCost) / newStock;

//     product.totalStock = newStock;
//     product.lastPurchasePrice = unitCost;
//     product.averageCost = avgCost;

//     await product.save();

//     res.json({ success: true, message: "Purchase added", newBatch, product });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

const addPurchase = async (req, res) => {
  try {
    const { supplierID, items, discount, tax, paidAmount } = req.body;

    let subTotal = 0;

    // calculate totals
    items.forEach((item) => {
      subTotal += item.purchaseQty * item.unitCost;
    });

    const grandTotal = subTotal - (discount || 0) + (tax || 0);
    const dueAmount = grandTotal - (paidAmount || 0);

    // create purchase record
    const purchase = new purchaseModel({
      supplierID,
      items,
      subTotal,
      discount,
      tax,
      grandTotal,
      paidAmount,
      dueAmount,
      invoiceNo: "INV-" + Date.now(),
    });

    // batch create + product update
    for (const item of items) {
      const batch = new BatchModel({
        productId: item.productId,
        batchNo: "B" + Date.now(),
        purchaseQty: item.purchaseQty,
        remainingQty: item.purchaseQty,
        unitCost: item.unitCost,
        purchaseDate: new Date(),
      });
      await batch.save();

      // attach batchId
      item.batchId = batch._id;

      // update product stock
      const product = await productModel.findById(item.productId);
      const newStock = product.totalStock + item.purchaseQty;
      const avgCost =
        (product.totalStock * product.averageCost +
          item.purchaseQty * item.unitCost) /
        newStock;

      product.totalStock = newStock;
      product.lastPurchasePrice = item.unitCost;
      product.averageCost = avgCost;
      await product.save();
    }

    await purchase.save();

    res.json({ success: true, purchase });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// const purchaseReturn = async (req, res) => {
//   try {
//     const { purchaseId, returnItems } = req.body;
//     // returnItems = [{ productId, returnQty }]

//     if (!purchaseId || !returnItems || returnItems.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Purchase ID and return items are required",
//       });
//     }

//     const purchase = await purchaseModel.findById(purchaseId);
//     if (!purchase)
//       return res
//         .status(404)
//         .json({ success: false, message: "Purchase not found" });

//     for (let item of returnItems) {
//       const product = await purchaseModel.findById(item.productId);
//       if (!product) continue;

//       let qtyToReturn = item.returnQty;

//       // Fetch batches in FIFO order (oldest first)
//       const batches = await BatchModel.find({
//         productId: item.productId,
//         remainingQty: { $gt: 0 },
//       }).sort({ purchaseDate: 1 }); // oldest first

//       for (let batch of batches) {
//         if (qtyToReturn <= 0) break;

//         if (batch.remainingQty >= qtyToReturn) {
//           batch.remainingQty -= qtyToReturn;
//           await batch.save();
//           qtyToReturn = 0;
//         } else {
//           qtyToReturn -= batch.remainingQty;
//           batch.remainingQty = 0;
//           await batch.save();
//         }
//       }

//       // Update product totalStock and averageCost if needed
//       product.totalStock -= item.returnQty;
//       if (product.totalStock < 0) product.totalStock = 0; // safeguard
//       await product.save();
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Purchase return processed successfully",
//     });
//   } catch (error) {
//     console.error("Purchase Return Error:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

const purchaseReturn = async (req, res) => {
  try {
    const { purchaseId, returnItems, note } = req.body;
    // returnItems = [{ productID, returnQty, reason }]

    if (!purchaseId || !returnItems || returnItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Purchase ID and return items are required",
      });
    }

    // Find Purchase
    const purchase = await purchaseModel.findById(purchaseId);
    if (!purchase)
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });

    let totalAmount = 0;
    const returnedProducts = [];

    // Loop through each return item
    for (const item of returnItems) {
      const product = await productModel.findById(item.productID);
      if (!product) continue;

      let qtyToReturn = item.returnQty;

      // Find batches FIFO order
      const batches = await BatchModel.find({
        productId: item.productID,
        remainingQty: { $gt: 0 },
      }).sort({ purchaseDate: 1 });

      let totalReturnedThisProduct = 0;

      for (const batch of batches) {
        if (qtyToReturn <= 0) break;

        const deductQty = Math.min(batch.remainingQty, qtyToReturn);

        batch.remainingQty -= deductQty;
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

      // ✅ Update product total stock after batches processed
      if (totalReturnedThisProduct > 0) {
        product.totalStock = Math.max(
          product.totalStock - totalReturnedThisProduct,
          0
        );
        await product.save();
      }
    }

    // ✅ Save Purchase Return Record
    const purchaseReturn = new PurchaseReturnModel({
      purchaseId,
      supplierID: purchase.supplierID,
      returnedProducts,
      totalAmount,
      note: note || "",
    });

    await purchaseReturn.save();

    res.status(200).json({
      success: true,
      message: "Purchase return processed successfully",
      data: {
        purchaseReturn,
        updatedStock: returnedProducts.map((r) => ({
          productID: r.productID,
          returnedQty: r.qty,
        })),
      },
    });
  } catch (error) {
    console.error("Purchase Return Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPurchasesList = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const perPage = parseInt(req.params.perPage) || 10;
    const searchKey = req.params.search === "0" ? "" : req.params.search;

    let filter = {};
    if (searchKey) {
      filter = {
        $or: [
          { supplierName: { $regex: searchKey, $options: "i" } },
          { supplierPhone: { $regex: searchKey, $options: "i" } },
          { invoiceNo: { $regex: searchKey, $options: "i" } },
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
        path: "items.productId",
        select: "name unitCost mrp dp categoryID brandID",
        populate: [
          { path: "categoryID", select: "name" },
          { path: "brandID", select: "name" },
        ],
      })
      .populate({
        path: "supplierID",
        select: "name mobile address",
      });

    // একটিমাত্র object আকারে flatten করা
    const dataObject = {
      purchases: purchases.map((p) => ({
        _id: p._id,
        invoiceNo: p.invoiceNo,
        purchaseDate: p.purchaseDate,
        supplier: p.supplierID
          ? {
              _id: p.supplierID._id,
              name: p.supplierID.name,
              mobile: p.supplierID.mobile,
              address: p.supplierID.address,
            }
          : null,
        items: p.items.map((item) => ({
          _id: item._id,
          product: item.productId
            ? {
                _id: item.productId._id,
                name: item.productId.name,
                unitCost: item.productId.unitCost,
                mrp: item.productId.mrp,
                dp: item.productId.dp,
                category: item.productId.categoryID
                  ? {
                      _id: item.productId.categoryID._id,
                      name: item.productId.categoryID.name,
                    }
                  : null,
                brand: item.productId.brandID
                  ? {
                      _id: item.productId.brandID._id,
                      name: item.productId.brandID.name,
                    }
                  : null,
              }
            : null,
          purchaseQty: item.purchaseQty,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
        })),
        subTotal: p.subTotal,
        discount: p.discount,
        tax: p.tax,
        grandTotal: p.grandTotal,
        paidAmount: p.paidAmount,
        dueAmount: p.dueAmount,
        status: p.status,
        createdAt: p.createdAt,
      })),
    };

    res.json({
      success: true,
      message: "Purchase products fetched successfully",
      data: dataObject, // এখানে একটিমাত্র object
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

// const editPurchase = async (req, res) => {
//   try {
//     const { purchaseId } = req.params;
//     const {
//       supplierID,
//       items, // [{ productID, purchaseQty, unitCost, totalCost }]
//       subTotal,
//       discount,
//       tax,
//       grandTotal,
//       paidAmount,
//       status,
//     } = req.body;

//     // ✅ Validate
//     if (!purchaseId || !items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Purchase ID and items are required",
//       });
//     }

//     // ✅ Find the existing purchase
//     const existingPurchase = await purchaseModel.findById(purchaseId);
//     if (!existingPurchase) {
//       return res.status(404).json({
//         success: false,
//         message: "Purchase not found",
//       });
//     }

//     // ✅ Revert old stock before editing
//     for (const oldItem of existingPurchase.items) {
//       const product = await productModel.findById(oldItem.productId);
//       if (product) {
//         product.totalStock = Math.max(
//           product.totalStock - oldItem.purchaseQty,
//           0
//         );
//         await product.save();

//         // Delete old batch
//         await BatchModel.deleteMany({
//           purchaseId: existingPurchase._id,
//           productId: oldItem.productId,
//         });
//       }
//     }

//     // ✅ Now update new items & stock
//     const newItems = [];
//     for (const newItem of items) {
//       const product = await productModel.findById(newItem.productID);
//       if (!product) continue;

//       // Create new batch (FIFO)
//       const batch = await BatchModel.create({
//         productId: newItem.productID,
//         purchaseId: purchaseId,
//         unitCost: newItem.unitCost,
//         remainingQty: newItem.purchaseQty,
//         purchaseDate: new Date(),
//       });

//       // Update product stock
//       product.totalStock = (product.totalStock || 0) + newItem.purchaseQty;
//       await product.save();

//       newItems.push({
//         productId: newItem.productID,
//         purchaseQty: newItem.purchaseQty,
//         unitCost: newItem.unitCost,
//         totalCost: newItem.totalCost,
//       });
//     }

//     // ✅ Update purchase record
//     existingPurchase.supplierID = supplierID || existingPurchase.supplierID;
//     existingPurchase.items = newItems;
//     existingPurchase.subTotal = subTotal;
//     existingPurchase.discount = discount;
//     existingPurchase.tax = tax;
//     existingPurchase.grandTotal = grandTotal;
//     existingPurchase.paidAmount = paidAmount;
//     existingPurchase.dueAmount = grandTotal - paidAmount;
//     existingPurchase.status = status || "Completed";
//     await existingPurchase.save();

//     res.status(200).json({
//       success: true,
//       message: "Purchase updated successfully",
//       updatedPurchase: existingPurchase,
//     });
//   } catch (error) {
//     console.error("Edit Purchase Error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const editPurchase = async (req, res) => {
  try {
    const {
      purchaseId,
      supplierID,
      items,
      subTotal,
      discount,
      tax,
      grandTotal,
      paidAmount,
      status,
    } = req.body;

    if (!purchaseId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Purchase ID and items are required",
      });
    }

    const existingPurchase = await purchaseModel.findById(purchaseId);
    if (!existingPurchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // Revert old stock
    for (const oldItem of existingPurchase.items) {
      const product = await productModel.findById(oldItem.productId);
      if (product) {
        product.totalStock = Math.max(
          product.totalStock - oldItem.purchaseQty,
          0
        );
        await product.save();

        await BatchModel.deleteMany({
          purchaseId: existingPurchase._id,
          productId: oldItem.productId,
        });
      }
    }

    // Update new items
    const newItems = [];
    for (const newItem of items) {
      const product = await productModel.findById(newItem.productID);
      if (!product) continue;

      await BatchModel.create({
        productId: newItem.productID,
        unitCost: newItem.unitCost,
        purchaseQty: newItem.purchaseQty, // ✅ এখন পাঠানো হলো
        remainingQty: newItem.purchaseQty,
        purchaseDate: new Date(),
      });

      product.totalStock = (product.totalStock || 0) + newItem.purchaseQty;
      await product.save();

      newItems.push({
        productId: newItem.productID,
        purchaseQty: newItem.purchaseQty,
        unitCost: newItem.unitCost,
        totalCost: newItem.totalCost,
      });
    }

    existingPurchase.supplierID = supplierID || existingPurchase.supplierID;
    existingPurchase.items = newItems;
    existingPurchase.subTotal = subTotal;
    existingPurchase.discount = discount;
    existingPurchase.tax = tax;
    existingPurchase.grandTotal = grandTotal;
    existingPurchase.paidAmount = paidAmount;
    existingPurchase.dueAmount = grandTotal - paidAmount;
    existingPurchase.status = status || "Completed";
    await existingPurchase.save();

    res.status(200).json({
      success: true,
      message: "Purchase updated successfully",
      updatedPurchase: existingPurchase,
    });
  } catch (error) {
    console.error("Edit Purchase Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =====================================================

// const addPurchase = async (req, res) => {
//   try {
//     const { Purchase, PurchasesProduct } = req.body;

//     // ✅ Validation
//     if (
//       !Purchase ||
//       !PurchasesProduct ||
//       PurchasesProduct.length === 0 ||
//       !Purchase.supplierID ||
//       !Purchase.total
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Purchase info, supplierID, and at least one product are required.",
//       });
//     }

//     // ✅ Convert IDs to ObjectId
//     Purchase.supplierID = new mongoose.Types.ObjectId(Purchase.supplierID);

//     for (const item of PurchasesProduct) {
//       item.productID = new mongoose.Types.ObjectId(item.productID);

//       const product = await productModel.findById(item.productID);
//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: `Product not found: ${item.productID}`,
//         });
//       }

//       // Push new batch (FIFO style)
//       product.batches = product.batches || [];
//       product.batches.push({
//         qty: item.qty,
//         unitCost: item.unitCost,
//         purchaseDate: new Date(),
//       });

//       // Update total stock & unit cost
//       product.stock = (product.stock || 0) + item.qty;
//       product.unitCost = item.unitCost;

//       await product.save();
//     }

//     // ✅ Save Purchase record
//     const newPurchase = new purchaseModel({
//       Purchase,
//       PurchasesProduct,
//     });

//     await newPurchase.save();

//     res.status(201).json({
//       success: true,
//       message: "Purchase added successfully with FIFO batches.",
//       data: newPurchase,
//     });
//   } catch (error) {
//     console.error("Add Purchase Error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

// const getPurchasesList = async (req, res) => {
//   try {
//     const page = parseInt(req.params.page) || 1;
//     const perPage = parseInt(req.params.perPage) || 10;
//     const searchKey = req.params.search === "0" ? "" : req.params.search;

//     let filter = {};
//     if (searchKey && searchKey !== "0") {
//       filter = {
//         $or: [
//           { "Purchase.supplierName": { $regex: searchKey, $options: "i" } },
//           { "Purchase.supplierPhone": { $regex: searchKey, $options: "i" } },
//         ],
//       };
//     }

//     const total = await purchaseModel.countDocuments(filter);
//     const purchases = await purchaseModel
//       .find(filter)
//       .skip((page - 1) * perPage)
//       .limit(perPage)
//       .sort({ createdAt: -1 })
//       .populate({
//         path: "PurchasesProduct.productID",
//         select: "name unitCost mrp dp categoryID brandID",
//         populate: [
//           { path: "categoryID", select: "name" },
//           { path: "brandID", select: "name" },
//         ],
//       })
//       .populate({
//         path: "Purchase.supplierID",
//         select: "name mobile address",
//       });

//     res.json({
//       success: true,
//       message: "Purchase products fetched successfully",
//       data: purchases,
//       pagination: {
//         total,
//         page,
//         perPage,
//         totalPages: Math.ceil(total / perPage),
//       },
//     });
//   } catch (error) {
//     console.error("Get Purchases Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// const editPurchase = async (req, res) => {
//   try {
//     const { id } = req.params; // purchaseId
//     const { products, supplierName, supplierPhone, totalAmount, dueAmount } =
//       req.body;

//     if (!products || products.length === 0 || !supplierName || !totalAmount) {
//       return res.status(400).json({
//         success: false,
//         message: "Products, supplier name, and total amount are required.",
//       });
//     }

//     const purchase = await purchaseModel.findById(id);
//     if (!purchase) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Purchase not found" });
//     }

//     // Step 1: Rollback previous stock & batches
//     for (const item of purchase.products) {
//       const product = await productModel.findById(item.productID);
//       if (product) {
//         product.stock = Math.max((product.stock || 0) - item.qty, 0);
//         if (product.batches && product.batches.length > 0) {
//           let qtyToRemove = item.qty;
//           for (let batch of product.batches) {
//             if (qtyToRemove <= 0) break;
//             const deduct = Math.min(batch.qty, qtyToRemove);
//             batch.qty -= deduct;
//             qtyToRemove -= deduct;
//           }
//           product.batches = product.batches.filter((b) => b.qty > 0);
//         }
//         await product.save();
//       }
//     }

//     // Step 2: Apply new products stock & batches
//     for (const item of products) {
//       const product = await productModel.findById(item.productID);
//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: `Product not found: ${item.productID}`,
//         });
//       }

//       product.stock = (product.stock || 0) + item.qty;
//       if (!product.batches) product.batches = [];
//       product.batches.push({
//         qty: item.qty,
//         unitCost: item.unitCost,
//         purchaseDate: new Date(),
//       });
//       await product.save();
//     }

//     // Step 3: Update Purchase document
//     purchase.products = products;
//     purchase.supplierName = supplierName;
//     purchase.supplierPhone = supplierPhone;
//     purchase.totalAmount = totalAmount;
//     purchase.dueAmount = dueAmount || 0;
//     await purchase.save();

//     res.status(200).json({
//       success: true,
//       message: "Purchase updated successfully",
//       data: purchase,
//     });
//   } catch (error) {
//     console.error("Edit Purchase Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// const purchaseReturn = async (req, res) => {
//   try {
//     const { purchaseId, items, note, returnDate } = req.body;

//     // 🟢 Basic validation
//     if (!purchaseId || !items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Purchase ID and returned items are required.",
//       });
//     }

//     // 🟢 Find original purchase
//     const purchase = await purchaseModel.findById(purchaseId);
//     if (!purchase) {
//       return res.status(404).json({
//         success: false,
//         message: "Purchase not found.",
//       });
//     }

//     let totalReturnAmount = 0;
//     let returnedProducts = []; // ✅ Fixed: Declare array

//     // 🟢 Loop through returned items
//     for (const item of items) {
//       const product = await productModel.findById(item.productId);
//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: `Product not found: ${item.productId}`,
//         });
//       }

//       let qtyToReturn = item.qty;
//       let batchUsed = null;
//       let batchDetails = [];
//       let productReturnTotal = 0; // 🔹 item-wise total tracker

//       // 🟢 If batchId specified
//       if (item.batchId) {
//         const batch = product.batches.id(item.batchId);
//         if (!batch) {
//           return res.status(404).json({
//             success: false,
//             message: `Batch not found for product: ${item.productId}`,
//           });
//         }

//         if (batch.qty < qtyToReturn) {
//           return res.status(400).json({
//             success: false,
//             message: `Not enough stock in batch ${item.batchId}`,
//           });
//         }

//         batch.qty -= qtyToReturn;
//         const value = qtyToReturn * batch.unitCost;
//         productReturnTotal += value;

//         batchUsed = batch._id;
//         batchDetails.push({
//           batchId: batch._id,
//           unitCost: batch.unitCost,
//           qtyReturned: qtyToReturn,
//           value,
//         });
//       }
//       // 🟢 Else FIFO batch return
//       else if (product.batches && product.batches.length > 0) {
//         for (let batch of product.batches) {
//           if (qtyToReturn <= 0) break;
//           if (batch.qty === 0) continue;

//           const deductQty = Math.min(qtyToReturn, batch.qty);
//           batch.qty -= deductQty;
//           qtyToReturn -= deductQty;

//           const value = deductQty * batch.unitCost;
//           productReturnTotal += value;

//           batchUsed = batch._id;
//           batchDetails.push({
//             batchId: batch._id,
//             unitCost: batch.unitCost,
//             qtyReturned: deductQty,
//             value,
//           });
//         }

//         // remove empty batches
//         product.batches = product.batches.filter((b) => b.qty > 0);
//       }

//       // 🟢 Update product stock
//       product.stock = Math.max((product.stock || 0) - item.qty, 0);
//       await product.save();

//       // 🟢 Add item-wise total to grand total
//       totalReturnAmount += productReturnTotal;

//       // 🟢 Push returned product details
//       returnedProducts.push({
//         productID: item.productId,
//         batchId: batchUsed,
//         qty: item.qty,
//         unitCost: item.unitCost || batchDetails?.[0]?.unitCost || 0,
//         total: productReturnTotal,
//         reason: item.reason || "",
//       });
//     }

//     // 🟢 Save return entry in PurchaseReturn model
//     const purchaseReturnDoc = await purchaseReturnModel.create({
//       purchaseId,
//       supplierID: purchase.Purchase.supplierID,
//       returnedProducts,
//       totalAmount: totalReturnAmount,
//       note: note || "",
//       date: returnDate || new Date(),
//     });

//     res.status(200).json({
//       success: true,
//       message: "Purchase return processed successfully.",
//       data: purchaseReturnDoc,
//     });
//   } catch (error) {
//     console.error("Purchase Return Error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const getPurchaseDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Find purchase by ID
    const purchase = await purchaseModel
      .findById(id)
      .populate({
        path: "Purchase.supplierID",
        select: "name phone email address",
      }) // nested supplier info
      .populate({
        path: "PurchasesProduct.productID",
        select: "name brandID categoryID stock batches",
        populate: [
          { path: "brandID", select: "name" },
          { path: "categoryID", select: "name" },
        ],
      });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error("Get Purchase Detail Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// const purchaseReturn = async (req, res) => {
//   try {
//     const { purchaseId, items, note, returnDate } = req.body;

//     if (!purchaseId || !items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Purchase ID and returned items are required.",
//       });
//     }

//     const purchase = await purchaseModel.findById(purchaseId);
//     if (!purchase) {
//       return res.status(404).json({
//         success: false,
//         message: "Purchase not found.",
//       });
//     }

//     let totalReturnAmount = 0;
//     let returnedProducts = [];

//     for (const item of items) {
//       const product = await productModel.findById(item.productId);
//       if (!product) {
//         return res.status(404).json({
//           success: false,
//           message: `Product not found: ${item.productId}`,
//         });
//       }

//       let qtyToReturn = item.qty;
//       let batchUsed = null;
//       let batchDetails = [];
//       let productReturnTotal = 0;

//       // 🔹 Batch-wise stock check
//       if (item.batchId) {
//         const batch = product.batches.id(item.batchId);
//         if (!batch) {
//           return res.status(404).json({
//             success: false,
//             message: `Batch not found for product: ${item.productId}`,
//           });
//         }

//         if (qtyToReturn > batch.qty) {
//           return res.status(400).json({
//             success: false,
//             message: `Cannot return ${qtyToReturn} items. Only ${batch.qty} available in batch ${item.batchId}.`,
//           });
//         }

//         batch.qty -= qtyToReturn;
//         const value = qtyToReturn * batch.unitCost;
//         productReturnTotal += value;

//         batchUsed = batch._id;
//         batchDetails.push({
//           batchId: batch._id,
//           unitCost: batch.unitCost,
//           qtyReturned: qtyToReturn,
//           value,
//         });
//       } else {
//         // 🔹 FIFO check across batches
//         const totalBatchQty = product.batches.reduce(
//           (sum, b) => sum + b.qty,
//           0
//         );
//         if (qtyToReturn > totalBatchQty) {
//           return res.status(400).json({
//             success: false,
//             message: `Cannot return ${qtyToReturn} items. Only ${totalBatchQty} available in product batches.`,
//           });
//         }

//         // 🔹 Deduct from batches FIFO
//         for (let batch of product.batches) {
//           if (qtyToReturn <= 0) break;
//           if (batch.qty === 0) continue;

//           const deductQty = Math.min(qtyToReturn, batch.qty);
//           batch.qty -= deductQty;
//           qtyToReturn -= deductQty;

//           const value = deductQty * batch.unitCost;
//           productReturnTotal += value;

//           batchUsed = batch._id;
//           batchDetails.push({
//             batchId: batch._id,
//             unitCost: batch.unitCost,
//             qtyReturned: deductQty,
//             value,
//           });
//         }

//         product.batches = product.batches.filter((b) => b.qty > 0);
//       }

//       // 🔹 Update product stock
//       product.stock = Math.max((product.stock || 0) - item.qty, 0);
//       await product.save();

//       totalReturnAmount += productReturnTotal;

//       returnedProducts.push({
//         productID: item.productId,
//         batchId: batchUsed,
//         qty: item.qty,
//         unitCost: item.unitCost || batchDetails?.[0]?.unitCost || 0,
//         total: productReturnTotal,
//         reason: item.reason || "",
//       });
//     }

//     // 🔹 Save return
//     const purchaseReturnDoc = await purchaseReturnModel.create({
//       purchaseId,
//       supplierID: purchase.Purchase.supplierID,
//       returnedProducts,
//       totalAmount: totalReturnAmount,
//       note: note || "",
//       date: returnDate || new Date(),
//     });

//     res.status(200).json({
//       success: true,
//       message: "Purchase return processed successfully.",
//       data: purchaseReturnDoc,
//     });
//   } catch (error) {
//     console.error("Purchase Return Error:", error);
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
  purchaseReturn,
  getPurchaseDetail,
};
