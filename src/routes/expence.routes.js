const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const expenceContoller = require("../controllers/expence.controllers");

router.post(
  "/CreateExpenceType",
  authMiddleware.authUserMiddleWare,
  expenceContoller.createExpenceType
);

module.exports = router;
