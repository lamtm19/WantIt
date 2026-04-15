const express = require('express')
const { body } = require('express-validator')
const router  = express.Router()
const ctrl    = require('../controllers/authController')
const { requireAuth } = require('../middleware/auth')
const { validate }    = require('../middleware/validate')

router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Mot de passe minimum 8 caractères'),
    body('username').isLength({ min: 3, max: 30 }).trim(),
    body('city').optional().trim(),
    body('postal_code').optional().trim(),
    body('region').optional().trim()
  ],
  validate,
  ctrl.register
)

router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validate,
  ctrl.login
)

router.post('/logout', requireAuth, ctrl.logout)

router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  ctrl.forgotPassword
)

router.post('/reset-password',
  [body('password').isLength({ min: 8 })],
  validate,
  ctrl.resetPassword
)

router.put('/change-password',
  requireAuth,
  [
    body('current_password').notEmpty(),
    body('new_password').isLength({ min: 8 })
  ],
  validate,
  ctrl.changePassword
)

router.delete('/account', requireAuth, ctrl.deleteAccount)

router.get('/me', requireAuth, ctrl.getMe)

router.post('/confirm-email', ctrl.confirmEmail)

router.post('/resend-confirmation',
  [body('email').isEmail().normalizeEmail()],
  validate,
  ctrl.resendConfirmation
)

module.exports = router
