const express = require('express');
const pool = require('../config/db');
const router = express.Router();
const { createContactMessage } = require('../controllers/contactcontroller');

// Route POST publique accessible par le formulaire de contact
router.post('/', createContactMessage);
// @desc    Récupérer tous les messages de contact (Pour l'Admin)
// @route   GET /api/contacts
// @access  Private/Admin (Tu pourras y ajouter ton middleware isAdmin plus tard)
router.get('/', async (req, res) => {
  try {
    // 💡 On récupère les messages du plus récent au plus ancien
    const result = await pool.query('SELECT * FROM contacts ORDER BY date_envoi DESC'); 
    res.json(result.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération du contact :", error.message);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des messages." });
  }
});

module.exports = router;