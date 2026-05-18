const express = require("express");
const router = express.Router();
const {
  addAnnonce,
  listerAnnonces,
  voirAnnonce,
  editAnnonce,
  removeAnnonce,
} = require("../controllers/annoncecontroller");
const {authMiddleware} = require("../middleware/authmiddleware");
const upload = require('../middleware/upload')

// Routes publiques (sans token)
router.get("/listerAnnonces", listerAnnonces);
router.get("/voirAnnonce/:id", voirAnnonce);

// Routes protégées (token requis)
router.post("/addAnnonce", authMiddleware, upload.single('photo'), addAnnonce);
router.put("/editAnnonce/:id", authMiddleware, upload.single('photo'), editAnnonce);
router.delete("/removeAnnonce/:id", authMiddleware, removeAnnonce);

module.exports = router;