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
  "/ExpenceTypeList",
  authMiddleware.authUserMiddleWare,
  expenceTypeContoller.getExpenceTypeList
);

module.exports = router;
