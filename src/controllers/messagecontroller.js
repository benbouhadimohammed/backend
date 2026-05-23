const pool = require('../config/db');
const { createNotification } = require('../models/notificationmodel');

// 1. Créer ou récupérer une conversation existante
const getOrCreateConversation = async (req, res) => {
  try {
    const { id_prestataire, id_annonce } = req.body;
    const id_client = req.user.id;

    if (Number(id_client) === Number(id_prestataire)) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous contacter vous-même' });
    }

    const existing = await pool.query(
      `SELECT * FROM conversations 
       WHERE id_client = $1 AND id_prestataire = $2 AND id_annonce = $3`,
      [id_client, id_prestataire, id_annonce]
    );

    if (existing.rows[0]) {
      return res.json(existing.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO conversations (id_client, id_prestataire, id_annonce)
       VALUES ($1, $2, $3) RETURNING *`,
      [id_client, id_prestataire, id_annonce]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Lister toutes les conversations (Sidebar)
// 2. Lister toutes les conversations (Sidebar) - CORRIGÉ
const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT DISTINCT ON (c.id_conversation) 
        c.id_conversation, c.id_client, c.id_prestataire, c.id_annonce,
        client.nom AS nom_client,
        client.photo AS photo_client,
        presta.nom AS nom_prestataire,
        presta.photo AS photo_prestataire,
        a.titre AS titre_annonce,
        m.contenu AS dernier_message,
        m.created_at AS dernier_message_at,
        COUNT(m_unread.id_message) OVER(PARTITION BY c.id_conversation) AS non_lus
      FROM conversations c
      JOIN users client ON c.id_client = client.id_user
      JOIN users presta ON c.id_prestataire = presta.id_user
      LEFT JOIN annonces a ON c.id_annonce = a.id_annonce
      LEFT JOIN messages m ON m.id_conversation = c.id_conversation
      LEFT JOIN messages m_unread ON m_unread.id_conversation = c.id_conversation 
        AND m_unread.id_sender != $1 AND m_unread.lu = FALSE
      WHERE c.id_client = $1 OR c.id_prestataire = $1
      ORDER BY c.id_conversation, m.created_at DESC NULLS LAST;
    `;

    const result = await pool.query(query, [userId]);
    
    const sortedRows = result.rows.sort((a, b) => 
      new Date(b.dernier_message_at || 0) - new Date(a.dernier_message_at || 0)
    );

    res.json(sortedRows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Récupérer l'historique des messages d'un chat
const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const convCheck = await pool.query(
      `SELECT c.*, 
              client.nom AS nom_client, 
              presta.nom AS nom_prestataire
       FROM conversations c
       JOIN users client ON c.id_client = client.id_user
       JOIN users presta ON c.id_prestataire = presta.id_user
       WHERE c.id_conversation = $1 AND (c.id_client = $2 OR c.id_prestataire = $2)`,
      [id, userId]
    );

    if (!convCheck.rows[0]) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    await pool.query(
      'UPDATE messages SET lu = TRUE WHERE id_conversation = $1 AND id_sender != $2',
      [id, userId]
    );

    const result = await pool.query(
      `SELECT m.*, u.nom AS nom_sender
       FROM messages m
       JOIN users u ON m.id_sender = u.id_user
       WHERE m.id_conversation = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    res.json({
      conversation: convCheck.rows[0],
      messages: result.rows
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Envoyer un message et le distribuer en temps réel
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params; // ID de la conversation
    const { contenu } = req.body;
    
    // 🟢 Ajuste ici selon ce que ton décodeur de Token JWT renvoie (id ou id_user)
    const userId = req.user.id_user || req.user.id; 

    if (!contenu?.trim()) {
      return res.status(400).json({ message: 'Le contenu du message ne peut pas être vide' });
    }

    // 1. Trouver la conversation
    const conv = await pool.query(
      'SELECT * FROM conversations WHERE id_conversation = $1 AND (id_client = $2 OR id_prestataire = $2)',
      [id, userId]
    );
    if (!conv.rows[0]) return res.status(403).json({ message: 'Accès refusé' });

    const conversation = conv.rows[0];

    // 2. Déterminer le destinataire
    const receiverId = Number(userId) === Number(conversation.id_client) 
      ? conversation.id_prestataire 
      : conversation.id_client;

    // 3. Insérer le message
    const result = await pool.query(
      `INSERT INTO messages (id_conversation, id_sender, contenu)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, userId, contenu]
    );

    const newMessage = result.rows[0];

    // Récupérer le nom de l'expéditeur pour la notification
    const userQuery = await pool.query('SELECT nom FROM users WHERE id_user = $1', [userId]);
    newMessage.nom_sender = userQuery.rows[0]?.nom || "Un utilisateur";

    // 4. 🟢 Envoi de la notification via ton Modèle
    try {
      await createNotification(
        receiverId, 
        'new_message', 
        `Vous avez reçu un nouveau message de ${newMessage.nom_sender}`, 
        `/messages`
      );
    } catch (notifError) {
      console.log("Erreur lors de la création de la notification (Vérifie le chemin du require) :", notifError.message);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Erreur serveur dans sendMessage :", error.message);
    res.status(500).json({ message: error.message });
  }
};

// 5. Supprimer une conversation entière (et ses messages associés)
const deleteConversation = async (req, res) => {
  try {
    const { id_conversation } = req.params;
    const userId = req.user.id; // Récupéré via ton middleware d'authentification

    // Vérification de sécurité : l'utilisateur fait-il partie de cette conversation ?
    const convCheck = await pool.query(
      `SELECT * FROM conversations 
       WHERE id_conversation = $1 AND (id_client = $2 OR id_prestataire = $2)`,
      [id_conversation, userId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(403).json({ message: "Accès refusé ou conversation introuvable." });
    }

    // Étape A : Supprimer d'abord tous les messages liés à cette conversation (contrainte clé étrangère)
    await pool.query(
      'DELETE FROM messages WHERE id_conversation = $1',
      [id_conversation]
    );

    // Étape B : Supprimer la conversation
    await pool.query(
      'DELETE FROM conversations WHERE id_conversation = $1',
      [id_conversation]
    );

    res.json({ success: true, message: "Conversation supprimée avec succès." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Supprimer un message spécifique
const deleteMessage = async (req, res) => {
  try {
    const { id_message } = req.params;
    const userId = req.user.id; // L'utilisateur connecté

    // On supprime le message SEULEMENT s'il a été envoyé par l'utilisateur connecté
    const result = await pool.query(
      `DELETE FROM messages 
       WHERE id_message = $1 AND id_sender = $2 
       RETURNING *`,
      [id_message, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Action non autorisée ou message introuvable." });
    }

    res.json({ success: true, message: "Message supprimé avec succès.", deletedMessage: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
  deleteConversation,
  deleteMessage
};