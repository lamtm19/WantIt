const express = require('express')
const { body } = require('express-validator')
const router  = express.Router()
const ctrl    = require('../controllers/userController')
const { requireAuth } = require('../middleware/auth')
const { validate }    = require('../middleware/validate')

// Profil public
router.get('/:id', ctrl.getProfile)

// Mettre à jour son profil
router.put('/me',
  requireAuth,
  [
    body('username').optional().isLength({ min: 3, max: 30 }).trim(),
    body('city').optional().trim(),
    body('postal_code').optional().trim(),
    body('region').optional().trim()
  ],
  validate,
  ctrl.updateProfile
)

// Upload avatar
router.post('/me/avatar', requireAuth, ctrl.uploadAvatar)

// Note d'un utilisateur
router.get('/:id/rating', ctrl.getUserRating)

// Avis reçus
router.get('/:id/reviews', ctrl.getUserReviews)

// Bloquer un utilisateur
router.post('/:id/block', requireAuth, ctrl.blockUser)

// Débloquer un utilisateur
router.delete('/:id/block', requireAuth, ctrl.unblockUser)

// Liste des utilisateurs bloqués
router.get('/me/blocked', requireAuth, ctrl.getBlockedUsers)

// Signaler un utilisateur
router.post('/:id/report', requireAuth, ctrl.reportUser)

module.exports = router
