const customerModel = require("../models/customer.model");

const addCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, previousDue } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing: name, phone, address",
        data: null,
      });
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
