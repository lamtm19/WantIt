const express = require('express')
const { body } = require('express-validator')
const router  = express.Router()
const ctrl    = require('../controllers/conversationController')
const { requireAuth } = require('../middleware/auth')
const { validate }    = require('../middleware/validate')

// Mes conversations
router.get('/', requireAuth, ctrl.getConversations)

// Détail d'une conversation
router.get('/:id', requireAuth, ctrl.getConversation)

// Initier une conversation (vendeur → acheteur)
router.post('/',
  requireAuth,
  [
    body('listing_id').isUUID(),
    body('initial_message').isLength({ min: 1, max: 2000 }).trim()
  ],
  validate,
  ctrl.createConversation
)

// Messages d'une conversation
router.get('/:id/messages', requireAuth, ctrl.getMessages)

// Envoyer un message
router.post('/:id/messages',
  requireAuth,
  [
    body('type').isIn(['text', 'image', 'offer', 'counter_offer']),
    body('content').optional().trim(),
    body('offer_amount').optional().isFloat({ min: 0 })
  ],
  validate,
  ctrl.sendMessage
)

// Répondre à une offre (accepter / refuser / contre-offre)
router.patch('/:id/messages/:msgId/offer',
  requireAuth,
  [body('action').isIn(['accept', 'reject', 'counter'])],
  validate,
  ctrl.respondToOffer
)

// Valider une transaction
router.post('/:id/validate', requireAuth, ctrl.validateTransaction)

// Signaler une conversation
router.post('/:id/report', requireAuth, ctrl.reportConversation)

module.exports = router
