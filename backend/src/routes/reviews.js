const express = require('express')
const { body } = require('express-validator')
const router  = express.Router()
const ctrl    = require('../controllers/reviewController')
const { requireAuth } = require('../middleware/auth')
const { validate }    = require('../middleware/validate')

// Laisser un avis après transaction
router.post('/',
  requireAuth,
  [
    body('transaction_id').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional({ nullable: true }).isLength({ max: 1000 }).trim()
  ],
  validate,
  ctrl.createReview
)

// Modifier un avis
router.put('/:id',
  requireAuth,
  [
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('comment').optional({ nullable: true }).isLength({ max: 1000 }).trim()
  ],
  validate,
  ctrl.updateReview
)

module.exports = router
