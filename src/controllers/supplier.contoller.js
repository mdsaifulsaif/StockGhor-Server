const supplierModel = require("../models/supplier.model");

const addSupplier = async (req, res) => {
  try {
    const { name, company, phone, email, address, previousDue, isActive } =
      req.body;

    // Required field check
    if (!name || !phone || !address) {
      return res.status(400).json({
        message: "Name, phone and address are required.",
      });
    }

    // Duplicate phone check
    const existing = await supplierModel.findOne({ phone });
    if (existing) {
      return res.status(400).json({
        message: "Supplier with this phone already exists.",
      });
    }

    const newSupplier = await supplierModel.create({
      name,
      company,
      phone,
      email,
      address,
      previousDue,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Supplier added successfully.",
      data: newSupplier,
    });
  } catch (error) {
    console.error("Add Supplier Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSupplierList = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const perPage = parseInt(req.params.perPage) || 10;
    const searchKey = req.params.search === "0" ? "" : req.params.search;

    //  Base filter: শুধু active customer নেবে
    let filter = { status: true };

    //  যদি search key থাকে, তাহলে নাম বা ফোনে খুঁজবে
    if (searchKey && searchKey !== "0") {
      filter.$or = [
        { name: { $regex: searchKey, $options: "i" } },
        { phone: { $regex: searchKey, $options: "i" } },
        { email: { $regex: searchKey, $options: "i" } },
      ];
    }

    const total = await supplierModel.countDocuments(filter);
    const supplier = await supplierModel
      .find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Supplier List fetched successfully",
      data: supplier,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get Supplier Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await supplierModel.find({});

    res.status(200).json({
      success: true,
      message: "All Supplier fetched successfully",
      data: suppliers.map((c) => ({
        _id: c._id,
        name: c.name,
      })),
    });
  } catch (error) {
    console.error("Get Supplier Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// const updateSupplier = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, phone, email, address } = req.body;

//     const updateData = {
//       ...(name && { name }),
//       ...(phone && { phone }),
//       ...(email && { email }),
//       ...(address && { address }),

//     };

//     const updatedSupplier = await supplierModel.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true }
//     );

//     if (!updatedSupplier) {
//       return res.status(404).json({
//         success: false,
//         message: "Supplier not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Supplier updated successfully",
//       data: updatedSupplier,
//     });
//   } catch (error) {
//     console.error("Update Supplier Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, isActive } = req.body;

    // Build update object dynamically
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (address) updateData.address = address;
    if (typeof isActive !== "undefined") updateData.isActive = isActive;

    const updatedSupplier = await supplierModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: updatedSupplier,
    });
  } catch (error) {
    console.error("Update Supplier Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const softDeleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await supplierModel.findById(id);
    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }

    supplier.status = false;
    await supplier.save();

    res.status(200).json({
      success: true,
      message: "Supplier deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addSupplier,
  getSupplierList,
  getAllSuppliers,
  softDeleteSupplier,
  updateSupplier,
};
