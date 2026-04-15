const express = require('express')
const { body } = require('express-validator')
const router  = express.Router()
const ctrl    = require('../controllers/reportController')
const { requireAuth } = require('../middleware/auth')
const { validate }    = require('../middleware/validate')

// Signaler une annonce
router.post('/listing',
  requireAuth,
  [
    body('listing_id').isUUID(),
    body('reason').isLength({ min: 5, max: 500 }).trim()
  ],
  validate,
  ctrl.reportListing
)

// Signaler un message
router.post('/message',
  requireAuth,
  [
    body('message_id').isUUID(),
    body('reason').isLength({ min: 5, max: 500 }).trim()
  ],
  validate,
  ctrl.reportMessage
)

module.exports = router
