const express = require("express");
const router = express.Router();
const customersControllers = require("../controllers/customer.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post(
  "/createCustomer",
  authMiddleware.authUserMiddleWare,
  customersControllers.addCustomer
);
router.get(
  "/customertList/:page/:perPage/:search",
  authMiddleware.authUserMiddleWare,
  customersControllers.getCustomerList
);
router.get(
  "/allCustomers",
  authMiddleware.authUserMiddleWare,
  customersControllers.getAllCustomers
);

module.exports = router;
