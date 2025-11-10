const mongoose = require("mongoose");

const ExpenceTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Product name
  },
  {
    timestamps: true, // createdAt & updatedAt auto
  }
);

const ExpenceTypeModel = mongoose.model("ExpenceType", ExpenceTypeSchema);
module.exports = ExpenceTypeModel;
