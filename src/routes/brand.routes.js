const express = require("express");
const Router = express.Router();

const brandControllers = require("../controllers/brand.controller");
const authMiddleware = require("../middlewares/auth.middleware");

Router.post(
  "/createBrand",
  authMiddleware.authUserMiddleWare,
  brandControllers.addBrand
);

module.exports = Router;
