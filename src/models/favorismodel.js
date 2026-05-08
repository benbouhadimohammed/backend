const pool = require('../config/db');

const addFavori = async (id_user, id_annonce) => {
    console.log(`Tentative d'ajout - User: ${id_user}, Annonce: ${id_annonce}`);
  await pool.query(
    "INSERT INTO favoris (id_user, id_annonce) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    [id_user, id_annonce]
  );
};

const getFavoris = async (id_user) => {
  const result = await pool.query(
    `SELECT a.* FROM favoris f
     JOIN annonces a ON f.id_annonce = a.id_annonce
     WHERE f.id_user = $1`,
    [id_user]
  );
  return result.rows;
};

const removeFavori = async (id_user, id_annonce) => {
    console.log(`Tentative de suppression - User: ${id_user}, Annonce: ${id_annonce}`);
  await pool.query(
    "DELETE FROM favoris WHERE id_user = $1 AND id_annonce = $2",
    [id_user, id_annonce]
  );
};
module.exports = { addFavori, getFavoris, removeFavori };