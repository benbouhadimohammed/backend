const router = require('express').Router()
const {authMiddleware} = require('../middleware/authmiddleware')
const {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
  deleteConversation,
  deleteMessage
} = require('../controllers/messagecontroller')

router.post('/conversations',          authMiddleware, getOrCreateConversation)
router.get('/conversations',           authMiddleware, getMyConversations)
router.get('/conversations/:id/messages', authMiddleware, getMessages)
router.post('/conversations/:id/messages', authMiddleware, sendMessage)
router.delete('/conversation/:id_conversation', authMiddleware, deleteConversation);
router.delete('/message/:id_message', authMiddleware, deleteMessage);

module.exports = router