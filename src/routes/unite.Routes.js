const express = require("express");
const Router = express.Router();

const UnitControllers = require("../controllers/unit.contoller");
const authMiddleware = require("../middlewares/auth.middleware");

Router.post(
  "/createUnit",
  authMiddleware.authUserMiddleWare,
  UnitControllers.addUnit
);

module.exports = Router;
