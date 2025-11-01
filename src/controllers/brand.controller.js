const brandModel = require("../models/brand.model");

const addBrand = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Required fields missing: name, phone, address",
      });
    }

    const existingBreand = await brandModel.findOne({ name });
    if (existingBreand) {
      return res.status(400).json({
        message: "Brand alrady exist",
      });
    }

    const newBrand = await brandModel.create({
      name,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Brand added successfully",
      data: newBrand,
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

const getBrandList = async (req, res) => {
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

    const total = await brandModel.countDocuments(filter);
    const brand = await brandModel
      .find(filter)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Brand List fetched successfully",
      data: brand,
      pagination: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Get Brand Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllBrands = async (req, res) => {
  try {
    const brands = await brandModel.find({});

    res.status(200).json({
      success: true,
      message: "All Brand fetched successfully",
      data: brands.map((c) => ({
        _id: c._id,
        name: c.name,
      })),
    });
  } catch (error) {
    console.error("All Brand Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addBrand,
  getBrandList,
  getAllBrands,
};
