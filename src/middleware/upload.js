const multer = require('multer')
const path = require('path')
 // 👈 AJOUTE CETTE LIGNE TOUT EN HAUT
const fs = require('fs');

// Où stocker + comment nommer les fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')  // dossier à la racine du backend
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)  // .jpg .png .webp
    cb(null, unique + ext)  // ex: 1714823456-123456789.jpg
  },
})

// Accepter seulement les images
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Format non supporté — jpeg, png, webp seulement'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },  // max 5MB
})

module.exports = upload