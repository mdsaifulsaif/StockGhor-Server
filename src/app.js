const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const autnRoutes = require("./routes/user.routes");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://taka-tally.netlify.app"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is running");
});
//  Test route for checking API
app.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Test route working perfectly",
    time: new Date().toLocaleString(),
  });
});

app.use("/api/auth", autnRoutes);

module.exports = app;
