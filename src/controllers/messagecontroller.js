const pool = require('../config/db')

// Créer ou récupérer une conversation
const getOrCreateConversation = async (req, res) => {
  try {
    const { id_prestataire, id_annonce } = req.body
    const id_client = req.user.id

    if (id_client === id_prestataire) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous contacter vous-même' })
    }

    // Vérifier si la conversation existe déjà
    const existing = await pool.query(
      `SELECT * FROM conversations 
       WHERE id_client = $1 AND id_prestataire = $2 AND id_annonce = $3`,
      [id_client, id_prestataire, id_annonce]
    )

    if (existing.rows[0]) {
      return res.json(existing.rows[0])
    }

    // Créer une nouvelle conversation
    const result = await pool.query(
      `INSERT INTO conversations (id_client, id_prestataire, id_annonce)
       VALUES ($1, $2, $3) RETURNING *`,
      [id_client, id_prestataire, id_annonce]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Mes conversations
const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT c.*,
        client.nom AS nom_client,
        presta.nom AS nom_prestataire,
        a.titre AS titre_annonce,
        (SELECT contenu FROM messages m WHERE m.id_conversation = c.id_conversation ORDER BY m.created_at DESC LIMIT 1) AS dernier_message,
        (SELECT created_at FROM messages m WHERE m.id_conversation = c.id_conversation ORDER BY m.created_at DESC LIMIT 1) AS dernier_message_at,
        (SELECT COUNT(*) FROM messages m WHERE m.id_conversation = c.id_conversation AND m.id_sender != $1 AND m.lu = FALSE) AS non_lus
       FROM conversations c
       JOIN users client ON c.id_client = client.id_user
       JOIN users presta ON c.id_prestataire = presta.id_user
       LEFT JOIN annonces a ON c.id_annonce = a.id_annonce
       WHERE c.id_client = $1 OR c.id_prestataire = $1
       ORDER BY dernier_message_at DESC NULLS LAST`,
      [userId]
    )

    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Messages d'une conversation
const getMessages = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Vérifier que l'user fait partie de la conversation
    const conv = await pool.query(
      'SELECT * FROM conversations WHERE id_conversation = $1 AND (id_client = $2 OR id_prestataire = $2)',
      [id, userId]
    )
    if (!conv.rows[0]) return res.status(403).json({ message: 'Accès refusé' })

    // Marquer les messages comme lus
    await pool.query(
      'UPDATE messages SET lu = TRUE WHERE id_conversation = $1 AND id_sender != $2',
      [id, userId]
    )

    const result = await pool.query(
      `SELECT m.*, u.nom AS nom_sender
       FROM messages m
       JOIN users u ON m.id_sender = u.id_user
       WHERE m.id_conversation = $1
       ORDER BY m.created_at ASC`,
      [id]
    )

    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Envoyer un message
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params
    const { contenu } = req.body
    const userId = req.user.id

    if (!contenu?.trim()) {
      return res.status(400).json({ message: 'Message vide' })
    }

    // Vérifier que l'user fait partie de la conversation
    const conv = await pool.query(
      'SELECT * FROM conversations WHERE id_conversation = $1 AND (id_client = $2 OR id_prestataire = $2)',
      [id, userId]
    )
    if (!conv.rows[0]) return res.status(403).json({ message: 'Accès refusé' })

    const result = await pool.query(
      `INSERT INTO messages (id_conversation, id_sender, contenu)
       VALUES ($1, $2, $3)
       RETURNING *, (SELECT nom FROM users WHERE id_user = $2) AS nom_sender`,
      [id, userId, contenu.trim()]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = { getOrCreateConversation, getMyConversations, getMessages, sendMessage }