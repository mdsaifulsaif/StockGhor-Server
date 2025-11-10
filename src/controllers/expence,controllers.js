const expenseModel = require("../models/expence.model");

//  Create Expense
const createExpense = async (req, res) => {
  try {
    const { typeID, amount, note, date } = req.body;

    // Validation
    if (!typeID || !amount) {
      return res.status(400).json({
        success: false,
        msg: "typeID and amount are required",
      });
    }

    const newExpense = new expenseModel({
      typeID,
      amount,
      note: note || "",
      date: date || Date.now(),
    });

    await newExpense.save();

    res.json({
      success: true,
      msg: "Expense created successfully",
      data: newExpense,
    });
  } catch (error) {
    console.error("Create Expense Error:", error);
    res.status(500).json({ success: false, msg: error.message });
  }
};

//  Get Expense List with Pagination + Search + Date Filter
const getExpenseList = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const perPage = parseInt(req.params.perPage) || 20;
    const searchKey = req.params.search === "0" ? "" : req.params.search;
    const fromDate = req.params.from !== "0" ? new Date(req.params.from) : null;
    const toDate = req.params.to !== "0" ? new Date(req.params.to) : null;

    let filter = { status: true };

    // Search by note or amount
    if (searchKey) {
      filter.$or = [
        { note: { $regex: searchKey, $options: "i" } },
        { amount: { $regex: searchKey, $options: "i" } },
      ];
    }

    // Date filter
    if (fromDate && toDate) {
      filter.date = { $gte: fromDate, $lte: toDate };
    }

    const total = await expenseModel.countDocuments(filter);

    const expenses = await expenseModel
      .find(filter)
      .populate("typeID", "name") // populate type name
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ date: -1 });

    res.json({
      success: true,
      msg: "Expense list fetched successfully",
      data: expenses,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get Expense List Error:", error);
    res.status(500).json({ success: false, msg: error.message });
  }
};

module.exports = {
  createExpense,
  getExpenseList,
};
