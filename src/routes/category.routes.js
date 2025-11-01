const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const categoryControllers = require("../controllers/category.controller");

router.post(
  "/createCategory",
  authMiddleware.authUserMiddleWare,
  categoryControllers.addCategory
);
router.get(
  "/categoryList/:page/:perPage/:search",
  authMiddleware.authUserMiddleWare,
  categoryControllers.getCategoryList
);
router.get(
  "/allCategoris",
  authMiddleware.authUserMiddleWare,
  categoryControllers.getAllCategory
);

module.exports = router;
