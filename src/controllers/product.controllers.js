const productModel = require("../models/Product.model");

// Add new product

// const addProduct = async (req, res) => {
//   try {
//     const {
//       name,
//       brand,
//       category,
//       costPrice,
//       salePrice,
//       stock,
//       barcode,
//       serialNumbers,
//     } = req.body;

//     if (!name || !costPrice || !salePrice) {
//       return res.status(400).json({
//         success: false,
//         message: "Name, costPrice and salePrice are required",
//         data: null,
//       });
//     }

//     const product = new productModel({
//       name,
//       brand,
//       category,
//       costPrice,
//       salePrice,
//       stock,
//       barcode,
//       serialNumbers,
//     });

//     await product.save();

//     res.status(201).json({
//       success: true,
//       message: "Product added successfully",
//       data: product,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//       data: null,
//     });
//   }
// };

const addProduct = async (req, res) => {
  try {
    const {
      name,
      details,
      categoryID,
      brandID,
      unit,
      qty,
      decimal,
      manageStock,
      reorderLevel,
      unitCost,
      mrp,
      dp,
      taxPercent,
      discountPercent,
      barcode,
      serialNumbers,
      status,
    } = req.body;

    // Required fields check
    if (!name || !categoryID || !brandID || !unit || !unitCost || !mrp || !dp) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields missing: name, categoryID, brandID, unit, unitCost, mrp, dp",
        data: null,
      });
    }

    // Stock validation
    if (qty < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
        data: null,
      });
    }

    // Create new product
    const product = new productModel({
      name,
      details,
      categoryID,
      brandID,
      unit,
      qty: qty || 0,
      decimal: decimal || 0,
      manageStock: manageStock !== undefined ? manageStock : true,
      reorderLevel: reorderLevel || 0,
      unitCost,
      mrp,
      dp,
      taxPercent: taxPercent || 0,
      discountPercent: discountPercent || 0,
      barcode: barcode || "",
      serialNumbers: serialNumbers || [],
      status: status !== undefined ? status : true,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: null,
    });
  }
};

module.exports = {
  addProduct,
};
