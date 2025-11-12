const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const expenceTypeContoller = require("../controllers/expenceType.controllers");

router.post(
  "/CreateExpenceType",
  authMiddleware.authUserMiddleWare,
  expenceTypeContoller.createExpenceType
);
router.get(
  "/ExpenceTypeList/:page/:perPage/:search",
  authMiddleware.authUserMiddleWare,
  expenceTypeContoller.getExpenceTypeList
);
router.put(
  "/editExpenceType/:id",
  authMiddleware.authUserMiddleWare,
  expenceTypeContoller.editExpenceType
);
router.delete(
  "/deleteExpenceType/:id",
  authMiddleware.authUserMiddleWare,
  expenceTypeContoller.deleteExpenctType
);

module.exports = router;
