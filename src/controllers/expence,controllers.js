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

    const fromDate = req.params.from !== "0" ? new Date(req.params.from) : null;
    const toDate = req.params.to !== "0" ? new Date(req.params.to) : null;
    const searchKey = req.params.search !== "0" ? req.params.search : "";

    let filter = { status: true };

    // Search by note (string) or amount (number)
    if (searchKey) {
      const amountValue = Number(searchKey);
      filter.$or = [
        { note: { $regex: searchKey, $options: "i" } },
        !isNaN(amountValue) ? { amount: amountValue } : null,
      ].filter(Boolean); // remove nulls
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

const getExpensesByType = async (req, res) => {
  try {
    const { typeID, from, to, period } = req.params;

    let filter = {
      typeID,
      isActive: true,
    };

    // 🗓️ Period-based date range হিসাব করা
    let startDate = null;
    let endDate = null;
    const now = new Date();

    switch (period) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;

      case "thisWeek":
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "lastWeek":
        startDate = new Date(now.setDate(now.getDate() - now.getDay() - 7));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "thisMonth":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        break;

      case "lastMonth":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;

      case "thisYear":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;

      case "lastYear":
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;

      default:
        // যদি manual from/to আসে তাহলে সেটাই ব্যবহার হবে
        if (from !== "0" && to !== "0") {
          startDate = new Date(from);
          endDate = new Date(to);
        }
        break;
    }

    // 🔍 যদি কোনো date range থাকে, filter এ যোগ করা হবে
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    // 🔢 Database query
    const expenses = await expenseModel
      .find(filter)
      .populate("typeID", "name")
      .sort({ date: -1 });

    res.json({
      success: true,
      message: "Expenses fetched successfully by type",
      data: expenses,
      filterApplied: period !== "0" ? period : "custom/manual",
    });
  } catch (error) {
    console.error("Get Expenses By Type Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// etao kaj kore eta priod chara
// const getExpensesByType = async (req, res) => {
//   try {
//     const { typeID, from, to } = req.params;

//     // Filter তৈরি
//     let filter = {
//       typeID: typeID,
//       isActive: true,
//     };

//     //  Date range থাকলে সেটা filter এ যোগ করা হবে
//     if (from !== "0" && to !== "0") {
//       filter.date = {
//         $gte: new Date(from),
//         $lte: new Date(to),
//       };
//     }

//     //  Database থেকে খোঁজা
//     const expenses = await expenseModel
//       .find(filter)
//       .populate("typeID", "name") // Type name show করবে
//       .sort({ date: -1 });

//     res.json({
//       success: true,
//       message: "Expenses fetched successfully by type",
//       data: expenses,
//     });
//   } catch (error) {
//     console.error("Get Expenses By Type Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

module.exports = {
  createExpense,
  getExpenseList,
  getExpensesByType,
};
