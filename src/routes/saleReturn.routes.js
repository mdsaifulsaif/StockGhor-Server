const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const saleReturnController = require("../controllers/saleReturn.controller");

router.post(
  "/returnSale/:saleId",
  authMiddleware.authUserMiddleWare,
  saleReturnController.addSaleReturn
);
router.get(
  "/saleReturnList/:page/:perPage/:from/:to/:search",
  authMiddleware.authUserMiddleWare,
  saleReturnController.getSaleReturnList
);

router;

module.exports = router;
