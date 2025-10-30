const express = require("express");
const Router = express.Router();
const authController = require("../controllers/auth.controllers");

Router.post("/register", authController.registerUser);
Router.post("/login", authController.loginUser);

module.exports = Router;
