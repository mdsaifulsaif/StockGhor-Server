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

module.exports = {
  addSupplier,
};
