'use strict';

const pool = require('../config/db');

// ============================================================
//  Sujets
// ============================================================

async function createSujetDb(titre, contenu, id_user) {
  const result = await pool.query(
    `INSERT INTO forum_post (titre, contenu, id_user)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [titre, contenu, id_user]
  );
  return result.rows[0];
}

async function getAllSujetsDb(ouvertsUniquement = false) {
  const sql = ouvertsUniquement
    ? `SELECT * FROM forum_post WHERE est_ferme = FALSE ORDER BY date_creation DESC`
    : `SELECT * FROM forum_post ORDER BY date_creation DESC`;
  const result = await pool.query(sql);
  return result.rows;
}

async function searchSujetsDb(motCle) {
  const result = await pool.query(
    `SELECT * FROM forum_post WHERE titre ILIKE $1 ORDER BY date_creation DESC`,
    [`%${motCle}%`]
  );
  return result.rows;
}

async function getSujetByIdDb(id) {
  const result = await pool.query(
    `SELECT * FROM forum_post WHERE id_forum = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

async function closeSujetDb(id) {
  const result = await pool.query(
    `UPDATE forum_post
     SET est_ferme = TRUE
     WHERE id_forum = $1 AND est_ferme = FALSE
     RETURNING *`,
    [id]
  );
  return result.rows[0] ?? null;
}

async function deleteSujetDb(id) {
  await pool.query(`DELETE FROM forum_post WHERE id_forum = $1`, [id]);
}

// ============================================================
//  Commentaires
// ============================================================

async function addCommentaireDb(id_post, contenu, id_user) {
  const result = await pool.query(
    `INSERT INTO forum_commentaires (id_post, contenu, id_user)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id_post, contenu, id_user]
  );
  return result.rows[0];
}

async function getCommentairesByPostDb(id_post) {
  const result = await pool.query(
    `SELECT * FROM forum_commentaires
     WHERE id_post = $1
     ORDER BY date_publication ASC`,
    [id_post]
  );
  return result.rows;
}

async function getCommentaireByIdDb(id) {
  const result = await pool.query(
    `SELECT * FROM forum_commentaires WHERE id_commentaire = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

async function softDeleteCommentaireDb(id) {
  const result = await pool.query(
    `UPDATE forum_commentaires
     SET est_supprime = TRUE,
         contenu      = '[commentaire supprimé]'
     WHERE id_commentaire = $1 AND est_supprime = FALSE
     RETURNING *`,
    [id]
  );
  return result.rows[0] ?? null;
}

module.exports = {
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
};