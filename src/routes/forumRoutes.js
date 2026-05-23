'use strict';
const express       = require('express');
const router        = express.Router();
const { authMiddleware } = require('../middleware/authmiddleware');
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
const upload = require('../middleware/upload')



// ── Sujets ────────────────────────────────────────────────────
router.get('/',             listerSujets);
router.get('/recherche',    rechercherSujets);
router.get('/:id',          obtenirSujet);

router.patch('/:id/fermer', authMiddleware, fermerSujet);
router.delete('/:id',       authMiddleware, supprimerSujet);
router.post('/', authMiddleware, upload.single('photo'), creerSujet);

// ── Commentaires ─────────────────────────────────────────────
router.post('/:id/commentaires',                          authMiddleware, ajouterCommentaire);   
router.delete('/:sujetId/commentaires/:commentaireId',      authMiddleware, supprimerCommentaire); 

module.exports = router;