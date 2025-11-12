const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const expenceContoller = require("../controllers/expence,controllers");

router.post(
  "/createExpence",
  authMiddleware.authUserMiddleWare,
  expenceContoller.createExpense
);
// router.get(
//   "/ExpenceList/:page/:perPage/:search/:from/:to",
//   authMiddleware.authUserMiddleWare,
//   expenceContoller.getExpenseList
// );

// Make search required in path (use 0 if no search)
router.get(
  "/ExpenceList/:page/:perPage/:from/:to/:search",
  authMiddleware.authUserMiddleWare,
  expenceContoller.getExpenseList
);

// router.get(
//   "/ExpenceList/:page/:perPage/:from/:to/:search?",
//   authMiddleware.authUserMiddleWare,
//   expenceContoller.getExpenseList
// );
router.get(
  "/getExpensesByType/:typeID/:from/:to/:period",
  authMiddleware.authUserMiddleWare,
  expenceContoller.getExpensesByType
);

// router.get(
//   "/getExpensesByType/:typeID/:from/:to",
//   authMiddleware.authUserMiddleWare,
//   expenceContoller.getExpensesByType
// );

module.exports = router;
