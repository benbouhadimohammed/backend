const express = require("express");
const router = express.Router();
const {authMiddleware} = require("../middleware/authmiddleware");
const { addFav, getFav, removeFav } = require("../controllers/favoriscontroller");

router.post("/addfavoris/:annonceId", authMiddleware, addFav);
router.get("/", authMiddleware, getFav);
router.delete("/deletefavoris/:annonceId", authMiddleware, removeFav); 
module.exports = router;