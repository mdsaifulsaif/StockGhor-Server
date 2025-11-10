const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    typeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenceType", // reference to ExpenseType collection
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now, // default today
    },
    status: { type: Boolean, default: true }, // active/inactive
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true, // createdAt & updatedAt auto
  }
);

const expenceModel = mongoose.model("Expense", ExpenseSchema);

module.exports = expenceModel;
