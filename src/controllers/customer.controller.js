const customerModel = require("../models/customer.model");

const addCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, previousDue } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({
        message: "Required fields missing: name, phone, address",
      });
    }

    const existingCustomer = await customerModel.findOne({ phone });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer alrady exist" });
    }
    const newCustomer = await customerModel.create({
      name,
      phone,
      email,
      address,
      previousDue,
    });

    res.status(201).json({
      success: true,
      message: "Customer added successfully",
      data: newCustomer,
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
  addCustomer,
};
