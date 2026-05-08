'use strict';

const express       = require('express');
const router        = express.Router();
const authMiddleware = require('../middleware/authmiddleware');
const {
  creerSujet,
  listerSujets,
  rechercherSujets,
  obtenirSujet,
  fermerSujet,
  supprimerSujet,
  ajouterCommentaire,
  supprimerCommentaire,
} = require('../controllers/forumController');



// ── Sujets ────────────────────────────────────────────────────
router.get('/',             listerSujets);
router.get('/recherche',    rechercherSujets);
router.get('/:id',          obtenirSujet);
router.post('/',           authMiddleware, creerSujet);
router.patch('/:id/fermer', authMiddleware, fermerSujet);
router.delete('/:id',       authMiddleware, supprimerSujet);

// ── Commentaires ─────────────────────────────────────────────
router.post('/:id/commentaires',                          authMiddleware, ajouterCommentaire);   
router.delete('/:sujetId/commentaires/:commentaireId',      authMiddleware, supprimerCommentaire); 

module.exports = router;