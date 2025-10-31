const express = require("express");
const Router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const purchaseController = require("../controllers/purchase.controller");

Router.post(
  "/createPurchase",
  authMiddleware.authUserMiddleWare,
  purchaseController.addPurchase
);

module.exports = Router;
