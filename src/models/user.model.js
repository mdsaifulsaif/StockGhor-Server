const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: String,
    phoneNumber: {
      type: String,
      minlength: 11,
      maxlength: 11,
      match: /^[0-9]{11}$/,
    },
    email: {
      type: String,
      default: null,
    },
    password: String,
    role: { type: String, enum: ["admin", "user"], default: "user" },
    status: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.model("User", UserSchema);

module.exports = userModel;
