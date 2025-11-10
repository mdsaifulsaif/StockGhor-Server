const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const autnRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const customerRoutes = require("./routes/customer.routes");
const brandRoutes = require("./routes/brand.routes");
const categoryRoutes = require("./routes/category.routes");
const unitRoutes = require("./routes/unite.Routes");
const supplierRoutes = require("./routes/supplier.routes");
const purchaseRoutes = require("./routes/purchase.routes");
const saleRoutes = require("./routes/sale.route");
const expenceTypeRoutes = require("./routes/expenceType.routes");
const expenceRoutes = require("./routes/expence.routes");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://stockghor.netlify.app"],
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
app.use("/api", productRoutes);
app.use("/api", customerRoutes);
app.use("/api", brandRoutes);
app.use("/api", categoryRoutes);
app.use("/api", unitRoutes);
app.use("/api", supplierRoutes);
app.use("/api", purchaseRoutes);
app.use("/api", saleRoutes);
app.use("/api", expenceTypeRoutes);
app.use("/api", expenceRoutes);

module.exports = app;
