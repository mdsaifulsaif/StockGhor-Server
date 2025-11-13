const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const purchaseController = require("../controllers/purchase.controller");

router.post(
  "/createPurchase",
  authMiddleware.authUserMiddleWare,
  purchaseController.addPurchase
);
// GET /api/purchasesList/:page/:perPage/:search

router.get(
  "/purchasesList/:page/:perPage/:search",
  authMiddleware.authUserMiddleWare,
  purchaseController.getPurchasesList
);
router.put(
  "/editPurchase/:id",
  authMiddleware.authUserMiddleWare,
  purchaseController.editPurchase
);
router.post(
  "/returnPurchase/:id",
  authMiddleware.authUserMiddleWare,
  purchaseController.purchaseReturn
);

// GET purchase detail by ID
router.get(
  "/purchaseDetail/:purchaseId",
  authMiddleware.authUserMiddleWare,
  purchaseController.getPurchaseDetail
);

router.delete(
  "/deletePurchase/:id",
  authMiddleware.authUserMiddleWare,
  purchaseController.deletePurchase
);

module.exports = router;
