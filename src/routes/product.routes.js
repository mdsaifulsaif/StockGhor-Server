const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controllers");
const authMiddleware = require("../middlewares/auth.middleware");

router.post(
  "/addProduct",
  authMiddleware.authUserMiddleWare,
  productController.addProduct
);

// GET /api/product/productList/:page/:perPage/:search?
router.get(
  "/productList/:page/:perPage/:search",
  authMiddleware.authUserMiddleWare,
  productController.getProductsList
);
router.get(
  "/allProducts",
  authMiddleware.authUserMiddleWare,
  productController.getAllProducts
);

module.exports = router;
