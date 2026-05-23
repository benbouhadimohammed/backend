const bcrypt = require("bcrypt");
const pool = require('../config/db');
const {
  getUserById,
  updateUser,
  updatePassword,
  updatePhoto,
  deleteUser,
} = require("../models/usermodel");
const { getAnnoncesByUser, deleteAnnonce } = require('../models/annoncemodel');
const { getSujetByIdDb,getPostByUser, deleteSujetDb } = require('../models/forumModel');
const { getFavoris, addFavori, removeFavori } = require('../models/favorismodel');
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const userModel = require("../models/usermodel");
const path = require('path'); 
const fs = require('fs');

// 👤 GET PROFILE
const getProfile = async (req, res) => {
  try {
    // Dynamique : prend l'un ou l'au-delà s'il est présent
    const userId = req.user.id || req.user.id_user; 
    if (!userId) return res.status(401).json({ error: "Identifiant utilisateur introuvable dans le token" });

    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPrestataireProfil = async (req, res) => {
  try {
    const { id } = req.params

    const user = await pool.query(
      `SELECT id_user, nom, type_user, date_inscription, photo, email, numero
       FROM users 
       WHERE id_user = $1 AND type_user = 'prestataire'`,
      [id]
    )

    if (!user.rows[0]) {
      return res.status(404).json({ message: 'Prestataire introuvable' })
    }

    const annonces = await pool.query(
      `SELECT id_annonce, titre, type_travail, wilaya, prix, photo, date_publication
       FROM annonces
       WHERE id_user = $1 AND statut = 'active'
       ORDER BY date_publication DESC`,
      [id]
    )

    res.json({
      prestataire: user.rows[0],
      annonces: annonces.rows,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const updateProfile = async (req, res) => {
  try {
    const { nom, email, numero } = req.body;
    const userId = req.user.id || req.user.id_user; 
     
    const user = await updateUser(userId, nom, email, numero);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucune image fournie' });

    const userId = req.user.id || req.user.id_user; 

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (user.photo) {
      const oldPath = path.join(__dirname, '../../uploads', path.basename(user.photo));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    const updated = await updatePhoto(userId, photoUrl);
    
    res.json({ message: 'Photo mise à jour', photo: updated.photo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id || req.user.id_user; 

    const user = await getUserById(userId);
    const isMatch = await bcrypt.compare(oldPassword, user.mot_de_passe);

    if (!isMatch) {
      return res.status(400).json({ message: "Ancien mot de passe incorrect" });
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters, include uppercase, lowercase and a number",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updatePassword(userId, hashedPassword);

    res.json({ message: "Mot de passe mis à jour" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMesAnnonces = async (req, res) => {
  try {
    const userId = req.user.id || req.user.id_user; 
    const annonces = await getAnnoncesByUser(userId);
    res.json(annonces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const supprimerMonAnnonce = async (req, res) => {
  try {
    const userId = req.user.id || req.user.id_user; 
    const annonce = await deleteAnnonce(req.params.id, userId);
    if (!annonce) return res.status(404).json({ message: 'Annonce introuvable ou non autorisée' });
    res.json({ message: 'Annonce supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMesPosts = async (req, res) => {
  try {
    const userId = req.user.id || req.user.id_user; 
    const posts = await getPostByUser(userId);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const supprimerMonPost = async (req, res) => {
  try {
    const userId = req.user.id || req.user.id_user; 
    const post = await deleteSujetDb(parseInt(req.params.id), userId);
    if (!post) return res.status(404).json({ message: 'Post introuvable ou non autorisé' });
    res.json({ message: 'Post supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMesFavoris = async (req, res) => {
  try {
    const userId = req.user.id || req.user.id_user; 
    const favoris = await getFavoris(userId);
    res.json(favoris);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const ajouterFavori = async (req, res) => {
  try {
    const { id_annonce } = req.body;
    const userId = req.user.id || req.user.id_user; 
    if (!id_annonce) return res.status(400).json({ message: 'id_annonce requis' });
    
    const favori = await addFavori(userId, id_annonce);
    res.status(201).json(favori);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Annonce déjà en favoris' });
    res.status(500).json({ message: err.message });
  }
};

const supprimerFavori = async (req, res) => {
  try {
    const userId = req.user.id || req.user.id_user; 
    const favori = await removeFavori(req.params.id, userId);
    if (!favori) return res.status(404).json({ message: 'Favori introuvable' });
    res.json({ message: 'Favori retiré' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id || req.user.id_user; 
    await deleteUser(userId);
    res.json({ message: "Compte supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getMesAnnonces,
  supprimerMonAnnonce,
  getMesPosts,    
  supprimerMonPost,
  getMesFavoris,
  ajouterFavori,
  supprimerFavori,
  getPrestataireProfil,
  uploadPhoto,
};