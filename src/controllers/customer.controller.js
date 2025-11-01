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

const getCustomerList = async (req, res) => {
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

    const total = await customerModel.countDocuments(filter);
    const customer = await customerModel
      .find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Customer List fetched successfully",
      data: customer,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get Customer Error:", error);
    res.status(500).json({ success: false, message: error.message });
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
module.exports = {
  addCustomer,
  getCustomerList,
  getAllCustomers,
};
