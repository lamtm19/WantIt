const express = require('express')
const { body, query } = require('express-validator')
const router = express.Router()
const ctrl   = require('../controllers/listingController')
const { requireAuth, optionalAuth } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

// Récupérer toutes les annonces (avec filtres)
router.get('/', optionalAuth, ctrl.getListings)

// Recherche full-text
router.get('/search', optionalAuth, ctrl.searchListings)

// Annonces d'un utilisateur
router.get('/user/:userId', ctrl.getUserListings)

// Mes annonces
router.get('/mine', requireAuth, ctrl.getMyListings)

// Détail d'une annonce
router.get('/:id', optionalAuth, ctrl.getListing)

// Créer une annonce
router.post('/',
  requireAuth,
  [
    body('title').isLength({ min: 3, max: 200 }).trim(),
    body('category_id').optional().isUUID(),
    body('price_min').isFloat({ min: 0 }),
    body('price_max').isFloat({ min: 0 }),
    body('max_distance_km').isInt({ min: 1 }),
    body('conditions').isArray({ min: 1 }),
    body('is_urgent').optional().isBoolean()
  ],
  validate,
  ctrl.createListing
)

// Modifier une annonce
router.put('/:id',
  requireAuth,
  [
    body('title').optional().isLength({ min: 3, max: 200 }).trim(),
    body('price_min').optional().isFloat({ min: 0 }),
    body('price_max').optional().isFloat({ min: 0 })
  ],
  validate,
  ctrl.updateListing
)

// Changer le statut (trouvée / annulée)
router.patch('/:id/status',
  requireAuth,
  [body('status').isIn(['active', 'found', 'cancelled'])],
  validate,
  ctrl.updateStatus
)

// Supprimer une annonce
router.delete('/:id', requireAuth, ctrl.deleteListing)

// Upload d'images
router.post('/:id/images', requireAuth, ctrl.uploadImages)

// Supprimer une image
router.delete('/:id/images/:imageId', requireAuth, ctrl.deleteImage)

module.exports = router
