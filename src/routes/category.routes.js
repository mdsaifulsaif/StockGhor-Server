const express = require("express");
const Router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const categoryControllers = require("../controllers/category.controller");

Router.post(
  "/createCategory",
  authMiddleware.authUserMiddleWare,
  categoryControllers.addCategory
);
Router.get(
  "/categoryList/:page/:perPage/:search",
  authMiddleware.authUserMiddleWare,
  categoryControllers.getCategoryList
);

module.exports = Router;
