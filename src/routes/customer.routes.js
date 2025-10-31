const express = require("express");
const Router = express.Router();
const customersControllers = require("../controllers/customer.controller");
const authMiddleware = require("../middlewares/auth.middleware");

Router.post(
  "/creteCustomer",
  authMiddleware.authUserMiddleWare,
  customersControllers.addCustomer
);

module.exports = Router;
