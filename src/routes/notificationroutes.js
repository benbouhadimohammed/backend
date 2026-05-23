const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authmiddleware');
const { getNotifications, markAllAsRead, createNotification } = require('../models/notificationmodel');

// GET /api/notifications — récupérer ses notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifs = await getNotifications(req.user.id);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/read — marquer toutes comme lues
router.put('/read', authMiddleware, async (req, res) => {
  try {
    await markAllAsRead(req.user.id_user);
    res.json({ message: 'Notifications marquées comme lues' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notifications — créer une notif manuellement (usage interne/admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { id_user, type, message, lien } = req.body;
    if (!id_user || !type || !message) {
      return res.status(400).json({ message: 'id_user, type et message requis' });
    }
    const notif = await createNotification(id_user, type, message, lien || null);
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
