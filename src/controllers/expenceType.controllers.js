const expenceTypeModel = require("../models/expenceType.model");

async function createExpenceType(req, res) {
  const { name } = req.body;
  console.log(name);

  if (!name) {
    return res.status(400).json({
      status: false,
      msg: "Category name is required",
    });
  }

  const existingExpenceType = await expenceTypeModel.findOne({ name });

  if (existingExpenceType) {
    return res.status(400).json({
      message: "Expence type alrady exist",
    });
  }

  const expenceType = await expenceTypeModel.create({ name });

  res.status(200).json({
    success: true,
    message: "Expense added successfully",
    expenceType,
  });
}

const getExpenceTypeList = async (req, res) => {
  try {
    // page, perPage, search params
    const page = parseInt(req.params.page) || 1;
    const perPage = parseInt(req.params.perPage) || 20;
    const searchKey = req.params.search === "0" ? "" : req.params.search;

    // Build filter
    let filter = {};
    if (searchKey && searchKey !== "0") {
      filter.name = { $regex: searchKey, $options: "i" }; // name এ search
    }

    // Total count
    const total = await expenceTypeModel.countDocuments(filter);

    // Fetch data with pagination
    const expenseTypes = await expenceTypeModel
      .find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Expense Type List fetched successfully",
      data: expenseTypes,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get ExpenseType Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createExpenceType,
  getExpenceTypeList,
};
