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

const getUnitList = async (req, res) => {
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

    const total = await unitModel.countDocuments(filter);
    const unit = await unitModel
      .find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Unit List fetched successfully",
      data: unit,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get Unit Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllUnits = async (req, res) => {
  try {
    const units = await unitModel.find({});

    res.status(200).json({
      success: true,
      message: "All unit fetched successfully",
      data: units.map((c) => ({
        _id: c._id,
        name: c.name,
      })),
    });
  } catch (error) {
    console.error("All Unit Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, details } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (details) updateData.details = details;

    const updated = await unitModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Unit updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update Unit Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    // প্রথমে ব্র্যান্ডটা খুঁজে বের করো
    const unit = await unitModel.findById(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    // সরাসরি delete না করে status false করে দাও
    unit.status = false;
    await unit.save();

    res.status(200).json({
      success: true,
      message: "Unit deactivated successfully",
    });
  } catch (error) {
    console.error("Unit Delete Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addUnit,
  getUnitList,
  getAllUnits,
  deleteUnit,
  updateUnit,
};
