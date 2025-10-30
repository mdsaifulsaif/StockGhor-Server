const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

async function registerUser(req, res) {
  try {
    const { name, email, phoneNumber, password } = req.body;
    console.log("user phone number", phoneNumber);

    if (!name || !phoneNumber || !password) {
      return res
        .status(400)
        .json({ message: "pleas inter your email and password" });
    }

    // 2. Phone number length & digits check
    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        message: "Phone number must be exactly 11 digits and numeric only",
      });
    }

    const existingUser = await userModel.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: "User alrady exist" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      name,
      phoneNumber,
      email,
      password: hashedPassword,
    });

    // make token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // ❌ HTTPS না, তাই false
      sameSite: "lax", // ✅ local এর জন্য safe option
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: newUser, // <--- actual data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
}
// user logoin
async function loginUser(req, res) {
  try {
    const { phoneNumber, password } = req.body;
    console.log(phoneNumber, password);

    const user = await userModel.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ message: "Invalid User" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong Password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, //  HTTPS না, তাই false
      sameSite: "lax",
    });

    res.json({
      success: true,
      message: "Login successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
}

module.exports = {
  registerUser,
  loginUser,
};
