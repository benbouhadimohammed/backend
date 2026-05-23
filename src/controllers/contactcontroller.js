const pool = require('../config/db'); // Importe ta configuration de base de données PostgreSQL

// @desc    Envoyer un message de contact
// @route   POST /api/contacts
// @access  Public
const createContactMessage = async (req, res) => {
  const { nom, email, sujet, message } = req.body;

  // Validation simple des champs obligatoires
  if (!nom || !email || !sujet || !message) {
    return res.status(400).json({ message: "Veuillez remplir tous les champs obligatoires." });
  }

  if (message.trim().length < 10) {
    return res.status(400).json({ message: "Le message doit contenir au moins 10 caractères." });
  }

  try {
    // Insertion dans la base de données PostgreSQL
    const query = `
      INSERT INTO contacts (nom, email, sujet, message) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
    const values = [nom.trim(), email.trim(), sujet.trim(), message.trim()];
    const result = await pool.query(query, values);

    // Réponse de succès renvoyée au Frontend
    res.status(201).json({
      success: true,
      message: "Message enregistré avec succès !",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Erreur contactController :", error.message);
    res.status(500).json({ message: "Une erreur interne est survenue sur le serveur." });
  }
};
// Récupérer tous les messages de contact
const getAllContacts = async (req, res) => {
  try {
    // Ajuste le nom de la table si elle s'appelle différemment (ex: contact_messages ou contacts)
    const result = await pool.query("SELECT * FROM contacts ORDER BY date_envoi DESC"); 
    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des messages" });
  }
};

// N'oublie pas d'ajouter 'getAllContacts' dans le module.exports en bas du fichier admincontroller.js !

module.exports = { createContactMessage, getAllContacts };