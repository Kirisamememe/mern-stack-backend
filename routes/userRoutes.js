const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// USER functions
// Register User
router.post("/register", userController.register)

// Login User
router.post("/login", userController.login)

// Logout User
router.post("/logout", userController.logout);

// Read User
router.get("/readUser/:userId", userController.readUser)

module.exports = router;