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

Router.get(
  "/saleDetails/:id",
  authMiddleware.authUserMiddleWare,
  saleController.getSaleDetail
);

Router.get(
  "/deleteSale/:id",
  authMiddleware.authUserMiddleWare,
  saleController.deleteSale
);
Router.put(
  "/editSale/:id",
  authMiddleware.authUserMiddleWare,
  saleController.editSale
);
Router.post(
  "/returnSale",
  authMiddleware.authUserMiddleWare,
  saleController.addSaleReturn
);

module.exports = Router;
