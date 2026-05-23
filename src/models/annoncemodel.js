const pool = require('../config/db');

// Ajouter une annonce
const createAnnonce = async ({ titre, description, type_travail, prix, wilaya, id_user, photo }) => {
  const result = await pool.query(
    `INSERT INTO annonces (titre, description, type_travail, prix, wilaya, id_user, photo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [titre, description, type_travail, prix, wilaya, id_user, photo]
  )
  return result.rows[0]
}

// Supprimer une annonce
const deleteAnnonce = async (id_annonce, id_user) => {
  const result = await pool.query(
    `DELETE FROM annonces WHERE id_annonce=$1 AND id_user=$2 RETURNING *`,
    [id_annonce, id_user]
  );
  return result.rows[0];
};

// Modifier une annonce
const updateAnnonce = async (
  id_annonce,
  titre,
  description,
  type_travail,
  prix,
  wilaya,
  id_user
) => {
  const result = await pool.query(
    `UPDATE annonces
     SET titre=$1, description=$2, type_travail=$3, prix=$4, wilaya=$5
     WHERE id_annonce=$6 AND id_user=$7
     RETURNING *`,
    [titre, description, type_travail, prix, wilaya, id_annonce, id_user]
  );
  return result.rows[0];
};

// Lister toutes les annonces
const getAllAnnonces = async ({ wilaya, type_travail, prix_max } = {}) => {
  const conditions = ["a.statut = 'active'"]
  const values = []

  if (wilaya) {
    values.push(wilaya)
    conditions.push(`a.wilaya = $${values.length}`)
  }
  if (type_travail) {
    values.push(type_travail)
    conditions.push(`a.type_travail = $${values.length}`)
  }
  if (prix_max) {
    values.push(Number(prix_max))
    conditions.push(`a.prix <= $${values.length}`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await pool.query(
    `SELECT a.*, u.nom AS auteur
     FROM annonces a
     JOIN users u ON a.id_user = u.id_user
     ${where}
     ORDER BY a.date_publication DESC`,
    values
  )
  return result.rows
}

// Voir une seule annonce
const getAnnonceById = async (id_annonce) => {
  const result = await pool.query(
    `SELECT 
        a.*, 
        u.nom AS auteur,
        u.photo AS auteur_photo 
     FROM annonces a
     JOIN users u ON a.id_user = u.id_user
     WHERE a.id_annonce = $1`, 
    [id_annonce]
  );
  return result.rows[0];
};
const getAnnoncesByUser = async (id_user) => {
  const result = await pool.query(
    'SELECT * FROM annonces WHERE id_user=$1 ORDER BY date_publication DESC',
    [id_user]
  );
  return result.rows;
};

module.exports = {
  createAnnonce,
  deleteAnnonce,
  updateAnnonce,
  getAllAnnonces,
  getAnnonceById,
  getAnnoncesByUser
}; 