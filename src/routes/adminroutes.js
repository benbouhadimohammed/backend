const express = require("express");
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authmiddleware');
const {
  // Stats
  getStats,
  getAnnoncesByMonth,
  getAnnoncesByWilaya,
  getAnnoncesByType,
  getUsersByMonth,
  // Users
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserRole,
  updateUserType,
  toggleUserStatut,
  // Annonces
  getAllAnnonces,
  deleteAnnonce,
  toggleAnnonceStatut,
  updateAnnonceStatut,
  // Forum
  getAllPosts,
  deletePost,
  deleteReply,
  // Export
  exportUsersCSV,
  exportAnnoncesCSV,
} = require('../controllers/admincontroller')
const protect = [authMiddleware, adminMiddleware]



router.get('/stats',                  ...protect, getStats)
router.get('/stats/annonces/month',   ...protect, getAnnoncesByMonth)
router.get('/stats/annonces/wilaya',  ...protect, getAnnoncesByWilaya)
router.get('/stats/annonces/type',    ...protect, getAnnoncesByType)
router.get('/stats/users/month',      ...protect, getUsersByMonth)
 
// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users',                  ...protect, getAllUsers)
router.get('/users/:id',              ...protect, getUserById)
router.delete('/users/:id',           ...protect, deleteUser)
router.patch('/users/:id/role',       ...protect, updateUserRole)
router.patch('/users/:id/type',       ...protect, updateUserType)
router.patch('/users/:id/toggle',     ...protect, toggleUserStatut)
 
// ─── Annonces ─────────────────────────────────────────────────────────────────
router.get('/annonces',               ...protect, getAllAnnonces)
router.delete('/annonces/:id',        ...protect, deleteAnnonce)
router.patch('/annonces/:id/toggle',  ...protect, toggleAnnonceStatut)
router.patch('/annonces/:id/statut', ...protect, updateAnnonceStatut)
 
// ─── Forum ────────────────────────────────────────────────────────────────────
router.get('/forum',                  ...protect, getAllPosts)
router.delete('/forum/:id',           ...protect, deletePost)
router.delete('/forum/reply/:id',     ...protect, deleteReply)
 
// ─── Export CSV ───────────────────────────────────────────────────────────────
router.get('/export/users',           ...protect, exportUsersCSV)
router.get('/export/annonces',        ...protect, exportAnnoncesCSV)
 
module.exports = router