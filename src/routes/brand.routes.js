const express = require("express");
const router = express.Router();

const brandControllers = require("../controllers/brand.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post(
  "/createBrand",
  authMiddleware.authUserMiddleWare,
  brandControllers.addBrand
);
router.get(
  "/brandList/:page/:perPage/:search",
  authMiddleware.authUserMiddleWare,
  brandControllers.getBrandList
);
router.get(
  "/allBrands",
  authMiddleware.authUserMiddleWare,
  brandControllers.getAllBrands
);
router.get(
  "/deleteBrands/:id",
  authMiddleware.authUserMiddleWare,
  brandControllers.deleteBrand
);

module.exports = router;
