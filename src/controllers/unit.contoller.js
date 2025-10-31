const unitModel = require("../models/unit.model");

const addUnit = async (req, res) => {
  try {
    const { name, description, shortName } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Required fields missing: name",
      });
    }

    const existingBreand = await unitModel.findOne({ name });
    if (existingBreand) {
      return res.status(400).json({
        message: "Unit alrady exist",
      });
    }

    const newUnit = await unitModel.create({
      name,
      description,
      shortName,
    });

    res.status(201).json({
      success: true,
      message: "Unit added successfully",
      data: newUnit,
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
  addUnit,
};
