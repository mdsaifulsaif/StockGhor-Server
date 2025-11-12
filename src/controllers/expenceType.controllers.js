const expenceTypeModel = require("../models/expenceType.model");

const expenceModle = require("../models/expence.model");

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

// PUT /editExpenceType/:id
const editExpenceType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    const updated = await expenceTypeModel.findByIdAndUpdate(
      id,
      { name, isActive },
      { new: true } // return updated document
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Expense Type not found" });
    }

    res.json({
      success: true,
      message: "Expense Type updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Edit Expense Type Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExpenctType = async (req, res) => {
  try {
    const { id } = req.params;

    // 🟠 Validation check
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Expense type ID is required",
      });
    }

    // 🟠 Check if expense type exists
    const existingExpType = await expenceTypeModel.findById(id);
    if (!existingExpType) {
      return res.status(404).json({
        status: false,
        message: "Expense type not found",
      });
    }

    // 🟠 Check if this expense type is used in expense collection
    const usedInExpense = await expenceModle.findOne({ expenceTypeID: id });
    if (usedInExpense) {
      return res.status(400).json({
        status: false,
        message:
          "This expense type is already used in an expense record. Delete not allowed.",
      });
    }

    // 🟢 If not used, delete it
    await expenceTypeModel.deleteOne({ _id: id });

    return res.status(200).json({
      status: true,
      message: "Expense type deleted successfully",
    });
  } catch (error) {
    console.error("Delete Expense Type Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  createExpenceType,
  getExpenceTypeList,
  editExpenceType,
  deleteExpenctType,
};
