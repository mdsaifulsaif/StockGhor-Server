const customerModel = require("../models/customer.model");

const addCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, previousDue, isActive } = req.body;

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
      isActive,
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

const getCustomerList = async (req, res) => {
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

    //  Pagination + sorting
    const total = await customerModel.countDocuments(filter);
    const customers = await customerModel
      .find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Customer list fetched successfully",
      data: customers,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get Customer Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const customers = await customerModel.find({});

    res.status(200).json({
      success: true,
      message: "All Customers fetched successfully",
      data: customers.map((c) => ({
        _id: c._id,
        name: c.name,
      })),
    });
  } catch (error) {
    console.error("Get Customer Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    // Build update object dynamically
    const updateData = {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(email && { email }),
      ...(address && { address }),
    };

    const updatedCustomer = await customerModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("Update Customer Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const softDeleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await customerModel.findById(id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    customer.status = false; // Soft delete
    await customer.save();

    res.status(200).json({
      success: true,
      message: "Customer deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addCustomer,
  getCustomerList,
  getAllCustomers,
  softDeleteCustomer,
  updateCustomer,
};
