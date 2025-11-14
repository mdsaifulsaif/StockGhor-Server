const mongoose = require("mongoose");
const purchaseModel = require("../models/purchase.model");
const PurchaseReturnModel = require("../models/purchaseReturn.Model");
const productModel = require("../models/Product.model");
const supplierModel = require("../models/supplier.model");
const BatchModel = require("../models/Batch");
// const purchaseReturnModel = require("../models/purchaseReturn.Model");

//  Add New Purchase
// =====================================================

// const addPurchase = async (req, res) => {
//   const session = await mongoose.startSession(); // ✅ Start Transaction
//   session.startTransaction();

//   try {
//     const {
//       supplierID,
//       items,
//       discount = 0,
//       tax = 0,
//       paidAmount = 0,
//     } = req.body;

//     if (!supplierID || !items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Supplier and items are required",
//       });
//     }

//     let subTotal = 0;
//     items.forEach((item) => {
//       subTotal += item.purchaseQty * item.unitCost;
//     });

//     const grandTotal = subTotal - discount + tax;
//     const dueAmount = grandTotal - paidAmount;

//     // ✅ Create purchase record first (empty items)
//     const purchase = new purchaseModel({
//       supplierID,
//       subTotal,
//       discount,
//       tax,
//       grandTotal,
//       paidAmount,
//       dueAmount,
//       invoiceNo: "INV-" + Date.now(),
//       items: [],
//     });

//     await purchase.save({ session });

//     // ✅ Loop items & process batches
//     const updatedItems = [];

//     for (const item of items) {
//       // 1️⃣ Create Batch with purchaseId
//       const batch = await BatchModel.create(
//         [
//           {
//             productId: item.productId,
//             purchaseId: purchase._id, // ✅ now linked
//             batchNo: "B" + Date.now(),
//             purchaseQty: item.purchaseQty,
//             remainingQty: item.purchaseQty,
//             unitCost: item.unitCost,
//             purchaseDate: new Date(),
//           },
//         ],
//         { session }
//       );

//       // 2️⃣ Update Product Stock
//       const product = await productModel
//         .findById(item.productId)
//         .session(session);
//       if (!product) throw new Error(`Product not found: ${item.productId}`);

//       const newStock = product.totalStock + item.purchaseQty;
//       const avgCost =
//         (product.totalStock * product.averageCost +
//           item.purchaseQty * item.unitCost) /
//         newStock;

//       product.totalStock = newStock;
//       product.lastPurchasePrice = item.unitCost;
//       product.averageCost = avgCost;
//       await product.save({ session });

//       // 3️⃣ Push item with batch reference
//       updatedItems.push({
//         productId: item.productId,
//         batchId: batch[0]._id,
//         purchaseQty: item.purchaseQty,
//         unitCost: item.unitCost,
//         totalCost: item.purchaseQty * item.unitCost,
//       });
//     }

//     // ✅ Update purchase items
//     purchase.items = updatedItems;
//     await purchase.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     res.json({
//       success: true,
//       message: "Purchase added successfully",
//       purchase,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Add Purchase Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// add purchae supplier balace update hocche
// const addPurchase = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const {
//       supplierID,
//       items,
//       discount = 0,
//       tax = 0,
//       paidAmount = 0,
//     } = req.body;

//     if (!supplierID || !items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Supplier and items are required",
//       });
//     }

//     // ✅ Supplier check
//     const supplier = await supplierModel.findById(supplierID).session(session);
//     if (!supplier) {
//       throw new Error("Supplier not found");
//     }

//     let subTotal = 0;
//     items.forEach((item) => {
//       subTotal += item.purchaseQty * item.unitCost;
//     });

//     const grandTotal = subTotal - discount + tax;
//     const dueAmount = grandTotal - paidAmount;

//     // ✅ Create purchase record (empty items first)
//     const purchase = new purchaseModel({
//       supplierID,
//       subTotal,
//       discount,
//       tax,
//       grandTotal,
//       paidAmount,
//       dueAmount,
//       invoiceNo: "INV-" + Date.now(),
//       items: [],
//     });

//     await purchase.save({ session });

//     // ✅ Process each item & create batch
//     const updatedItems = [];

//     for (const item of items) {
//       const batch = await BatchModel.create(
//         [
//           {
//             productId: item.productId,
//             purchaseId: purchase._id,
//             batchNo: "B" + Date.now(),
//             purchaseQty: item.purchaseQty,
//             remainingQty: item.purchaseQty,
//             unitCost: item.unitCost,
//             purchaseDate: new Date(),
//           },
//         ],
//         { session }
//       );

//       const product = await productModel
//         .findById(item.productId)
//         .session(session);
//       if (!product) throw new Error(`Product not found: ${item.productId}`);

//       const newStock = product.totalStock + item.purchaseQty;
//       const avgCost =
//         (product.totalStock * product.averageCost +
//           item.purchaseQty * item.unitCost) /
//         newStock;

//       product.totalStock = newStock;
//       product.lastPurchasePrice = item.unitCost;
//       product.averageCost = avgCost;
//       await product.save({ session });

//       updatedItems.push({
//         productId: item.productId,
//         batchId: batch[0]._id,
//         purchaseQty: item.purchaseQty,
//         unitCost: item.unitCost,
//         totalCost: item.purchaseQty * item.unitCost,
//       });
//     }

//     // ✅ Update purchase items
//     purchase.items = updatedItems;
//     await purchase.save({ session });

//     // ✅ Supplier Balance Update Logic
//     // পুরনো দেনা + নতুন purchase এর due
//     const totalDue =
//       (supplier.previousDue || 0) + (supplier.balance || 0) + dueAmount;

//     supplier.balance = totalDue; // এখনকার মোট দেনা
//     supplier.previousDue = 0; // যদি চাও reset করে দিতে পারো
//     await supplier.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     res.json({
//       success: true,
//       message: "Purchase added successfully",
//       purchase,
//       supplierBalance: supplier.balance,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Add Purchase Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const addPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      supplierID,
      items,
      discount = 0,
      tax = 0,
      paidAmount = 0,
    } = req.body;

    if (!supplierID || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Supplier and items are required",
      });
    }

    // Supplier check
    const supplier = await supplierModel.findById(supplierID).session(session);
    if (!supplier) throw new Error("Supplier not found");

    // Calculate totals
    const subTotal = items.reduce(
      (sum, item) => sum + item.purchaseQty * item.unitCost,
      0
    );

    const grandTotal = subTotal - discount + tax;
    const dueAmount = grandTotal - paidAmount;

    // Create purchase base
    const purchase = new purchaseModel({
      supplierID,
      subTotal,
      discount,
      tax,
      grandTotal,
      paidAmount,
      dueAmount,
      invoiceNo: "INV-" + Date.now(),
      items: [],
    });

    await purchase.save({ session });

    // THIS MUST EXIST
    const updatedItems = [];

    // Process all items
    for (const item of items) {
      const batch = await BatchModel.create(
        [
          {
            productId: item.productId,
            purchaseId: purchase._id,
            batchNo: "B" + Date.now(),
            purchaseQty: item.purchaseQty,
            remainingQty: item.purchaseQty,
            unitCost: item.unitCost,
            purchaseDate: new Date(),
          },
        ],
        { session }
      );

      const product = await productModel
        .findById(item.productId)
        .session(session);

      if (!product) throw new Error(`Product not found: ${item.productId}`);

      // Update product stock
      const newStock = product.totalStock + item.purchaseQty;
      const avgCost =
        (product.totalStock * product.averageCost +
          item.purchaseQty * item.unitCost) /
        newStock;

      product.totalStock = newStock;
      product.lastPurchasePrice = item.unitCost;
      product.averageCost = avgCost;
      product.mrp = item.mrp;
      product.dp = item.dp;
      product.salePrice = item.salePrice;

      await product.save({ session });

      // Push item to purchase items
      updatedItems.push({
        productId: item.productId,
        batchId: batch[0]._id,
        purchaseQty: item.purchaseQty,
        unitCost: item.unitCost,
        totalCost: item.purchaseQty * item.unitCost,
      });
    }

    purchase.items = updatedItems;
    await purchase.save({ session });

    // Update supplier balance
    supplier.balance =
      (supplier.balance || 0) + (supplier.previousDue || 0) + dueAmount;

    supplier.previousDue = 0;
    await supplier.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Purchase added successfully",
      purchase,
      supplierBalance: supplier.balance,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log("Add Purchase Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// return purchae supplier balace update hocche  na thik korte hove
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
        select: "name address phone",
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
              mobile: p.supplierID.phone,
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

// edite purchae supplier balace update hocche
const editPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

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

    // ✅ Find existing purchase
    const existingPurchase = await purchaseModel
      .findById(purchaseId)
      .session(session);

    if (!existingPurchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    // ✅ Find supplier
    const supplier = await supplierModel.findById(supplierID).session(session);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // ✅ Revert old stock & batches
    for (const oldItem of existingPurchase.items) {
      const product = await productModel.findById(oldItem.productId);
      if (product) {
        product.totalStock = Math.max(
          product.totalStock - oldItem.purchaseQty,
          0
        );
        await product.save({ session });
      }

      await BatchModel.deleteMany({
        purchaseId: existingPurchase._id,
        productId: oldItem.productId,
      }).session(session);
    }

    // ✅ Add new items & update stock
    const newItems = [];
    for (const newItem of items) {
      const product = await productModel
        .findById(newItem.productID)
        .session(session);
      if (!product) continue;

      const newBatch = await BatchModel.create(
        [
          {
            productId: newItem.productID,
            purchaseId: existingPurchase._id,
            batchNo: "B" + Date.now(),
            purchaseQty: newItem.purchaseQty,
            remainingQty: newItem.purchaseQty,
            unitCost: newItem.unitCost,
            purchaseDate: new Date(),
          },
        ],
        { session }
      );

      product.totalStock = (product.totalStock || 0) + newItem.purchaseQty;
      await product.save({ session });

      newItems.push({
        productId: newItem.productID,
        batchId: newBatch[0]._id,
        purchaseQty: newItem.purchaseQty,
        unitCost: newItem.unitCost,
        totalCost: newItem.totalCost,
      });
    }

    // ✅ Calculate new due
    const newDueAmount = grandTotal - paidAmount;

    // ✅ Supplier Balance Update Logic
    // পুরোনো due বাদ দিয়ে নতুন due যোগ
    const previousDue = supplier.balance - existingPurchase.dueAmount;
    supplier.balance = previousDue + newDueAmount;
    await supplier.save({ session });

    // ✅ Update purchase details
    existingPurchase.supplierID = supplierID || existingPurchase.supplierID;
    existingPurchase.items = newItems;
    existingPurchase.subTotal = subTotal;
    existingPurchase.discount = discount;
    existingPurchase.tax = tax;
    existingPurchase.grandTotal = grandTotal;
    existingPurchase.paidAmount = paidAmount;
    existingPurchase.dueAmount = newDueAmount;
    existingPurchase.status = status || "Completed";
    await existingPurchase.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Purchase updated successfully",
      updatedPurchase: existingPurchase,
      updatedSupplierBalance: supplier.balance,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Edit Purchase Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// const getPurchaseDetail = async (req, res) => {
//   try {
//     const { purchaseId } = req.params;

//     console.log(purchaseId);

//     if (!purchaseId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Purchase ID is required" });
//     }

//     const purchase = await purchaseModel
//       .findById(purchaseId)
//       .populate({
//         path: "supplierID",
//         select: "name mobile address",
//       })
//       .populate({
//         path: "items.productId",
//         select: "name unitCost mrp dp categoryID brandID",
//         populate: [
//           { path: "categoryID", select: "name" },
//           { path: "brandID", select: "name" },
//         ],
//       });

//     if (!purchase) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Purchase not found" });
//     }

//     // 🔹 Find all batches related to this purchase
//     const batches = await BatchModel.find({ purchaseId })
//       .populate({
//         path: "productId",
//         select: "name",
//       })
//       .sort({ createdAt: 1 });

//     // 🔹 Format final response object
//     const formattedData = {
//       _id: purchase._id,
//       invoiceNo: purchase.invoiceNo,
//       purchaseDate: purchase.purchaseDate,
//       supplier: purchase.supplierID
//         ? {
//             _id: purchase.supplierID._id,
//             name: purchase.supplierID.name,
//             mobile: purchase.supplierID.mobile,
//             address: purchase.supplierID.address,
//           }
//         : null,
//       items: purchase.items.map((item) => ({
//         _id: item._id,
//         product: item.productId
//           ? {
//               _id: item.productId._id,
//               name: item.productId.name,
//               unitCost: item.productId.unitCost,
//               mrp: item.productId.mrp,
//               dp: item.productId.dp,
//               category: item.productId.categoryID
//                 ? {
//                     _id: item.productId.categoryID._id,
//                     name: item.productId.categoryID.name,
//                   }
//                 : null,
//               brand: item.productId.brandID
//                 ? {
//                     _id: item.productId.brandID._id,
//                     name: item.productId.brandID.name,
//                   }
//                 : null,
//             }
//           : null,
//         purchaseQty: item.purchaseQty,
//         unitCost: item.unitCost,
//         totalCost: item.totalCost,
//       })),
//       batches: batches.map((b) => ({
//         _id: b._id,
//         product: b.productId ? b.productId.name : "N/A",
//         unitCost: b.unitCost,
//         purchaseQty: b.purchaseQty,
//         remainingQty: b.remainingQty,
//         purchaseDate: b.purchaseDate,
//         expireDate: b.expireDate,
//       })),
//       subTotal: purchase.subTotal,
//       discount: purchase.discount,
//       tax: purchase.tax,
//       grandTotal: purchase.grandTotal,
//       paidAmount: purchase.paidAmount,
//       dueAmount: purchase.dueAmount,
//       status: purchase.status,
//       note: purchase.notes,
//       createdAt: purchase.createdAt,
//     };

//     res.status(200).json({
//       success: true,
//       message: "Purchase details fetched successfully",
//       data: formattedData,
//     });
//   } catch (error) {
//     console.error("Get Purchase Detail Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// =====================================================

const getPurchaseDetail = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    if (!purchaseId) {
      return res.status(400).json({
        success: false,
        message: "Purchase ID is required",
      });
    }

    // 🔹 Fetch purchase with product + supplier populated
    const purchase = await purchaseModel
      .findById(purchaseId)
      .populate({
        path: "supplierID",
        select: "name mobile address",
      })
      .populate({
        path: "items.productId",
        select: "name unitCost mrp dp categoryID brandID",
        populate: [
          { path: "categoryID", select: "name" },
          { path: "brandID", select: "name" },
        ],
      });

    if (!purchase) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });
    }

    // 🔹 Fetch related batches
    const batches = await BatchModel.find({ purchaseId })
      .populate({
        path: "productId",
        select: "name",
      })
      .sort({ createdAt: 1 });

    // 🔹 Final formatted response
    const formattedData = {
      purchase: {
        _id: purchase._id,
        invoiceNo: purchase.invoiceNo,
        purchaseDate: purchase.purchaseDate,
        subTotal: purchase.subTotal,
        discount: purchase.discount,
        tax: purchase.tax,
        grandTotal: purchase.grandTotal,
        paidAmount: purchase.paidAmount,
        dueAmount: purchase.dueAmount,
        status: purchase.status,
        note: purchase.notes,
        createdAt: purchase.createdAt,
      },

      supplier: purchase.supplierID
        ? {
            _id: purchase.supplierID._id,
            name: purchase.supplierID.name,
            mobile: purchase.supplierID.mobile,
            address: purchase.supplierID.address,
          }
        : null,

      items: purchase.items.map((item) => ({
        _id: item._id,
        purchaseQty: item.purchaseQty,
        unitCost: item.unitCost,
        totalCost: item.totalCost,

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
      })),

      batches: batches.map((b) => ({
        _id: b._id,
        product: b.productId ? b.productId.name : "N/A",
        unitCost: b.unitCost,
        purchaseQty: b.purchaseQty,
        remainingQty: b.remainingQty,
        purchaseDate: b.purchaseDate,
        expireDate: b.expireDate,
      })),
    };

    return res.status(200).json({
      success: true,
      message: "Purchase details fetched successfully",
      data: formattedData,
    });
  } catch (error) {
    console.error("Get Purchase Detail Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

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

// const purchaseReturn = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { purchaseId, returnItems, note } = req.body;
//     // returnItems = [{ productID, returnQty, reason }]

//     if (!purchaseId || !returnItems || returnItems.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Purchase ID and return items are required",
//       });
//     }

//     // 🔍 Find Purchase
//     const purchase = await purchaseModel.findById(purchaseId).session(session);
//     if (!purchase) {
//       await session.abortTransaction();
//       return res
//         .status(404)
//         .json({ success: false, message: "Purchase not found" });
//     }

//     let totalAmount = 0;
//     const returnedProducts = [];

//     // 🔁 Process each returned item
//     for (const item of returnItems) {
//       const product = await productModel
//         .findById(item.productID)
//         .session(session);
//       if (!product) continue;

//       let qtyToReturn = item.returnQty;
//       let totalReturnedThisProduct = 0;

//       // 🧾 Find FIFO batches
//       const batches = await BatchModel.find({
//         productId: item.productID,
//         remainingQty: { $gt: 0 },
//       })
//         .sort({ purchaseDate: 1 })
//         .session(session);

//       for (const batch of batches) {
//         if (qtyToReturn <= 0) break;

//         const deductQty = Math.min(batch.remainingQty, qtyToReturn);
//         batch.remainingQty -= deductQty;
//         await batch.save({ session });

//         returnedProducts.push({
//           productID: item.productID,
//           batchId: batch._id,
//           qty: deductQty,
//           unitCost: batch.unitCost,
//           total: deductQty * batch.unitCost,
//           reason: item.reason || "",
//         });

//         totalAmount += deductQty * batch.unitCost;
//         totalReturnedThisProduct += deductQty;
//         qtyToReturn -= deductQty;
//       }

//       // ✅ Update product stock
//       if (totalReturnedThisProduct > 0) {
//         const newStock = Math.max(
//           product.totalStock - totalReturnedThisProduct,
//           0
//         );
//         product.totalStock = newStock;
//         await product.save({ session });
//       }
//     }

//     // ✅ Save Purchase Return Record
//     const purchaseReturn = new PurchaseReturnModel({
//       purchaseId,
//       supplierID: purchase.supplierID,
//       returnedProducts,
//       totalAmount,
//       note: note || "",
//       returnDate: new Date(),
//     });

//     await purchaseReturn.save({ session });

//     // ✅ Update Purchase Record (optional)
//     purchase.returnAmount =
//       (purchase.returnAmount || 0) + totalAmount; // track total return
//     await purchase.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       success: true,
//       message: "Purchase return processed successfully",
//       data: {
//         purchaseReturn,
//         totalReturned: returnedProducts.length,
//         returnedProducts,
//       },
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Purchase Return Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
