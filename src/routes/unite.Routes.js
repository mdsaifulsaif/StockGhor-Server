const express = require("express");
const Router = express.Router();

const UnitControllers = require("../controllers/unit.contoller");
const authMiddleware = require("../middlewares/auth.middleware");

Router.post(
  "/createUnit",
  authMiddleware.authUserMiddleWare,
  UnitControllers.addUnit
);
Router.get(
  "/unitList/:page/:perPage/:search",
  authMiddleware.authUserMiddleWare,
  UnitControllers.getUnitList
);

module.exports = Router;
