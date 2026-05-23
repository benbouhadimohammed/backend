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
   
    const user = await getUserById(req.user.id);
   
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Upload photo de profil


// Récupérer photo profil par id



const getPrestataireProfil = async (req, res) => {
  try {
    const { id } = req.params

    // Infos du prestataire
    const user = await pool.query(
      `SELECT id_user, nom,  type_user, date_inscription, photo, email, numero
       FROM users 
       WHERE id_user = $1 AND type_user = 'prestataire'`,
      [id]
    )

    if (!user.rows[0]) {
      return res.status(404).json({ message: 'Prestataire introuvable' })
    }

    // Ses annonces actives
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
     
    const user = await updateUser(req.user.id, nom, email, numero);

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucune image fournie' });


    const userId = req.user.id; 

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
    
    
   
    
    res.json({ message: 'Photo mise à jour',photo: updated.photo});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await getUserById(req.user.id);
    

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

    await updatePassword(req.user.id, hashedPassword);

    res.json({ message: "Mot de passe mis à jour" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getMesAnnonces = async (req, res) => {
  try {
    console.log(req.user);
    const annonces = await getAnnoncesByUser(req.user.id);
    res.json(annonces);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /profile/annonces/:id
const supprimerMonAnnonce = async (req, res) => {
  try {
    const annonce = await deleteAnnonce(req.params.id, req.user.id_user);
    if (!annonce) return res.status(404).json({ message: 'Annonce introuvable ou non autorisée' });
    res.json({ message: 'Annonce supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /profile/posts
const getMesPosts = async (req, res) => {
  try {
    const posts = await getPostByUser(req.user.id);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /profile/posts/:id
const supprimerMonPost = async (req, res) => {
  try {
    const post = await deleteSujetDb(parseInt(req.params.id), req.user.id);
    if (!post) return res.status(404).json({ message: 'Post introuvable ou non autorisé' });
    res.json({ message: 'Post supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /profile/favoris
const getMesFavoris = async (req, res) => {
  try {
    const favoris = await getFavoris(req.user.id_user);
    res.json(favoris);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /profile/favoris
const ajouterFavori = async (req, res) => {
  try {
    const { id_annonce } = req.body;
    if (!id_annonce) return res.status(400).json({ message: 'id_annonce requis' });
    const favori = await addFavori(req.user.id_user, id_annonce);
    res.status(201).json(favori);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Annonce déjà en favoris' });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /profile/favoris/:id
const supprimerFavori = async (req, res) => {
  try {
    const favori = await removeFavori(req.params.id, req.user.id_user);
    if (!favori) return res.status(404).json({ message: 'Favori introuvable' });
    res.json({ message: 'Favori retiré' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const deleteAccount = async (req, res) => {
  try {
    await deleteUser(req.user.id);
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