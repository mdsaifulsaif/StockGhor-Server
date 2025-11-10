const expenceTypeModel = require("../models/expence.model");

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

module.exports = {
  createExpenceType,
};
