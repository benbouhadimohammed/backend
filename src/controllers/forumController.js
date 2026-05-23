'use strict';

const pool = require('../config/db');
const {
  createSujetDb,
  getAllSujetsDb,
  searchSujetsDb,
  getSujetByIdDb,
  closeSujetDb,
  deleteSujetDb,
  addCommentaireDb,
  getCommentairesByPostDb,
  getCommentaireByIdDb,
  softDeleteCommentaireDb,
} = require('../models/forumModel');

const { createNotification } = require('../models/notificationmodel');


// ── Helpers ──────────────────────────────────────────────────

function parseId(valeur) {
  const id = parseInt(valeur, 10);
  if (isNaN(id)) throw new Error('Identifiant invalide.');
  return id;
}

function erreurStatut(message) {
  if (message.includes('introuvable'))                              return 404;
  if (message.includes('autorisé') || message.includes('admin'))   return 403;
  if (message.includes('déjà') || message.includes('fermé') ||
      message.includes('obligatoire') || message.includes('vide')) return 400;
  return 500;
}

function validerTexte(valeur, nom) {
  if (!valeur || typeof valeur !== 'string' || valeur.trim() === '') {
    throw new Error(`${nom} est obligatoire et ne peut pas être vide.`);
  }
}

function estAdmin(demandeur) {
  return demandeur != null && demandeur.role === 'admin';
}

async function getUserId(email) {
  const result = await pool.query('SELECT id_user FROM users WHERE email = $1', [email]);
  if (!result.rows[0]) throw new Error('Utilisateur introuvable.');
  return result.rows[0].id_user;
}

async function obtenirSujetOuErreur(sujetId) {
  const sujet = await getSujetByIdDb(sujetId);
  if (!sujet) throw new Error(`Sujet ${sujetId} introuvable.`);
  return sujet;
}

// ── Sujets ───────────────────────────────────────────────────

const creerSujet = async (req, res) => {
  try {
    const { titre, contenu } = req.body;
    
    // 1. Tes validations existantes
    validerTexte(titre, 'titre');
    validerTexte(contenu, 'contenu');
    
    // 2. Récupérer le nom du fichier généré par ton Multer s'il existe
    const photo = req.file ? req.file.filename : null; 
    
    const id_user = await getUserId(req.user.email);
    
    // 3. On passe la variable "photo" en 4ème argument à ta fonction BDD
    const sujet = await createSujetDb(titre.trim(), contenu.trim(), id_user, photo);
    
    res.status(201).json(sujet);
  } catch (error) {
    res.status(erreurStatut(error.message)).json({ message: error.message });
  }
};

const listerSujets = async (req, res) => {
  try {
    const ouvertsUniquement = req.query.ouverts === 'true';
    const sujets = await getAllSujetsDb(ouvertsUniquement);
    res.status(200).json(sujets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rechercherSujets = async (req, res) => {
  try {
    const motCle = req.query.q;
    const sujets = (!motCle || motCle.trim() === '')
      ? await getAllSujetsDb()
      : await searchSujetsDb(motCle.trim());
    res.status(200).json(sujets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const obtenirSujet = async (req, res) => {
  try {
    const sujet = await obtenirSujetOuErreur(parseId(req.params.id));
    const commentaires = await getCommentairesByPostDb(sujet.id_forum);
    res.status(200).json({ sujet, commentaires });
  } catch (error) {
    res.status(erreurStatut(error.message)).json({ message: error.message });
  }
};

const fermerSujet = async (req, res) => {
  try {
    if (!estAdmin(req.user)) throw new Error('Seul un admin peut fermer un sujet.');
    await obtenirSujetOuErreur(parseId(req.params.id));
    const sujet = await closeSujetDb(parseId(req.params.id));
    if (!sujet) throw new Error('Ce sujet est déjà fermé.');
    res.status(200).json(sujet);
  } catch (error) {
    res.status(erreurStatut(error.message)).json({ message: error.message });
  }
};

const supprimerSujet = async (req, res) => {
  try {
    if (!estAdmin(req.user)) throw new Error('Seul un admin peut supprimer un sujet.');
    await obtenirSujetOuErreur(parseId(req.params.id));
    await deleteSujetDb(parseId(req.params.id));
    res.status(204).send();
  } catch (error) {
    res.status(erreurStatut(error.message)).json({ message: error.message });
  }
};

// ── Commentaires ─────────────────────────────────────────────

const ajouterCommentaire = async (req, res) => {
  try {
    validerTexte(req.body.contenu, 'contenu');
    const sujet = await obtenirSujetOuErreur(parseId(req.params.id));
    if (sujet.est_ferme) throw new Error("Impossible d'ajouter un commentaire : le sujet est fermé.");
    const id_user = await getUserId(req.user.email);
    const commentaire = await addCommentaireDb(sujet.id_forum, req.body.contenu.trim(), id_user);
    if (sujet.id_user && sujet.id_user !== id_user) {
      await createNotification(
        sujet.id_user, 
        'forum_comment', // Le type pour ton switch-case frontend
        `Quelqu'un a répondu à votre sujet : "${sujet.titre}"`, // Message textuel
        `/forum${sujet.id_forum}` // Lien de redirection dynamique
      );
    }
    res.status(201).json(commentaire);
  } catch (error) {
    res.status(erreurStatut(error.message)).json({ message: error.message });
  }
};

const supprimerCommentaire = async (req, res) => {
  try {
    await obtenirSujetOuErreur(parseId(req.params.sujetId));
    const commentaire = await getCommentaireByIdDb(parseId(req.params.commentaireId));
    if (!commentaire) throw new Error(`Commentaire ${req.params.commentaireId} introuvable.`);
    if (commentaire.id_post !== parseId(req.params.sujetId)) {
      throw new Error("Ce commentaire n'appartient pas à ce sujet.");
    }
    const id_user = await getUserId(req.user.email);
    if (id_user !== commentaire.id_user && !estAdmin(req.user)) {
      throw new Error("Vous n'êtes pas autorisé à supprimer ce commentaire.");
    }
    const result = await softDeleteCommentaireDb(parseId(req.params.commentaireId));
    if (!result) throw new Error('Ce commentaire est déjà supprimé.');
    res.status(204).send();
  } catch (error) {
    res.status(erreurStatut(error.message)).json({ message: error.message });
  }
};




module.exports = {
  creerSujet,
  listerSujets,
  rechercherSujets,
  obtenirSujet,
  fermerSujet,
  supprimerSujet,
  ajouterCommentaire,
  supprimerCommentaire,
};