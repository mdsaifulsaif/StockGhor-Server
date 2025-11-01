const categoryModel = require("../models/category.model");

const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({
        message: "Required fields missing: name,",
      });
    }

    const existing = await categoryModel.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category alrady exist" });
    }

    const newCategory = await categoryModel.create({
      name,
      description,
    });

    res.status(200).json({
      success: true,
      message: "Category added successfully",
      data: newCategory,
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

const getCategoryList = async (req, res) => {
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

    const total = await categoryModel.countDocuments(filter);
    const Category = await categoryModel
      .find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Categroy List fetched successfully",
      data: Category,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get Category Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addCategory,
  getCategoryList,
};
