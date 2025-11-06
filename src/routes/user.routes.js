const express = require("express");
const Router = express.Router();
const authController = require("../controllers/auth.controllers");
const productControler = require("../controllers/product.controllers");
const authMiddleware = require("../middlewares/auth.middleware");

Router.post("/register", authController.registerUser);
Router.post("/login", authController.loginUser);
Router.get("/logout", authController.logOutUser);
Router.post(
  "/addProduct",
  authMiddleware.authUserMiddleWare,
  productControler.addProduct
);

Router.get(
  "/currentUser",
  authMiddleware.authUserMiddleWare,
  authController.currentUser
);

module.exports = Router;
