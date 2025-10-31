const express = require("express");
const Router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const supplierController = require("../controllers/supplier.contoller");

Router.post(
  "/createSupplier",
  authMiddleware.authUserMiddleWare,
  supplierController.addSupplier
);

module.exports = Router;
