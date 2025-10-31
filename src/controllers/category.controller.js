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

module.exports = {
  addCategory,
};
