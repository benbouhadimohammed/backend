const jwt = require("jsonwebtoken");
const pool = require("../config/db"); // 👈 FIX 2 : Ne pas oublier d'importer ton pool SQL !

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }
  
  let token;
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    token = authHeader;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "ton_jwt_secret");
    
    // Requête SQL pour intercepter le statut en temps réel
    const result = await pool.query(
      'SELECT statut FROM users WHERE id_user = $1',
      [decoded.id]
    );
    const user = result.rows[0];

    // Sécurité si l'utilisateur a été supprimé ou bloqué
    if (!user || user.statut === 'blocked') {
      return res.status(403).json({ message: 'Compte bloqué — contactez un administrateur' });
    }

    req.user = decoded; 
    next(); 
  } catch (error) {
    console.error("Erreur Auth Middleware :", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Vérification du rôle stocké dans le Token
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied (admin only)" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// 💡 FIX 1 : On exporte les deux middlewares proprement sous forme d'un objet !
module.exports = {
  authMiddleware,
  adminMiddleware
};