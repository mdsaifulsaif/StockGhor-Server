const express = require("express");
const router = express.Router();

const UnitControllers = require("../controllers/unit.contoller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post(
  "/createUnit",
  authMiddleware.authUserMiddleWare,
  UnitControllers.addUnit
);
router.get(
  "/unitList/:page/:perPage/:search",
  authMiddleware.authUserMiddleWare,
  UnitControllers.getUnitList
);
router.get(
  "/allUnits",
  authMiddleware.authUserMiddleWare,
  UnitControllers.getAllUnits
);
router.put(
  "/editUnit/:id",
  authMiddleware.authUserMiddleWare,
  UnitControllers.updateUnit
);
router.get(
  "/deleteUnit/:id",
  authMiddleware.authUserMiddleWare,
  UnitControllers.deleteUnit
);

module.exports = router;
