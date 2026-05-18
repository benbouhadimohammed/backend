const pool = require('../config/db')

// ─── STATS ────────────────────────────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const users    = await pool.query('SELECT COUNT(*) FROM users')
    const annonces = await pool.query('SELECT COUNT(*) FROM annonces')
    const posts    = await pool.query('SELECT COUNT(*) FROM forum_post')
    const actives  = await pool.query("SELECT COUNT(*) FROM annonces WHERE statut = 'active'")
    const blocked  = await pool.query("SELECT COUNT(*) FROM users WHERE statut = 'blocked'")

    res.json({
      users:    parseInt(users.rows[0].count),
      annonces: parseInt(annonces.rows[0].count),
      posts:    parseInt(posts.rows[0].count),
      actives:  parseInt(actives.rows[0].count),
      blocked:  parseInt(blocked.rows[0].count),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Annonces par mois (6 derniers mois)
const getAnnoncesByMonth = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(date_publication, 'Mon YYYY') AS mois,
        COUNT(*) AS total
      FROM annonces
      WHERE date_publication >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(date_publication, 'Mon YYYY'), DATE_TRUNC('month', date_publication)
      ORDER BY DATE_TRUNC('month', date_publication)
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Annonces par wilaya
const getAnnoncesByWilaya = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT wilaya, COUNT(*) AS total
      FROM annonces
      GROUP BY wilaya
      ORDER BY total DESC
      LIMIT 10
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Annonces par type
const getAnnoncesByType = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT type_travail, COUNT(*) AS total
      FROM annonces
      GROUP BY type_travail
      ORDER BY total DESC
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Users inscrits par mois
const getUsersByMonth = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(date_inscription, 'Mon YYYY') AS mois,
        COUNT(*) AS total
      FROM users
      WHERE date_inscription >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(date_inscription, 'Mon YYYY'), DATE_TRUNC('month', date_inscription)
      ORDER BY DATE_TRUNC('month', date_inscription)
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─── USERS ────────────────────────────────────────────────────────────────────

const getAllUsers = async (req, res) => {
  try {
    const { search, role, type_user, statut } = req.query

    const conditions = []
    const values = []

    if (search) {
      values.push(`%${search}%`)
      conditions.push(`(nom ILIKE $${values.length} OR email ILIKE $${values.length})`)
    }
    if (role) {
      values.push(role)
      conditions.push(`rolee = $${values.length}`)
    }
    if (type_user) {
      values.push(type_user)
      conditions.push(`type_user = $${values.length}`)
    }
    if (statut) {
      values.push(statut)
      conditions.push(`statut = $${values.length}`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT id_user, nom, email, role, type_user, statut, date_inscription
       FROM users ${where}
       ORDER BY date_inscription DESC`,
      values
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Détail user + ses annonces + ses posts
const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const user = await pool.query(
      'SELECT id_user, nom, email, role, type_user, statut, date_inscription FROM users WHERE id_user = $1',
      [id]
    )
    if (!user.rows[0]) return res.status(404).json({ message: 'User not found' })

    const annonces = await pool.query(
      'SELECT id_annonces, titre, type_travail, wilaya, prix, statut, date_publication FROM annonces WHERE id_user = $1 ORDER BY date_publication DESC',
      [id]
    )
    const posts = await pool.query(
      'SELECT id_forum, titre, contenu, date_creation FROM forum_post WHERE id_user = $1 ORDER BY date_creation DESC',
      [id]
    )

    res.json({
      user: user.rows[0],
      annonces: annonces.rows,
      posts: posts.rows,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM users WHERE id_user = $1', [id])
    res.json({ message: 'User deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Changer le rôle (user/admin)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide — user ou admin' })
    }

    const result = await pool.query(
      'UPDATE users SET rolee = $1 WHERE id_user = $2 RETURNING id_user, nom, email, role',
      [role, id]
    )
    res.json({ message: 'Rôle mis à jour', user: result.rows[0] })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Changer le type (client/prestataire)
const updateUserType = async (req, res) => {
  try {
    const { id } = req.params
    const { type_user } = req.body

    if (!['client', 'prestataire'].includes(type_user)) {
      return res.status(400).json({ message: 'Type invalide — client ou prestataire' })
    }

    const result = await pool.query(
      'UPDATE users SET type_user = $1 WHERE id_user = $2 RETURNING id_user, nom, email, type_user',
      [type_user, id]
    )
    res.json({ message: 'Type mis à jour', user: result.rows[0] })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Bloquer / débloquer un user
const toggleUserStatut = async (req, res) => {
  try {
    const { id } = req.params

    const user = await pool.query('SELECT statut FROM users WHERE id_user = $1', [id])
    if (!user.rows[0]) return res.status(404).json({ message: 'User not found' })

    const newStatut = user.rows[0].statut === 'blocked' ? 'active' : 'blocked'

    const result = await pool.query(
      'UPDATE users SET statut = $1 WHERE id_user = $2 RETURNING id_user, nom, statut',
      [newStatut, id]
    )
    res.json({ message: `Compte ${newStatut === 'blocked' ? 'bloqué' : 'débloqué'}`, user: result.rows[0] })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─── ANNONCES ─────────────────────────────────────────────────────────────────

const getAllAnnonces = async (req, res) => {
  try {
    const { search, wilaya, type_travail, statut } = req.query

    const conditions = []  // ← ajoute ça
  const values = []

    if (search) {
      values.push(`%${search}%`)
      conditions.push(`a.titre ILIKE $${values.length}`)
    }
    if (wilaya) {
      values.push(wilaya)
      conditions.push(`a.wilaya = $${values.length}`)
    }
    if (type_travail) {
      values.push(type_travail)
      conditions.push(`a.type_travail = $${values.length}`)
    }
    if (statut) {
      values.push(statut)
      conditions.push(`a.statut = $${values.length}`)
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
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deleteAnnonce = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM annonces WHERE id_annonce = $1', [id])
    res.json({ message: 'Annonce deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Activer / désactiver une annonce
const toggleAnnonceStatut = async (req, res) => {
  try {
    const { id } = req.params

    const annonce = await pool.query('SELECT statut FROM annonces WHERE id_annonce = $1', [id])
    if (!annonce.rows[0]) return res.status(404).json({ message: 'Annonce not found' })

    const newStatut = annonce.rows[0].statut === 'active' ? 'inactive' : 'active'

    const result = await pool.query(
      'UPDATE annonces SET statut = $1 WHERE id_annonce = $2 RETURNING id_annonce, titre, statut',
      [newStatut, id]
    )
    res.json({ message: `Annonce ${newStatut}`, annonce: result.rows[0] })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


// Approuver ou rejeter une annonce
const updateAnnonceStatut = async (req, res) => {
  try {
    const { id } = req.params
    const { statut } = req.body  // 'active' ou 'rejected'

    if (!['active', 'rejected', 'pending'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' })
    }

    const result = await pool.query(
      `UPDATE annonces SET statut = $1 
       WHERE id_annonce = $2 
       RETURNING id_annonce, titre, statut`,
      [statut, id]
    )

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'Annonce not found' })
    }

    res.json({
      message: statut === 'active' ? 'Annonce approuvée' : 'Annonce rejetée',
      annonce: result.rows[0]
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─── FORUM ────────────────────────────────────────────────────────────────────

const getAllPosts = async (req, res) => {
  try {
    const { search } = req.query

    const conditions = []
    const values = []

    if (search) {
      values.push(`%${search}%`)
      conditions.push(`(f.titre ILIKE $${values.length} OR f.contenu ILIKE $${values.length})`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT f.*, u.nom AS auteur,
        (SELECT COUNT(*) FROM forum_commentaires r WHERE r.id_commentaire = f.id_forum) AS nb_replies
       FROM forum_post f
       JOIN users u ON f.id_user = u.id_user
       ${where}
       ORDER BY f.date_creation DESC`,
      values
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const deletePost = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM forum_post WHERE id_forum = $1', [id])
    res.json({ message: 'Post deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Supprimer une réponse
const deleteReply = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM forum_commentaires WHERE id_commentaire = $1', [id])
    res.json({ message: 'Reply deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────

const exportUsersCSV = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_user, nom, email, role, type_user, statut, date_inscription FROM users ORDER BY date_inscription DESC'
    )

    const header = 'ID,Nom,Email,Role,Type,Statut,Date inscription\n'
    const rows = result.rows.map(u =>
      `${u.id_user},"${u.nom}","${u.email}","${u.rolee}","${u.type_user}","${u.statut}","${new Date(u.date_inscription).toLocaleDateString('fr-FR')}"`
    ).join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv')
    res.send(header + rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const exportAnnoncesCSV = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id_annonce, a.titre, a.type_travail, a.wilaya, a.prix, a.statut, a.date_publication, u.nom AS auteur
       FROM annonces a JOIN users u ON a.id_user = u.id_user
       ORDER BY a.date_publication DESC`
    )

    const header = 'ID,Titre,Type,Wilaya,Prix,Statut,Date,Auteur\n'
    const rows = result.rows.map(a =>
      `${a.id_annonces},"${a.titre}","${a.type_travail}","${a.wilaya}",${a.prix},"${a.statut}","${new Date(a.date_publication).toLocaleDateString('fr-FR')}","${a.auteur}"`
    ).join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=annonces.csv')
    res.send(header + rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
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
}