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
    let filter = { status: true };
    if (searchKey && searchKey !== "0") {
      // এখানে name বা details এর মধ্যে search হবে

      filter.$or = [
        { name: { $regex: searchKey, $options: "i" } },
        { details: { $regex: searchKey, $options: "i" } },
      ];
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

const getAllCategory = async (req, res) => {
  try {
    const category = await categoryModel.find({});

    res.status(200).json({
      success: true,
      message: "All Brand fetched successfully",
      data: category.map((c) => ({
        _id: c._id,
        name: c.name,
      })),
    });
  } catch (error) {
    console.error("All Brand Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // প্রথমে ব্র্যান্ডটা খুঁজে বের করো
    const category = await categoryModel.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // সরাসরি delete না করে status false করে দাও
    category.status = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Category deactivated successfully",
    });
  } catch (error) {
    console.error("Category Delete Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// const deleteCategory = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deleted = await categoryModel.findByIdAndDelete(id);
//     if (!deleted) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Category deleted successfully",
//     });
//   } catch (error) {
//     console.error("Category Product Error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

module.exports = {
  addCategory,
  getCategoryList,
  getAllCategory,
  deleteCategory,
};
