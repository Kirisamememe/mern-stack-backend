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

// Read UsersCollectedItem
router.get("/readUser/:userId", userController.readUser)

//Follow
router.post("/:yourId/:action", userController.follow)

module.exports = router;