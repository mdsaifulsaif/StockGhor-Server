const supplierModel = require("../models/supplier.model");

const addSupplier = async (req, res) => {
  try {
    const { name, company, phone, email, address, previousDue } = req.body;

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

    // Build filter
    let filter = {};
    if (searchKey && searchKey !== "0") {
      // এখানে name বা details এর মধ্যে search হবে
      filter = {
        $or: [
          { name: { $regex: searchKey, $options: "i" } },
          { details: { $regex: searchKey, $options: "i" } },
        ],
      };
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

module.exports = {
  addSupplier,
  getSupplierList,
  getAllSuppliers,
};
