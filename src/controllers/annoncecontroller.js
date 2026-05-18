const {
  createAnnonce,
  deleteAnnonce,
  updateAnnonce, 
  getAllAnnonces,
  getAnnonceById
} = require("../models/annoncemodel");

// Ajouter une annonce
const addAnnonce = async (req, res) => {
  try {
    const { titre, description, prix, wilaya, type_travail } = req.body
    const photo = req.file ? req.file.filename : null
    const id_user = req.user.id  // ← id pas id_user

    if (!titre || !description || !prix || !wilaya || !type_travail) {
      return res.status(400).json({ message: "All fields required" })
    }

    const annonce = await createAnnonce({  // ← objet pas arguments séparés
      titre, description, type_travail, prix, wilaya, id_user, photo
    })

    res.status(201).json(annonce)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Supprimer une annonce
const removeAnnonce = async (req, res) => {
  try {
    const id_annonce = req.params.id;
    const id_user = req.user.id;

    const annonce = await deleteAnnonce(id_annonce, id_user);

    if (!annonce) {
      return res.status(404).json({ message: "Annonce not found" });
    }

    res.json({ message: "Annonce deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modifier une annonce
const editAnnonce = async (req, res) => {
  try {
    const id_annonce = req.params.id;
    const id_user = req.user.id_user;

    const { titre, description, prix, wilaya, type_travail } = req.body;

    const annonce = await updateAnnonce(
      id_annonce,
      titre,
      description,
      type_travail,
      prix,
      wilaya,
      id_user
    );

    if (!annonce) {
      return res.status(404).json({ message: "Annonce not found" });
    }

    res.json(annonce);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lister toutes les annonces
const listerAnnonces = async (req, res) => {
  try {
    const { wilaya, type_travail, prix_max } = req.query
    const annonces = await getAllAnnonces({ wilaya, type_travail, prix_max })
    res.json(annonces)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}



// Voir une seule annonce
const voirAnnonce = async (req, res) => {
  try {
    const id_annonce = req.params.id;

    const annonce = await getAnnonceById(id_annonce);

    if (!annonce) {
      return res.status(404).json({ message: "Annonce not found" });
    }

    res.json(annonce);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { addAnnonce, removeAnnonce, editAnnonce,  listerAnnonces,
  voirAnnonce };