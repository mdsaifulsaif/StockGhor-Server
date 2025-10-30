const express = require("express");
const Router = express.Router();
const productControler = require("../controllers/product.controllers");
const authMiddleware = require("../middlewares/auth.middleware");

Router.post(
  "/addProduct",
  authMiddleware.authUserMiddleWare,
  productControler.addProduct
);

module.exports = Router;
