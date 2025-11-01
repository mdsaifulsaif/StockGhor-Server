const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const supplierController = require("../controllers/supplier.contoller");

router.post(
  "/createSupplier",
  authMiddleware.authUserMiddleWare,
  supplierController.addSupplier
);
router.get(
  "/suppliertList/:page/:perPage/:search",
  authMiddleware.authUserMiddleWare,
  supplierController.getSupplierList
);
router.get(
  "/allSuppliers",
  authMiddleware.authUserMiddleWare,
  supplierController.getAllSuppliers
);

module.exports = router;
