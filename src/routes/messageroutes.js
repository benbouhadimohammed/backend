const router = require('express').Router()
const {authMiddleware} = require('../middleware/authmiddleware')
const {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} = require('../controllers/messagecontroller')

router.post('/conversations',          authMiddleware, getOrCreateConversation)
router.get('/conversations',           authMiddleware, getMyConversations)
router.get('/conversations/:id/messages', authMiddleware, getMessages)
router.post('/conversations/:id/messages', authMiddleware, sendMessage)

module.exports = router