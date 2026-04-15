const express = require('express')
const { body } = require('express-validator')
const router  = express.Router()
const ctrl    = require('../controllers/adminController')
const { requireAuth } = require('../middleware/auth')
const { requireAdmin } = require('../middleware/admin')
const { validate }     = require('../middleware/validate')

// Toutes les routes admin nécessitent auth + admin
router.use(requireAuth, requireAdmin)

// Dashboard stats
router.get('/stats', ctrl.getStats)

// Utilisateurs
router.get('/users',           ctrl.getUsers)
router.patch('/users/:id/ban', [body('reason').optional().trim()], validate, ctrl.banUser)
router.patch('/users/:id/unban', ctrl.unbanUser)
router.delete('/users/:id',    ctrl.deleteUser)

// Annonces
router.get('/listings',         ctrl.getListings)
router.delete('/listings/:id',  ctrl.deleteListing)

// Signalements
router.get('/reports',                  ctrl.getReports)
router.patch('/reports/:id/review',     [body('action').isIn(['dismiss', 'action']), body('note').optional()], validate, ctrl.reviewReport)

// Catégories
router.get('/categories',                   ctrl.getCategories)
router.post('/categories',                  [body('name').isLength({ min: 2 }).trim()], validate, ctrl.createCategory)
router.put('/categories/:id',               [body('name').optional().trim()], validate, ctrl.updateCategory)
router.delete('/categories/:id',            ctrl.deleteCategory)

// Marques
router.get('/brands',                       ctrl.getBrands)
router.patch('/brands/:id/approve',         ctrl.approveBrand)
router.delete('/brands/:id',                ctrl.deleteBrand)

// Mots interdits
router.get('/forbidden-words',              ctrl.getForbiddenWords)
router.post('/forbidden-words',             [body('word').isLength({ min: 2 }).trim().toLowerCase()], validate, ctrl.addForbiddenWord)
router.delete('/forbidden-words/:id',       ctrl.deleteForbiddenWord)

// Conversations signalées
router.get('/conversations/flagged',        ctrl.getFlaggedConversations)

module.exports = router
