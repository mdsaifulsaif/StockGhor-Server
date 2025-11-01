const express = require("express");
const Router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const saleController = require("../controllers/sale.controller");

Router.post(
  "/createSale",
  authMiddleware.authUserMiddleWare,
  saleController.addSale
);
Router.get(
  "/saleList/:page/:perPage/:search",
  authMiddleware.authUserMiddleWare,
  saleController.getSalesList
);

module.exports = Router;
