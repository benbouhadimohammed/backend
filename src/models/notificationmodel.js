const pool = require('../config/db');

const getNotifications = async (id_user) => {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE id_user=$1 ORDER BY date_creation DESC`,
    [id_user]
  );
  return result.rows;
};

const markAllAsRead = async (id_user) => {
  await pool.query(`UPDATE notifications SET lu=TRUE WHERE id_user=$1`, [id_user]);
};

const createNotification = async (id_user, type, message, lien = null) => {
  const result = await pool.query(
    `INSERT INTO notifications (id_user, type, message, lien) VALUES ($1, $2, $3, $4) RETURNING *`,
    [id_user, type, message, lien]
  );
  return result.rows[0];
};

module.exports = { getNotifications, markAllAsRead, createNotification };
