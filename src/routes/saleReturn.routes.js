const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const saleReturnController = require("../controllers/saleReturn.controller");

router.post(
  "/returnSale/:saleId",
  authMiddleware.authUserMiddleWare,
  saleReturnController.addSaleReturn
);

router;

module.exports = router;
