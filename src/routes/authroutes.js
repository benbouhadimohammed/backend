const express = require("express");
const router = express.Router();
const { login, register, verifyOTP } = require("../controllers/authcontroller");
const { authMiddleware, adminMiddleware } = require('../middleware/authmiddleware');

router.post("/login", login);
router.post("/register", register);


router.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

router.get("/dashboard", authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: "Welcome Admin" });
});

module.exports = router;