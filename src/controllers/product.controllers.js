const mongoose = require("mongoose");
const productModel = require("../models/Product.model");
const BatchModel = require("../models/Batch");

// const addProduct = async (req, res) => {
//   try {
//     const {
//       name,
//       details,
//       categoryID,
//       brandID,
//       unit,
//       qty,
//       decimal,
//       manageStock,
//       reorderLevel,
//       unitCost,
//       mrp,
//       dp,
//       salePrice,
//       taxPercent,
//       discountPercent,
//       barcode,
//       serialNumbers,
//       status,
//       isActive,
//     } = req.body;

//     // Required fields check
//     if (!name || !categoryID || !brandID || !unit || !unitCost || !mrp || !dp) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Required fields missing: name, categoryID, brandID, unit, unitCost, mrp, dp",
//       });
//     }

//     if (qty < 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Quantity cannot be negative",
//       });
//     }

//     // Convert to ObjectId
//     const categoryObjectId = new mongoose.Types.ObjectId(categoryID);
//     const brandObjectId = new mongoose.Types.ObjectId(brandID);
//     const unitObjectId = new mongoose.Types.ObjectId(unit);

//     // ✅ Create new product with first FIFO batch if qty > 0
//     const product = new productModel({
//       name,
//       details,
//       categoryID: categoryObjectId,
//       brandID: brandObjectId,
//       unit: unitObjectId,
//       stock: qty || 0, // total available stock
//       decimal: decimal || 0,
//       manageStock: manageStock !== undefined ? manageStock : true,
//       reorderLevel: reorderLevel || 0,
//       unitCost,
//       mrp,
//       dp,
//       salePrice,
//       isActive,
//       taxPercent: taxPercent || 0,
//       discountPercent: discountPercent || 0,
//       barcode: barcode || "",
//       serialNumbers: serialNumbers || [],
//       status: status !== undefined ? status : true,
//       batches:
//         qty && qty > 0
//           ? [
//               {
//                 qty: qty,
//                 unitCost: unitCost,
//                 purchaseDate: new Date(),
//               },
//             ]
//           : [],
//     });

//     await product.save();

//     res.status(201).json({
//       success: true,
//       message: "Product added successfully (FIFO ready)",
//       data: product,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// ==============================================

const addProduct = async (req, res) => {
  try {
    const {
      name,
      details,
      categoryID,
      brandID,
      unit,
      unitCost,
      mrp,
      dp,
      salePrice,
      taxPercent,
      discountPercent,
      reorderLevel,
      alertQty,
      manageStock,
      barcode,
      isActive,
      initialBatch, // optional: { qty, unitCost }
    } = req.body;

    // 🔹 Check if product already exists
    const existingProduct = await productModel.findOne({ name: name.trim() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product already exists with the same name.",
      });
    }

    // 🔹 Create base product
    const product = new productModel({
      name: name.trim(),
      details,
      categoryID,
      brandID,
      unit,
      totalStock: initialBatch ? initialBatch.qty : 0,
      lastPurchasePrice: initialBatch ? initialBatch.unitCost : 0,
      averageCost: initialBatch ? initialBatch.unitCost : 0,
      manageStock,
      reorderLevel,
      alertQty,
      isActive,
      mrp,
      dp,
      salePrice,
      taxPercent,
      discountPercent,
      barcode,
    });

    await product.save();

    // 🔹 Optional: create initial batch (if provided)
    if (initialBatch && initialBatch.qty > 0) {
      const batch = new BatchModel({
        productId: product._id,
        batchNo: "B" + Date.now(),
        purchaseQty: initialBatch.qty,
        remainingQty: initialBatch.qty,
        unitCost: initialBatch.unitCost,
        purchaseDate: new Date(),
      });
      await batch.save();
    }

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating product.",
      error: error.message,
    });
  }
};

// const getProductsList = async (req, res) => {
//   try {
//     const page = parseInt(req.params.page) || 1;
//     const perPage = parseInt(req.params.perPage) || 10;
//     const searchKey = req.params.search === "0" ? "" : req.params.search;

//     // Build filter
//     let filter = { status: true };
//     if (searchKey) {
//       filter.$or = [
//         { name: { $regex: searchKey, $options: "i" } },
//         { details: { $regex: searchKey, $options: "i" } },
//       ];
//     }

//     const total = await productModel.countDocuments(filter);

//     const products = await productModel
//       .find(filter)
//       .skip((page - 1) * perPage)
//       .limit(perPage)
//       .sort({ createdAt: -1 })
//       .populate([
//         { path: "categoryID", select: "name" },
//         { path: "brandID", select: "name" },
//         { path: "unit", select: "name" },
//       ]);

//     // Map products to flatten populated fields
//     const mappedProducts = products.map((p) => ({
//       _id: p._id,
//       name: p.name,
//       details: p.details,
//       totalStock: p.totalStock,
//       lastPurchasePrice: p.lastPurchasePrice,
//       averageCost: p.averageCost,
//       mrp: p.mrp,
//       dp: p.dp,
//       salePrice: p.salePrice,
//       taxPercent: p.taxPercent,
//       discountPercent: p.discountPercent,
//       reorderLevel: p.reorderLevel,
//       alertQty: p.alertQty,
//       manageStock: p.manageStock,
//       isActive: p.isActive,
//       barcode: p.barcode,
//       unit: p.unit ? p.unit.name : null, // ✅ direct unit name
//       brand: p.brandID ? p.brandID.name : null, // ✅ direct brand name
//       category: p.categoryID ? p.categoryID.name : null, // ✅ direct category name
//       createdAt: p.createdAt,
//     }));

//     res.json({
//       success: true,
//       message: "Products fetched successfully",
//       data: mappedProducts,
//       pagination: {
//         total,
//         page,
//         perPage,
//         totalPages: Math.ceil(total / perPage),
//       },
//     });
//   } catch (error) {
//     console.error("Get Products Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const getProductsList = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const perPage = parseInt(req.params.perPage) || 10;
    const searchKey = req.params.search === "0" ? "" : req.params.search;

    // Build filter
    let filter = { status: true };
    if (searchKey) {
      filter.$or = [
        { name: { $regex: searchKey, $options: "i" } },
        { details: { $regex: searchKey, $options: "i" } },
      ];
    }

    const total = await productModel.countDocuments(filter);

    // Fetch products
    const products = await productModel
      .find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 })
      .populate([
        { path: "categoryID", select: "name" },
        { path: "brandID", select: "name" },
      ])
      .lean(); // lean() => plain JS object

    // Map products and fetch latest batch for unit and unitCost
    const mappedProducts = await Promise.all(
      products.map(async (p) => {
        const latestBatch = await BatchModel.findOne({ productId: p._id })
          .sort({ purchaseDate: -1 })
          .select("unit unitCost");

        return {
          _id: p._id,
          name: p.name,
          details: p.details,
          totalStock: p.totalStock,
          lastPurchasePrice: p.lastPurchasePrice,
          averageCost: p.averageCost,
          mrp: p.mrp,
          dp: p.dp,
          salePrice: p.salePrice,
          taxPercent: p.taxPercent,
          discountPercent: p.discountPercent,
          reorderLevel: p.reorderLevel,
          alertQty: p.alertQty,
          manageStock: p.manageStock,
          isActive: p.isActive,
          barcode: p.barcode,
          unit: latestBatch ? latestBatch.unit : null, // ✅ unit name from latest batch
          unitCost: latestBatch ? latestBatch.unitCost : 0, // ✅ unitCost from latest batch
          brand: p.brandID ? p.brandID.name : null, // ✅ brand name
          category: p.categoryID ? p.categoryID.name : null, // ✅ category name
          createdAt: p.createdAt,
        };
      })
    );

    res.json({
      success: true,
      message: "Products fetched successfully",
      data: mappedProducts,
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

const getAllProducts = async (req, res) => {
  try {
    const products = await productModel.find({}).select("-batches");

    res.status(200).json({
      success: true,
      message: "All product fetched successfully",
      // data: products.map((c) => ({
      //   _id: c._id,
      //   name: c.name,
      // })),
      data: products,
    });
  } catch (error) {
    console.error("All product Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    // 🔹 Find Product and Populate Relations
    const product = await productModel
      .findById(id)
      .populate("categoryID", "name")
      .populate("brandID", "name")
      .populate("unit", "name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // 🔹 Success response
    res.status(200).json({
      success: true,
      message: "Product details fetched successfully.",
      data: product,
    });
  } catch (error) {
    console.error("Get Product Details Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // body থেকে সব data destructure করা
    const {
      name,
      details,
      categoryID,
      brandID,
      unit,
      serialNumbers,
      barcode,
      unitCost,
      mrp,
      dp,
      salePrice,
      alertQty,
      reorderLevel,
      taxPercent,
      discountPercent,
      status,
    } = req.body;

    // প্রোডাক্ট আছে কিনা চেক করা
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // আপডেট করার data object তৈরি করা
    const updateData = {
      ...(name && { name }),
      ...(details && { details }),
      ...(categoryID && { categoryID }),
      ...(brandID && { brandID }),
      ...(unit && { unit }),
      ...(serialNumbers && { serialNumbers }),
      ...(barcode && { barcode }),
      ...(unitCost && { unitCost }),
      ...(mrp && { mrp }),
      ...(dp && { dp }),
      ...(salePrice && { salePrice }),
      ...(alertQty && { alertQty }),
      ...(reorderLevel && { reorderLevel }),
      ...(taxPercent && { taxPercent }),
      ...(discountPercent && { discountPercent }),
      ...(status !== undefined && { status }),
    };

    // Update করা
    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// const updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // 🔹 Validate product id
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid product ID format.",
//       });
//     }

//     // 🔹 Extract updated fields from body
//     const {
//       name,
//       details,
//       categoryID,
//       brandID,
//       unit,
//       mrp,
//       dp,
//       alertQty,
//       status,
//     } = req.body;

//     // 🔹 Prepare update object (only send defined fields)
//     const updateData = {};
//     if (name) updateData.name = name;
//     if (details) updateData.details = details;
//     if (categoryID) updateData.categoryID = categoryID;
//     if (brandID) updateData.brandID = brandID;
//     if (unit) updateData.unit = unit;
//     if (mrp !== undefined) updateData.mrp = mrp;
//     if (dp !== undefined) updateData.dp = dp;
//     if (alertQty !== undefined) updateData.alertQty = alertQty;
//     if (status !== undefined) updateData.status = status;

//     // 🔹 Update product
//     const updatedProduct = await productModel.findByIdAndUpdate(
//       id,
//       updateData,
//       {
//         new: true, // return updated document
//         runValidators: true, // enforce schema validation
//       }
//     );

//     if (!updatedProduct) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found.",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Product updated successfully.",
//       data: updatedProduct,
//     });
//   } catch (error) {
//     console.error("Update Product Error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // প্রোডাক্ট খুঁজে বের করো
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // সরাসরি delete না করে status false করে দাও
    product.status = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: "Product deactivated successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addProduct,
  getProductsList,
  getAllProducts,
  getProductDetails,
  updateProduct,
  deleteProduct,
};
