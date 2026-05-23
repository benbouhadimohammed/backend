const pool = require('../config/db');
const bcrypt = require("bcrypt");

const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );
  return result.rows[0];
};
const createUser = async (nom, email, numero, type_user, hashedPassword, otpCode, otpExpires) => {
  try {
    

    const result = await pool.query(
      "INSERT INTO users (nom, email, numero, type_user, mot_de_passe, otp_code, otp_expires) VALUES ($1, $2, $3, $4, $5, $6, $7) returning *",
      [nom, email, numero, type_user, hashedPassword, otpCode, otpExpires]
    );
    return result.rows[0];
  
    
  } catch (error) {
    console.error(" Error:", error);
  }
};



// 🔍 GET USER BY ID
const getUserById = async (id) => {
  const result = await pool.query(
    "SELECT id_user, nom, email, mot_de_passe, role, photo, numero, date_inscription FROM users WHERE id_user = $1",
    [id]
  );
  return result.rows[0];
};

// ✏️ UPDATE PROFILE
const updateUser = async (id, nom, email, numero) => {
  const result = await pool.query(
    "UPDATE users SET nom = $1, email = $2, numero = $3 WHERE id_user = $4 RETURNING id_user, nom, email, numero",
    [nom, email, numero, id]
  );
  return result.rows[0];
};
const updatePhoto = async (id, photo) => {
  const result = await pool.query(
    `UPDATE users SET photo=$1 WHERE id_user=$2
     RETURNING id_user, nom, email, photo`,
    [photo, id]
  );
  return result.rows[0];
};

// 🔐 UPDATE PASSWORD
const updatePassword = async (id, hashedPassword) => {
  await pool.query(
    "UPDATE users SET mot_de_passe = $1 WHERE id_user = $2",
    [hashedPassword, id]
  );
};

// 🗑 DELETE USER
const deleteUser = async (id) => {
  await pool.query("DELETE FROM users WHERE id_user = $1", [id]);
};


 module.exports = {  getUserById,  updatePassword, deleteUser, createUser, findUserByEmail, updateUser, updatePhoto };
  

