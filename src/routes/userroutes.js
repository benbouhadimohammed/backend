const express = require("express");
const router = express.Router();

const {authMiddleware} = require("../middleware/authmiddleware");

const {
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
 
  uploadPhoto,
} = require("../controllers/usercontroller");
const upload = require('../middleware/upload')


// 👤 PROFILE
router.get("/profile", authMiddleware, getProfile);

// ✏️ UPDATE PROFILE
router.put("/profile", authMiddleware, updateProfile);

// 🔐 CHANGE PASSWORD
router.put("/profile/password", authMiddleware, changePassword);

// 🗑 DELETE ACCOUNT
router.delete("/profile", authMiddleware, deleteAccount);
router.post('/profile/upload-photo',      authMiddleware, upload.single('photo'), uploadPhoto);
router.put('/profile/password',           authMiddleware, changePassword);

router.get('/profile/annonces',           authMiddleware, getMesAnnonces);
router.delete('/profile/annonces/:id',    authMiddleware, supprimerMonAnnonce);

router.get('/profile/posts',              authMiddleware, getMesPosts);
router.delete('/profile/posts/:id',       authMiddleware, supprimerMonPost);

router.get('/profile/favoris',            authMiddleware, getMesFavoris);
router.post('/profile/favoris',           authMiddleware, ajouterFavori);
router.delete('/profile/favoris/:id',     authMiddleware, supprimerFavori);


module.exports = router;